-- Recordatorios obligatorios y extensiones de reserva para pedidos.
-- Ejecutar DESPUÉS de 07_orders_reservations_inventory.sql.
alter table public.orders add column if not exists reminder_count integer not null default 0 check (reminder_count >= 0);

create or replace function public.extend_order_reservation(p_order_id uuid)
returns timestamptz language plpgsql security definer set search_path=public
as $$
declare o public.orders%rowtype; new_expiry timestamptz;
begin
 if auth.uid() is null or public.current_role() not in ('tenant_admin','platform_admin') then raise exception 'No autorizado'; end if;
 select * into o from public.orders where id=p_order_id and tenant_id=public.current_tenant_id() for update;
 if not found then raise exception 'Pedido no encontrado'; end if;
 if o.status <> 'pending' then raise exception 'El pedido ya fue resuelto'; end if;
 if o.reservation_expires_at <= now() then raise exception 'La reserva ya venció; actualizá los pedidos antes de extenderla'; end if;
 new_expiry := now() + interval '5 minutes';
 update public.orders set reservation_expires_at=new_expiry, reminder_count=reminder_count+1, updated_at=now() where id=o.id;
 return new_expiry;
end; $$;
grant execute on function public.extend_order_reservation(uuid) to authenticated;
