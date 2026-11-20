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

STOCK FICTICIO PARA SIMULACIONES DEL CATÁLOGO ACTUAL:
1. Después de ejecutar la migración 04, ejecutá UNA SOLA VEZ `05_demo_stock_seed.sql`.
2. Este script activa el control de stock en los productos activos actuales de la empresa Distribuidora y asigna cantidades ficticias según categoría.
3. Los valores son de prueba, no representan existencias reales. No vuelvas a ejecutar el script después de empezar a ajustar stocks manualmente: solo inicializa productos que todavía tienen el control de stock desactivado.
4. El catálogo mostrará Disponible / Pocas unidades / Sin stock y el carrito validará las cantidades y packs contra el stock leído de Supabase.
5. IMPORTANTE: agregar al carrito no descuenta stock. Abrir WhatsApp tampoco confirma una venta. La deducción definitiva y la liberación automática de reservas requieren el flujo transaccional de pedidos, que todavía no está implementado. Para estas pruebas actuales, el carrito permite simular selección y validar disponibilidad, no cerrar una venta real.
