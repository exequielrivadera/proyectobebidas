-- STOCK DE PRUEBA PARA EL CATÁLOGO ACTUAL
-- Ejecutar UNA SOLA VEZ después de 04_inventory_promotions_migration.sql.
-- Los valores son ficticios y solo sirven para simulaciones.
-- No modifica productos inactivos ni productos que ya tengan stock habilitado.

with ranked_products as (
  select
    id,
    category,
    lower(name) as product_name,
    row_number() over (partition by category order by created_at nulls last, name, id) as item_number
  from public.products
  where active = true
    and tenant_id = (select id from public.tenants where slug = 'distribuidora' limit 1)
    and coalesce(stock_enabled, false) = false
), demo_quantities as (
  select
    id,
    case
      when category = 'aguas' then 48 + ((item_number - 1) % 4) * 12
      when category = 'gaseosas' then 24 + ((item_number - 1) % 4) * 12
      when category = 'cervezas' then 36 + ((item_number - 1) % 5) * 12
      when category = 'vodkas' then 18 + ((item_number - 1) % 3) * 6
      when category = 'fernet' then 24 + ((item_number - 1) % 3) * 6
      when category = 'jugos' then 24 + ((item_number - 1) % 4) * 12
      else 20 + ((item_number - 1) % 4) * 5
    end::integer as quantity
  from ranked_products
)
update public.products as p
set
  stock_enabled = true,
  stock_quantity = d.quantity,
  updated_at = now()
from demo_quantities as d
where p.id = d.id;

-- Resumen de los stocks de prueba aplicados.
select name, category, stock_quantity as stock_de_prueba, sell_individual, sell_packs, pack_units
from public.products
where active = true
  and tenant_id = (select id from public.tenants where slug = 'distribuidora' limit 1)
order by category, name;
