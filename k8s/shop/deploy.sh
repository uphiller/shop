#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/shop.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Copy shop.env.example to shop.env and fill values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

require() {
  local name=$1
  if [[ -z "${!name:-}" ]]; then
    echo "Required variable ${name} is empty in shop.env"
    exit 1
  fi
}

require SHOP_HOSTNAME
require ADMIN_HOSTNAME
require SHOP_IMAGE
require AUTH_SECRET
require AUTH_URL
require AUTH_KEYCLOAK_ID
require AUTH_KEYCLOAK_SECRET
require AUTH_KEYCLOAK_ISSUER

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
if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}")
fi
if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}")
fi
if [[ -n "${ADMIN_EMAILS:-}" ]]; then
  SUPABASE_ENV_ARGS+=(--from-literal=ADMIN_EMAILS="${ADMIN_EMAILS}")
fi
SUPABASE_ENV_ARGS+=(
  --from-literal=SHOP_HOSTNAME="${SHOP_HOSTNAME}"
  --from-literal=ADMIN_HOSTNAME="${ADMIN_HOSTNAME}"
)

export SHOP_HOSTNAME ADMIN_HOSTNAME SHOP_IMAGE AUTH_URL

echo "Building ${SHOP_IMAGE} from ${REPO_ROOT}/nextjs ..."
docker build -t "${SHOP_IMAGE}" "${REPO_ROOT}/nextjs"

echo "Importing image into k3s containerd ..."
docker save "${SHOP_IMAGE}" | sudo k3s ctr images import -

kubectl apply -f "${SCRIPT_DIR}/../namespace.yaml"

kubectl delete secret shop-next-auth -n shop --ignore-not-found
kubectl create secret generic shop-next-auth -n shop \
  --from-literal=AUTH_SECRET="${AUTH_SECRET}" \
  --from-literal=AUTH_URL="${AUTH_URL}" \
  --from-literal=AUTH_KEYCLOAK_ID="${AUTH_KEYCLOAK_ID}" \
  --from-literal=AUTH_KEYCLOAK_SECRET="${AUTH_KEYCLOAK_SECRET}" \
  --from-literal=AUTH_KEYCLOAK_ISSUER="${AUTH_KEYCLOAK_ISSUER}" \
  "${SUPABASE_ENV_ARGS[@]}"

envsubst '${SHOP_IMAGE}' < "${SCRIPT_DIR}/shop-next.yaml" | kubectl apply -f -
envsubst '${SHOP_HOSTNAME}' < "${SCRIPT_DIR}/ingress.yaml" | kubectl apply -f -

kubectl rollout restart deployment/shop-next -n shop
kubectl rollout status deployment/shop-next -n shop --timeout=300s

echo "Shop Next.js deployed."
echo "  Shop:    https://${SHOP_HOSTNAME}/"
echo "  Admin:   deploy with k8s/admin/deploy.sh (https://${ADMIN_HOSTNAME}/)"
echo "  Cluster: http://shop-next.shop.svc.cluster.local:3000"
