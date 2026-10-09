#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/supabase.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Copy supabase.env.example to supabase.env and fill values."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

require() {
  local name=$1
  if [[ -z "${!name:-}" ]]; then
    echo "Required variable ${name} is empty in supabase.env"
    exit 1
  fi
}

require KC_DB_USERNAME
require KC_DB_PASSWORD
require KC_BOOTSTRAP_ADMIN_USERNAME
require KC_BOOTSTRAP_ADMIN_PASSWORD
require KEYCLOAK_HOSTNAME

if [[ -z "${KC_DB_URL:-}" ]]; then
  require SUPABASE_DB_HOST
  SUPABASE_DB_PORT="${SUPABASE_DB_PORT:-5432}"
  SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-postgres}"
  KC_DB_URL="jdbc:postgresql://${SUPABASE_DB_HOST}:${SUPABASE_DB_PORT}/${SUPABASE_DB_NAME}?sslmode=require"
fi

if [[ ! "$KC_DB_URL" =~ jdbc:postgresql://.+/[^/]+ ]]; then
  echo "KC_DB_URL must include host, port, and database, e.g.:"
  echo '  jdbc:postgresql://db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require'
  exit 1
fi

export KEYCLOAK_HOSTNAME

kubectl apply -f "${SCRIPT_DIR}/../namespace.yaml"

kubectl delete secret keycloak -n shop --ignore-not-found
kubectl create secret generic keycloak -n shop \
  --from-literal=KC_DB_URL="${KC_DB_URL}" \
  --from-literal=KC_DB_USERNAME="${KC_DB_USERNAME}" \
  --from-literal=KC_DB_PASSWORD="${KC_DB_PASSWORD}" \
  --from-literal=KC_BOOTSTRAP_ADMIN_USERNAME="${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  --from-literal=KC_BOOTSTRAP_ADMIN_PASSWORD="${KC_BOOTSTRAP_ADMIN_PASSWORD}"

envsubst '${KEYCLOAK_HOSTNAME}' < "${SCRIPT_DIR}/keycloak.yaml" | kubectl apply -f -
envsubst '${KEYCLOAK_HOSTNAME}' < "${SCRIPT_DIR}/ingress.yaml" | kubectl apply -f -

echo "Keycloak deployed. Admin: https://${KEYCLOAK_HOSTNAME}"
