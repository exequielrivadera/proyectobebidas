# Recordatorios de pedidos

1. Ejecutá `08_order_reminder_extensions.sql` después de `07_orders_reservations_inventory.sql`.
2. Publicá todos los archivos del sitio.
3. El panel consulta pedidos cada 5 segundos mientras está abierto. Cuando una reserva pendiente está a 60 segundos o menos de vencer, aparece una ventana obligatoria.
4. Primer aviso: confirmar venta o extender 5 minutos. Desde el segundo aviso también permite cancelar definitivamente.
5. La cancelación libera la reserva y conserva el pedido en el historial.

Importante: el recordatorio aparece en los paneles administrativos que estén abiertos y conectados. No es una notificación push del navegador ni despierta una computadora cerrada. La reserva y sus cambios se guardan en Supabase. La limpieza automática de reservas vencidas sigue dependiendo de la función de liberación invocada por el flujo de pedidos; para limpieza puntual aun cuando nadie use el panel, configurar pg_cron o un scheduler externo.
