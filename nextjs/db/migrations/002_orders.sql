-- Run against Supabase / Postgres after 001 cart schema.
-- Stores completed checkouts and line-item snapshots.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  stripe_checkout_session_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'failed')),
  subtotal integer not null check (subtotal >= 0),
  currency text not null default 'krw',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.order_items to service_role;
