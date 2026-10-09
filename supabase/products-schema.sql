-- Shop catalog (public schema). Run in Supabase SQL Editor or via psql.
-- Idempotent: safe to re-run.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  category text not null default '',
  badge text check (badge is null or badge in ('new', 'sale', 'bestseller')),
  created_at timestamptz not null default now()
);

create index if not exists products_created_at_idx on public.products (created_at desc);

alter table public.products enable row level security;

-- PostgREST (anon / authenticated / service_role) needs table privileges.
grant select on public.products to anon, authenticated, service_role;
grant insert, update, delete on public.products to service_role;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (true);

-- Seed sample catalog (skip if any row exists)
insert into public.products (name, description, price, stock, image_url, category, badge)
select *
from (
  values
    (
      'Merino Crew Sweater',
      'Soft merino wool, relaxed fit for everyday layering.',
      89000,
      24,
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
      'Apparel',
      'bestseller'::text
    ),
    (
      'Canvas Day Tote',
      'Sturdy organic cotton with interior pocket.',
      42000,
      40,
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80',
      'Bags',
      'new'::text
    ),
    (
      'Ceramic Pour-Over Set',
      'Hand-glazed dripper and carafe for slow mornings.',
      68000,
      15,
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      'Home',
      null::text
    ),
    (
      'Minimal Leather Sneakers',
      'Vegetable-tanned leather, cushioned sole.',
      128000,
      12,
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
      'Footwear',
      'sale'::text
    ),
    (
      'Studio Desk Lamp',
      'Warm dimmable LED, matte aluminum arm.',
      95000,
      18,
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      'Home',
      null::text
    ),
    (
      'Linen Sheet Set',
      'Breathable European flax, stone-washed finish.',
      156000,
      8,
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
      'Home',
      'new'::text
    )
) as seed (name, description, price, stock, image_url, category, badge)
where not exists (select 1 from public.products limit 1);
