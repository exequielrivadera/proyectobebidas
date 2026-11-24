# Distribuidora — catálogo online + panel administrativo

## Qué incluye esta versión
- Catálogo público con carrito y consulta por WhatsApp.
- Panel administrativo dentro de la experiencia actual.
- Inicio de sesión con Supabase Auth.
- Productos guardados en Supabase PostgreSQL.
- Imágenes subidas desde el equipo almacenadas en Supabase Storage.
- Catálogo público que consulta productos activos online y se actualiza cada 30 segundos.
- Roles `platform_admin` y `tenant_admin` aplicados mediante las políticas RLS existentes.

## Configuración ya realizada en el proyecto Supabase
El frontend usa el proyecto configurado en `supabase-config.js` y la clave publicable. No incluir claves `secret` ni `service_role` en el navegador.

La base ya debe tener:
- Tablas `tenants`, `profiles`, `products`.
- Bucket público `product-images`.
- Los perfiles de Pulso Digital (`platform_admin`) y Distribuidora (`tenant_admin`).
- Las políticas RLS y de Storage creadas en el esquema inicial.

No vuelvas a ejecutar los SQL iniciales si ya creaste estas tablas y políticas.

## Prueba
1. Publicá esta carpeta en GitHub Pages o servila con Live Server/HTTPS.
2. Abrí el catálogo y entrá a **Administración**.
3. Iniciá sesión con el usuario y contraseña de Pulso Digital o Distribuidora.
4. Si la tabla `products` está vacía, el primer inicio de sesión carga el catálogo inicial una sola vez.
5. Agregá un producto con una imagen subida desde el equipo; guardalo.
6. Abrí el catálogo en otro dispositivo y esperá hasta 30 segundos o actualizá la página. El producto debe aparecer.
7. Probá editar y eliminar un producto desde el panel.

## Consideraciones
- Los productos y las imágenes subidas se comparten online. La primera carga inicial utiliza las imágenes incluidas en `img/`.
- Las imágenes seleccionadas desde Open Food Facts o por URL externa se guardan como URL externa; las imágenes subidas desde el equipo se almacenan en Supabase Storage.
- La búsqueda de imágenes consulta Open Food Facts; no es una búsqueda universal.
- La sesión queda persistida en el navegador. Para cerrar sesión usá **Cerrar sesión**.
- El catálogo público conserva los productos de muestra locales si la base todavía no devuelve productos; al iniciar sesión por primera vez se carga el catálogo inicial en la base.
- Esto es una versión de prueba comercial. Antes de producción se recomienda revisar límites del plan, backups, privacidad, gestión de contraseñas y proceso de alta de nuevas empresas.

## Combos comunes configurables

1. Ejecutá `supabase/09_common_combos.sql` en Supabase SQL Editor.
2. Ingresá a Administración y abrí la sección **Combos comunes**.
3. Elegí **Crear combo**, indicá nombre y descripción, seleccioná dos productos y sus cantidades.
4. Guardá. El combo activo aparecerá en la sección Promociones del catálogo público.
5. Al agregarlo, todos sus componentes se incorporan juntos al carrito y se valida el stock total de cada producto. El pedido conserva cada producto como línea individual para que la reserva y el descuento de inventario sigan usando los productos reales.

Los combos se pueden editar, activar o desactivar. No tienen precio propio: el cliente consulta el importe por WhatsApp.


## Remitos internos en PDF
- Al confirmar una venta, en la pestaña Pedidos aparece el botón **Descargar remito PDF**.
- El remito usa el mismo número de pedido y muestra fecha del pedido, fecha de confirmación, productos, cantidades y presentación por pack. Los combos aparecen desglosados según los componentes registrados en el pedido.
- No solicita ni imprime nombre o teléfono del cliente. No incluye precios.
- Está identificado como **COMPROBANTE INTERNO - NO FISCAL**.
- El PDF se genera desde el detalle histórico guardado en el pedido y puede descargarse nuevamente desde otro dispositivo mientras el pedido y sus ítems sigan disponibles. No se guarda una copia binaria en Storage: el archivo se vuelve a generar al descargarlo.
- El generador PDF se carga desde jsDelivr, por lo que la descarga requiere conexión a internet.
