ACTUALIZACIÓN: STOCK Y VENTA POR PACKS

ANTES DE USAR ESTA VERSIÓN:
1. Abrí Supabase > SQL Editor.
2. Ejecutá el archivo 04_inventory_promotions_migration.sql completo.
3. Recién después publicá/subí estos archivos.

QUÉ INCLUYE ESTA ENTREGA:
- En alta/edición de productos se puede activar o desactivar el control de stock.
- Stock expresado en unidades individuales.
- Venta individual opcional.
- Venta por pack opcional y cantidad de unidades por pack configurable libremente (mínimo 2).
- El catálogo muestra disponibilidad cuando el control de stock está activo.
- El carrito permite agregar packs y valida stock disponible en el navegador.
- Se corrigió el agregado de las promociones existentes para que resuelvan los productos por nombre cuando Supabase usa UUID como identificador.
- Botón para volver al catálogo desde la pantalla de login.

IMPORTANTE - ALCANCE Y SEGURIDAD:
Esta versión todavía NO implementa reservas transaccionales de stock ni confirmación/cancelación de pedidos desde WhatsApp. El carrito no debe descontar stock definitivo: abrir WhatsApp no confirma una venta. La validación actual del carrito es orientativa y se realiza en el navegador; no evita por sí sola ventas simultáneas. Para producción hay que incorporar tabla de pedidos/reservas y funciones RPC transaccionales en Supabase, además de un flujo para que el comercio confirme o cancele el pedido.

Las promociones existentes del catálogo ya agregan productos al carrito. Esta versión todavía no incorpora un constructor de promociones nuevas desde el panel administrativo.
