-- Cart + app users (public schema). Run after products-schema.sql.
-- Idempotent: safe to re-run.
--
-- users: Keycloak identity mapped on first login (keycloak_sub = OIDC sub).
-- cart_items: one row per user + product; quantity merged via upsert in app code.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  keycloak_sub text not null,
  email text not null default '',
  display_name text not null default '',
  created_at timestamptz not null default now(),
  constraint users_keycloak_sub_unique unique (keycloak_sub)
);

create index if not exists users_keycloak_sub_idx on public.users (keycloak_sub);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_user_product_unique unique (user_id, product_id)
);

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);
create index if not exists cart_items_product_id_idx on public.cart_items (product_id);

-- Server-only access (Next.js service role). No anon/authenticated grants.
alter table public.users enable row level security;
alter table public.cart_items enable row level security;

grant select, insert, update, delete on public.users to service_role;
grant select, insert, update, delete on public.cart_items to service_role;
