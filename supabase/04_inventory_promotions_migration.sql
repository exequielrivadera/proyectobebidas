-- Migración de inventario y modalidades de venta para productos.
-- Ejecutar una sola vez en Supabase > SQL Editor.
alter table public.products
  add column if not exists stock_enabled boolean not null default false,
  add column if not exists stock_quantity integer not null default 0 check (stock_quantity >= 0),
  add column if not exists sell_individual boolean not null default true,
  add column if not exists sell_packs boolean not null default false,
  add column if not exists pack_units integer null check (pack_units is null or pack_units >= 2);

-- Evita configuraciones inconsistentes de packs.
alter table public.products drop constraint if exists products_pack_configuration_check;
alter table public.products add constraint products_pack_configuration_check
  check ((sell_packs = false) or (pack_units is not null and pack_units >= 2));

-- NOTA: esta migración agrega campos de inventario y packs.
-- Las reservas/ventas definitivas requieren una tabla de pedidos y funciones RPC
-- transaccionales; no se descuenta stock por abrir WhatsApp.
