-- Pedidos, reservas temporales y movimientos de inventario.
-- Ejecutar DESPUÉS de 01_schema.sql y 04_inventory_promotions_migration.sql.
-- Las reservas vencidas se limpian al crear un pedido y al consultar/gestionar pedidos.

alter table public.products
  add column if not exists stock_reserved integer not null default 0 check (stock_reserved >= 0),
  add column if not exists stock_minimum integer not null default 5 check (stock_minimum >= 0);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_number bigint generated always as identity,
  customer_name text,
  customer_phone text,
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','expired')),
  reservation_expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);
create index if not exists orders_tenant_created_idx on public.orders(tenant_id, created_at desc);
create index if not exists orders_pending_expiry_idx on public.orders(reservation_expires_at) where status='pending';

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_multiplier integer not null default 1 check (unit_multiplier > 0),
  units integer not null check (units > 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id),
  order_id uuid references public.orders(id) on delete set null,
  movement_type text not null check (movement_type in ('restock','adjustment_in','adjustment_out','sale','reservation_release')),
  quantity integer not null check (quantity > 0),
  reason text,
  supplier text,
  reference text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_tenant_created_idx on public.stock_movements(tenant_id, created_at desc);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "tenant admins read own orders" on public.orders;
create policy "tenant admins read own orders" on public.orders for select to authenticated
using (tenant_id = public.current_tenant_id() and public.current_role() in ('tenant_admin','platform_admin'));
drop policy if exists "tenant admins read own order items" on public.order_items;
create policy "tenant admins read own order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id=order_id and o.tenant_id=public.current_tenant_id()));
drop policy if exists "tenant admins read own stock movements" on public.stock_movements;
create policy "tenant admins read own stock movements" on public.stock_movements for select to authenticated
using (tenant_id=public.current_tenant_id() and public.current_role() in ('tenant_admin','platform_admin'));

grant select on public.orders, public.order_items, public.stock_movements to authenticated;
grant usage, select on sequence public.orders_order_number_seq to authenticated, anon;

-- Libera reservas vencidas. Se invoca dentro de las funciones RPC, no depende de pg_cron.
create or replace function public.release_expired_order_reservations(p_tenant_id uuid)
returns integer language plpgsql security definer set search_path=public
as $$
declare r record; released integer := 0; item record;
begin
  for r in select * from public.orders where tenant_id=p_tenant_id and status='pending' and reservation_expires_at <= now() for update loop
    for item in select * from public.order_items where order_id=r.id loop
      update public.products set stock_reserved=greatest(0,stock_reserved-item.units), updated_at=now() where id=item.product_id and tenant_id=p_tenant_id;
      insert into public.stock_movements(tenant_id,product_id,order_id,movement_type,quantity,reason)
      values(p_tenant_id,item.product_id,r.id,'reservation_release',item.units,'Reserva vencida');
    end loop;
    update public.orders set status='expired',updated_at=now() where id=r.id;
    released := released + 1;
  end loop;
  return released;
end; $$;

-- Crea pedido y reserva stock en una única transacción.
create or replace function public.create_reserved_order(
  p_tenant_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_items jsonb,
  p_notes text default null
) returns uuid language plpgsql security definer set search_path=public
as $$
declare t uuid; new_order uuid; line jsonb; p public.products%rowtype; qty integer; mult integer; units integer;
begin
  if p_tenant_slug <> 'distribuidora' then raise exception 'Comercio no habilitado para pedidos públicos'; end if;
  select id into t from public.tenants where slug=p_tenant_slug;
  if t is null then raise exception 'Comercio no encontrado'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'El pedido está vacío'; end if;
  perform public.release_expired_order_reservations(t);
  insert into public.orders(tenant_id,customer_name,customer_phone,notes)
  values(t,left(coalesce(p_customer_name,''),120),left(coalesce(p_customer_phone,''),40),left(coalesce(p_notes,''),500)) returning id into new_order;
  for line in select * from jsonb_array_elements(p_items) loop
    qty := greatest(0,coalesce((line->>'quantity')::integer,0));
    mult := greatest(1,coalesce((line->>'unit_multiplier')::integer,1));
    if qty < 1 then raise exception 'Cantidad inválida'; end if;
    select * into p from public.products where id=(line->>'product_id')::uuid and tenant_id=t and active=true for update;
    if not found then raise exception 'Un producto ya no está disponible'; end if;
    if mult > 1 and (p.sell_packs is not true or p.pack_units <> mult) then raise exception 'La presentación por pack cambió'; end if;
    if mult = 1 and p.sell_individual is false then raise exception 'El producto no se vende por unidad'; end if;
    units := qty * mult;
    if p.stock_enabled and (p.stock_quantity-p.stock_reserved) < units then raise exception 'Stock insuficiente para %',p.name; end if;
    if p.stock_enabled then update public.products set stock_reserved=stock_reserved+units,updated_at=now() where id=p.id; end if;
    insert into public.order_items(order_id,product_id,product_name,quantity,unit_multiplier,units)
    values(new_order,p.id,p.name,qty,mult,units);
  end loop;
  return new_order;
end; $$;

create or replace function public.set_order_status(p_order_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public
as $$
declare o public.orders%rowtype; item record;
begin
  if auth.uid() is null or public.current_role() not in ('tenant_admin','platform_admin') then raise exception 'No autorizado'; end if;
  if p_status not in ('confirmed','cancelled') then raise exception 'Estado inválido'; end if;
  select * into o from public.orders where id=p_order_id and tenant_id=public.current_tenant_id() for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if o.status <> 'pending' then raise exception 'El pedido ya fue procesado'; end if;
  if o.reservation_expires_at <= now() then
    perform public.release_expired_order_reservations(o.tenant_id);
    return;
  end if;
  for item in select * from public.order_items where order_id=o.id loop
    if p_status='confirmed' then
      update public.products set stock_quantity=case when stock_enabled then stock_quantity-item.units else stock_quantity end,
        stock_reserved=case when stock_enabled then greatest(0,stock_reserved-item.units) else stock_reserved end, updated_at=now()
      where id=item.product_id and tenant_id=o.tenant_id;
      insert into public.stock_movements(tenant_id,product_id,order_id,movement_type,quantity,reason,created_by)
      values(o.tenant_id,item.product_id,o.id,'sale',item.units,'Venta confirmada',auth.uid());
    else
      update public.products set stock_reserved=greatest(0,stock_reserved-item.units),updated_at=now()
      where id=item.product_id and tenant_id=o.tenant_id and stock_enabled;
      insert into public.stock_movements(tenant_id,product_id,order_id,movement_type,quantity,reason,created_by)
      values(o.tenant_id,item.product_id,o.id,'reservation_release',item.units,'Pedido cancelado',auth.uid());
    end if;
  end loop;
  update public.orders set status=p_status,updated_at=now(),confirmed_at=case when p_status='confirmed' then now() else confirmed_at end,
    cancelled_at=case when p_status='cancelled' then now() else cancelled_at end where id=o.id;
end; $$;

create or replace function public.restock_product(
 p_product_id uuid,p_quantity integer,p_movement_type text default 'restock',p_reason text default null,
 p_supplier text default null,p_reference text default null,p_notes text default null
) returns void language plpgsql security definer set search_path=public
as $$
declare p public.products%rowtype;
begin
 if auth.uid() is null or public.current_role() not in ('tenant_admin','platform_admin') then raise exception 'No autorizado'; end if;
 if p_quantity <= 0 or p_quantity > 1000000 then raise exception 'Cantidad inválida'; end if;
 if p_movement_type not in ('restock','adjustment_in','adjustment_out') then raise exception 'Tipo de movimiento inválido'; end if;
 select * into p from public.products where id=p_product_id and tenant_id=public.current_tenant_id() for update;
 if not found then raise exception 'Producto no encontrado'; end if;
 if p_movement_type='adjustment_out' and p.stock_enabled and p.stock_quantity-p.stock_reserved < p_quantity then raise exception 'No se puede retirar stock reservado o inexistente'; end if;
 update public.products set stock_enabled=true,
  stock_quantity=case when p_movement_type='adjustment_out' then stock_quantity-p_quantity else stock_quantity+p_quantity end,
  updated_at=now() where id=p.id;
 insert into public.stock_movements(tenant_id,product_id,movement_type,quantity,reason,supplier,reference,notes,created_by)
 values(p.tenant_id,p.id,p_movement_type,p_quantity,left(p_reason,160),left(p_supplier,120),left(p_reference,80),left(p_notes,500),auth.uid());
end; $$;

grant execute on function public.create_reserved_order(text,text,text,jsonb,text) to anon,authenticated;
grant execute on function public.set_order_status(uuid,text) to authenticated;
grant execute on function public.restock_product(uuid,integer,text,text,text,text,text) to authenticated;
grant execute on function public.release_expired_order_reservations(uuid) to authenticated;
