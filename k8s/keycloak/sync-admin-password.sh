#!/usr/bin/env bash
# KC_BOOTSTRAP_* env is only applied on first DB init. This script resets the master
# realm admin password to match supabase.env (KC_BOOTSTRAP_ADMIN_*).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/supabase.env"
JOB_NAME=keycloak-bootstrap-admin

source_env() {
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  require KC_DB_USERNAME
  require KC_DB_PASSWORD
  require KC_BOOTSTRAP_ADMIN_USERNAME
  require KC_BOOTSTRAP_ADMIN_PASSWORD
  require KC_DB_URL
}

require() {
  local name=$1
  if [[ -z "${!name:-}" ]]; then
    echo "Required variable ${name} is empty in supabase.env"
    exit 1
  fi
}

jdbc_to_psql_uri() {
  local jdbc=$1
  local rest=${jdbc#jdbc:postgresql://}
  local hostport=${rest%%/*}
  local dbquery=${rest#*/}
  local db=${dbquery%%\?*}
  echo "postgresql://${KC_DB_USERNAME}:${KC_DB_PASSWORD}@${hostport}/${db}?sslmode=require"
}

delete_master_admin() {
  local uri
  uri=$(jdbc_to_psql_uri "$KC_DB_URL")
  echo "Removing existing master admin user (if any)..."
  psql "$uri" -v ON_ERROR_STOP=1 -v admin_user="${KC_BOOTSTRAP_ADMIN_USERNAME}" <<'SQL'
DELETE FROM keycloak.user_attribute WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.user_required_action WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.user_role_mapping WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.credential WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.federated_identity WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.user_consent WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.user_group_membership WHERE user_id IN (
  SELECT u.id FROM keycloak.user_entity u
  JOIN keycloak.realm r ON r.id = u.realm_id
  WHERE r.name = 'master' AND u.username = :'admin_user'
);
DELETE FROM keycloak.user_entity u
USING keycloak.realm r
WHERE u.realm_id = r.id AND r.name = 'master' AND u.username = :'admin_user';
SQL
}

run_bootstrap_job() {
  kubectl delete job "$JOB_NAME" -n shop --ignore-not-found
  kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: ${JOB_NAME}
  namespace: shop
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: bootstrap
          image: quay.io/keycloak/keycloak:26.0
          command:
            - /opt/keycloak/bin/kc.sh
            - bootstrap-admin
            - user
            - --username
            - ${KC_BOOTSTRAP_ADMIN_USERNAME}
            - --password:env
            - KC_BOOTSTRAP_ADMIN_PASSWORD
          env:
            - name: KC_DB
              value: postgres
            - name: KC_DB_SCHEMA
              value: keycloak
            - name: KC_DB_URL
              valueFrom:
                secretKeyRef:
                  name: keycloak
                  key: KC_DB_URL
            - name: KC_DB_USERNAME
              valueFrom:
                secretKeyRef:
                  name: keycloak
                  key: KC_DB_USERNAME
            - name: KC_DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: keycloak
                  key: KC_DB_PASSWORD
            - name: KC_BOOTSTRAP_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: keycloak
                  key: KC_BOOTSTRAP_ADMIN_PASSWORD
            - name: KC_CACHE
              value: local
EOF
  kubectl wait -n shop --for=condition=complete "job/${JOB_NAME}" --timeout=180s
  kubectl logs -n shop "job/${JOB_NAME}"
}

main() {
  [[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }
  source_env
  "${SCRIPT_DIR}/deploy.sh" >/dev/null
  delete_master_admin
  echo "Scaling Keycloak down for bootstrap job..."
  kubectl scale deployment/keycloak -n shop --replicas=0
  kubectl wait -n shop --for=delete pod -l app=keycloak --timeout=120s || true
  run_bootstrap_job
  kubectl scale deployment/keycloak -n shop --replicas=1
  kubectl rollout status deployment/keycloak -n shop --timeout=300s
  echo "Master admin synced: user=${KC_BOOTSTRAP_ADMIN_USERNAME} (password from supabase.env)"
}

main "$@"
