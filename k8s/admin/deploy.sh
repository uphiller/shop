#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/admin.env"
SHOP_ENV="${SCRIPT_DIR}/../shop/shop.env"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$SHOP_ENV" ]]; then
    echo "Missing ${ENV_FILE}; using k8s/shop/shop.env for shared auth values."
    ENV_FILE="$SHOP_ENV"
  else
    echo "Missing ${ENV_FILE}. Copy admin.env.example to admin.env and fill values."
    exit 1
  fi
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

merge_env_from_shop() {
  local key=$1
  if [[ -n "${!key:-}" ]]; then
    return
  fi
  if [[ ! -f "$SHOP_ENV" ]]; then
    return
  fi
  local line
  line="$(grep -E "^${key}=" "$SHOP_ENV" | tail -1 || true)"
  if [[ -n "$line" ]]; then
    export "$line"
  fi
}

for _key in NEXT_PUBLIC_SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_ANON_KEY DATABASE_URL; do
  merge_env_from_shop "$_key"
done

require() {
  local name=$1
  if [[ -z "${!name:-}" ]]; then
    echo "Required variable ${name} is empty in env file"
    exit 1
  fi
}

require ADMIN_HOSTNAME
require ADMIN_IMAGE
require AUTH_SECRET
require AUTH_KEYCLOAK_ID
require AUTH_KEYCLOAK_SECRET
require AUTH_KEYCLOAK_ISSUER

ADMIN_AUTH_URL="${ADMIN_AUTH_URL:-https://${ADMIN_HOSTNAME}}"

SUPABASE_ENV_ARGS=()
if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}")
fi
if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}")
fi
if [[ -n "${SUPABASE_ANON_KEY:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}")
fi
if [[ -n "${DATABASE_URL:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=DATABASE_URL="${DATABASE_URL}")
fi
if [[ -n "${ADMIN_EMAILS:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=ADMIN_EMAILS="${ADMIN_EMAILS}")
fi
if [[ -n "${SHOP_HOSTNAME:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=SHOP_HOSTNAME="${SHOP_HOSTNAME}")
fi
SUPABASE_ENV_ARGS+=(
  --from-literal=ADMIN_HOSTNAME="${ADMIN_HOSTNAME}"
)

export ADMIN_HOSTNAME ADMIN_IMAGE

echo "Building ${ADMIN_IMAGE} from ${REPO_ROOT}/admin ..."
docker build -t "${ADMIN_IMAGE}" "${REPO_ROOT}/admin"

echo "Importing image into k3s containerd ..."
docker save "${ADMIN_IMAGE}" | sudo k3s ctr images import -

kubectl apply -f "${SCRIPT_DIR}/../namespace.yaml"

kubectl delete secret shop-admin-auth -n shop --ignore-not-found
kubectl create secret generic shop-admin-auth -n shop \
  --from-literal=AUTH_SECRET="${AUTH_SECRET}" \
  --from-literal=AUTH_URL="${ADMIN_AUTH_URL}" \
  --from-literal=AUTH_KEYCLOAK_ID="${AUTH_KEYCLOAK_ID}" \
  --from-literal=AUTH_KEYCLOAK_SECRET="${AUTH_KEYCLOAK_SECRET}" \
  --from-literal=AUTH_KEYCLOAK_ISSUER="${AUTH_KEYCLOAK_ISSUER}" \
  "${SUPABASE_ENV_ARGS[@]}"

envsubst '${ADMIN_IMAGE}' < "${SCRIPT_DIR}/admin-next.yaml" | kubectl apply -f -
envsubst '${ADMIN_HOSTNAME}' < "${SCRIPT_DIR}/ingress.yaml" | kubectl apply -f -

kubectl rollout restart deployment/shop-admin -n shop
kubectl rollout status deployment/shop-admin -n shop --timeout=300s

echo "Admin Next.js deployed."
echo "  Admin:   https://${ADMIN_HOSTNAME}/"
echo "  Cluster: http://shop-admin.shop.svc.cluster.local:3000"
