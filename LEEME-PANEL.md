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
