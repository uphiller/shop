#!/usr/bin/env bash
# Creates shop realm + shop-web OIDC client for Auth.js (idempotent-ish).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KC_ENV="${SCRIPT_DIR}/../keycloak/supabase.env"
SHOP_ENV="${SCRIPT_DIR}/shop.env"

REALM="${KEYCLOAK_REALM:-shop}"
CLIENT_ID="${AUTH_KEYCLOAK_ID:-shop-web}"
SHOP_HOST="${SHOP_HOSTNAME:-shop.bettercodelab.com}"
ADMIN_HOST="${ADMIN_HOSTNAME:-admin.bettercodelab.com}"
KC_ADMIN_USER="${KC_ADMIN_USER:-admin}"
KC_ADMIN_PASS=""

if [[ -f "$KC_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$KC_ENV"
  set +a
  KC_ADMIN_PASS="${KC_BOOTSTRAP_ADMIN_PASSWORD:-}"
  KEYCLOAK_BASE="https://${KEYCLOAK_HOSTNAME}"
fi

if [[ -f "$SHOP_ENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$SHOP_ENV"
  set +a
  SHOP_HOST="${SHOP_HOSTNAME:-$SHOP_HOST}"
  ADMIN_HOST="${ADMIN_HOSTNAME:-$ADMIN_HOST}"
fi

PUBLIC_BASE="${KEYCLOAK_BASE:-https://auth.bettercodelab.com}"
KEYCLOAK_BASE="$PUBLIC_BASE"

if [[ -z "$KC_ADMIN_PASS" ]]; then
  echo "Set KC_BOOTSTRAP_ADMIN_PASSWORD in k8s/keycloak/supabase.env."
  exit 1
fi

# Public Ingress may route to another Keycloak; fall back to shop in-cluster admin API.
if [[ -z "${KEYCLOAK_ADMIN_URL:-}" ]]; then
  if ! curl -sf -X POST "${PUBLIC_BASE}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KC_ADMIN_USER}" \
    -d "password=${KC_ADMIN_PASS}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" >/dev/null 2>&1; then
    echo "Public Keycloak admin unavailable; using kubectl port-forward to shop/keycloak ..."
    kubectl port-forward -n shop svc/keycloak 18080:8080 >/tmp/shop-kc-pf.log 2>&1 &
    PF_PID=$!
    trap 'kill "$PF_PID" 2>/dev/null || true' EXIT
    sleep 2
    KEYCLOAK_BASE="http://127.0.0.1:18080"
  fi
else
  KEYCLOAK_BASE="$KEYCLOAK_ADMIN_URL"
fi

export KEYCLOAK_BASE PUBLIC_BASE KC_ADMIN_USER KC_ADMIN_PASS REALM CLIENT_ID SHOP_HOST ADMIN_HOST

python3 <<'PY'
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

base = os.environ["KEYCLOAK_BASE"].rstrip("/")
user = os.environ["KC_ADMIN_USER"]
password = os.environ["KC_ADMIN_PASS"]
realm = os.environ["REALM"]
client_id = os.environ["CLIENT_ID"]
shop_host = os.environ["SHOP_HOST"]
admin_host = os.environ["ADMIN_HOST"]


def request(method, url, token=None, data=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


token_url = f"{base}/realms/master/protocol/openid-connect/token"
form = urllib.parse.urlencode(
    {
        "username": user,
        "password": password,
        "grant_type": "password",
        "client_id": "admin-cli",
    }
).encode()
req = urllib.request.Request(
    token_url,
    data=form,
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    method="POST",
)
with urllib.request.urlopen(req) as resp:
    token = json.load(resp)["access_token"]

realm_url = f"{base}/admin/realms/{realm}"
status, _ = request("GET", realm_url, token)
if status != 200:
    print(f"Creating realm {realm} ...")
    status, body = request(
        "POST",
        f"{base}/admin/realms",
        token,
        {
            "realm": realm,
            "enabled": True,
            "registrationAllowed": False,
            "loginWithEmailAllowed": True,
            "duplicateEmailsAllowed": False,
            "resetPasswordAllowed": True,
        },
    )
    if status not in (201, 204):
        sys.exit(f"Failed to create realm: {status} {body!r}")
else:
    print(f"Realm {realm} already exists.")

clients_url = f"{base}/admin/realms/{realm}/clients?clientId={client_id}"
status, body = request("GET", clients_url, token)
clients = json.loads(body.decode())
client_payload = {
    "clientId": client_id,
    "name": "Shop Next.js",
    "enabled": True,
    "protocol": "openid-connect",
    "publicClient": False,
    "standardFlowEnabled": True,
    "directAccessGrantsEnabled": False,
    "rootUrl": f"https://{shop_host}",
    "baseUrl": f"https://{shop_host}",
    "redirectUris": [
        f"https://{shop_host}/api/auth/callback/keycloak",
        f"https://{admin_host}/api/auth/callback/keycloak",
        "http://localhost:3000/api/auth/callback/keycloak",
        "http://localhost:3001/api/auth/callback/keycloak",
    ],
    "webOrigins": [
        f"https://{shop_host}",
        f"https://{admin_host}",
        "http://localhost:3000",
        "http://localhost:3001",
    ],
}

if not clients:
    print(f"Creating client {client_id} ...")
    status, body = request(
        "POST", f"{base}/admin/realms/{realm}/clients", token, client_payload
    )
    if status not in (201, 204):
        sys.exit(f"Failed to create client: {status} {body!r}")
    status, body = request("GET", clients_url, token)
    clients = json.loads(body.decode())

client_uuid = clients[0]["id"]
client_payload["id"] = client_uuid
print(f"Updating client {client_id} ...")
status, body = request(
    "PUT", f"{base}/admin/realms/{realm}/clients/{client_uuid}", token, client_payload
)
if status not in (204, 200):
    sys.exit(f"Failed to update client: {status} {body!r}")

secret_url = f"{base}/admin/realms/{realm}/clients/{client_uuid}/client-secret"
status, body = request("GET", secret_url, token)
secret = json.loads(body.decode()).get("value")
if not secret:
    request("POST", secret_url, token, {})
    status, body = request("GET", secret_url, token)
    secret = json.loads(body.decode())["value"]

public_base = os.environ.get("PUBLIC_BASE", base).rstrip("/")
issuer = f"{public_base}/realms/{realm}"
print("")
print("Keycloak OIDC client ready.")
print(f"  AUTH_KEYCLOAK_ID={client_id}")
print(f"  AUTH_KEYCLOAK_ISSUER={issuer}")
print(f"  AUTH_KEYCLOAK_SECRET={secret}")
print("")
print("Add AUTH_* and AUTH_SECRET to k8s/shop/shop.env, then ./deploy.sh")
PY
