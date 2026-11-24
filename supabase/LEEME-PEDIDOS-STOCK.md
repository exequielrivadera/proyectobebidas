# Pedidos, reservas y control de inventario

## Orden de migración
Ejecutar en Supabase SQL Editor, después de las migraciones anteriores:

1. `07_orders_reservations_inventory.sql`

La migración agrega reservas, mínimo de stock, pedidos, renglones de pedido y movimientos. También crea funciones transaccionales para crear reservas, confirmar/cancelar pedidos y reponer mercadería.

## Flujo implementado
- Al pulsar el botón de WhatsApp, el sitio solicita una reserva en Supabase mediante `create_reserved_order`.
- La función bloquea los productos con `FOR UPDATE`, verifica disponibilidad y reserva unidades en una única transacción.
- El pedido queda pendiente durante 15 minutos.
- En Administración > Pedidos se puede confirmar o cancelar.
- Confirmar descuenta las unidades físicas y libera las reservadas.
- Cancelar libera la reserva.
- Las reservas vencidas se liberan al crear un pedido nuevo o al actualizar el listado de pedidos en Administración.
- Administración > Stock permite buscar/filtrar inventario y reponer mercadería; cada reposición queda en el historial.

## Límites y consideraciones
- El flujo público está limitado al tenant con slug `distribuidora`.
- Para productos con control de stock desactivado, el sistema registra el pedido, pero no reserva ni descuenta unidades.
- El vencimiento se procesa de forma diferida al crear pedidos o cargar el panel; para limpieza exacta incluso si nadie visita el sitio, configurar un cron en Supabase que invoque `release_expired_order_reservations` para el tenant.
- La función de reserva requiere que las políticas y grants previos de `products`, `profiles` y `tenants` estén instalados.
- Revisar las políticas RLS en el proyecto antes de producción. La clave `service_role` nunca debe incluirse en el frontend.
