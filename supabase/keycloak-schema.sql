-- Run once in Supabase SQL Editor before first Keycloak start.
-- Keycloak uses KC_DB_SCHEMA=keycloak; app shop tables stay in public (or another schema).

CREATE SCHEMA IF NOT EXISTS keycloak;

-- Optional: restrict API exposure — Keycloak connects with postgres role via direct connection only.
