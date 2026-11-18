-- Pulso Digital / Distribuidora: esquema inicial multiempresa
create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  role text not null check (role in ('platform_admin','tenant_admin')),
  username text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text not null,
  description text default '',
  image_url text not null,
  barcode text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_tenant_active_idx on public.products(tenant_id, active);
create unique index if not exists products_tenant_barcode_unique on public.products(tenant_id, barcode) where barcode is not null and barcode <> '';

insert into public.tenants(name,slug)
values ('Distribuidora','distribuidora')
on conflict (slug) do nothing;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where user_id = auth.uid() $$;

create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public
as $$ select tenant_id from public.profiles where user_id = auth.uid() $$;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;

-- Catálogo público: solo productos activos del tenant Distribuidora.
create policy "public read active distributor products" on public.products
for select to anon, authenticated
using (active = true and tenant_id = (select id from public.tenants where slug='distribuidora'));

create policy "tenant admins manage own products" on public.products
for all to authenticated
using (public.current_role()='tenant_admin' and tenant_id=public.current_tenant_id())
with check (public.current_role()='tenant_admin' and tenant_id=public.current_tenant_id());

create policy "platform admin manage all products" on public.products
for all to authenticated
using (public.current_role()='platform_admin')
with check (public.current_role()='platform_admin');

create policy "users read own profile" on public.profiles
for select to authenticated using (user_id=auth.uid());
create policy "platform admin read profiles" on public.profiles
for select to authenticated using (public.current_role()='platform_admin');
create policy "platform admin manage tenants" on public.tenants
for all to authenticated using (public.current_role()='platform_admin')
with check (public.current_role()='platform_admin');
create policy "tenant admins read own tenant" on public.tenants
for select to authenticated using (id=public.current_tenant_id());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
for select to anon, authenticated using (bucket_id='product-images');
create policy "tenant admins upload own product images" on storage.objects
for insert to authenticated with check (
 bucket_id='product-images' and
 (public.current_role()='platform_admin' or (public.current_role()='tenant_admin' and (storage.foldername(name))[1]=public.current_tenant_id()::text))
);
create policy "admins update own product images" on storage.objects
for update to authenticated using (
 bucket_id='product-images' and
 (public.current_role()='platform_admin' or (public.current_role()='tenant_admin' and (storage.foldername(name))[1]=public.current_tenant_id()::text))
) with check (
 bucket_id='product-images' and
 (public.current_role()='platform_admin' or (public.current_role()='tenant_admin' and (storage.foldername(name))[1]=public.current_tenant_id()::text))
);
create policy "admins delete own product images" on storage.objects
for delete to authenticated using (
 bucket_id='product-images' and
 (public.current_role()='platform_admin' or (public.current_role()='tenant_admin' and (storage.foldername(name))[1]=public.current_tenant_id()::text))
);
