-- 001_init_schema.sql
-- Creates core tables: products, customers, orders, order_items
-- Enables RLS and adds conservative policies

-- PRODUCTS (public read)
create table if not exists products (
  id text primary key,
  name text not null,
  description text,
  price integer not null,
  weight text,
  image text,
  created_at timestamptz default now()
);

alter table products enable row level security;

-- allow public read for products
create policy "public_select_products" on products
  for select using (true);

-- CUSTOMERS (sensitive: only server/service should read/write)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now()
);

alter table customers enable row level security;

-- No public select policy for customers (reads/writes should go through server)

-- ORDERS and ORDER_ITEMS
create table if not exists orders (
  id text primary key,
  customer_id uuid references customers(id),
  total integer not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text references orders(id) on delete cascade,
  product_id text,
  quantity integer,
  price integer
);

alter table orders enable row level security;
alter table order_items enable row level security;

-- No public select policy for orders/customers: manage via server API

-- NOTE:
-- The Supabase service role bypasses RLS, so server-side API using service_role_key
-- can perform INSERT/UPDATE/DELETE. Client-side should use anon key and RLS.
