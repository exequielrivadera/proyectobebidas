# Preparación Supabase – Pulso Digital

Este paquete contiene el esquema inicial y la configuración pública del proyecto Supabase. **Todavía no cambia el guardado local del catálogo**: primero hay que ejecutar el esquema y crear las dos identidades administrativas; después se conecta el CRUD del panel y la lectura del catálogo.

## 1. Ejecutar el esquema
1. Abrí el proyecto `pulso-distribuidora` en Supabase.
2. Entrá a SQL Editor → New query.
3. Pegá y ejecutá `01_schema.sql`.

## 2. Crear accesos sin correo real
En Authentication → Sign In / Providers, mantené Email habilitado y desactivá la confirmación de email para esta prueba. No se enviarán correos.

En Authentication → Users → Add user, creá dos usuarios con contraseña fuerte y marcá Auto Confirm User:
- `pulso@cuentas.pulsodigital.test` (acceso general Pulso Digital)
- `distribuidora@cuentas.pulsodigital.test` (administración de la distribuidora)

Son identificadores internos para autenticación; no se usan para enviar emails. No uses contraseñas iguales.

## 3. Asignar roles
Después de crear ambos usuarios, ejecutá `02_create_profiles.sql` en SQL Editor. Esto asigna el rol general a Pulso y el rol de comercio a Distribuidora.

## 4. Verificar configuración del frontend
`supabase-config.js` contiene la URL y la Publishable Key. Esa clave puede estar en el navegador; nunca agregues una `secret` o `service_role`.

## Importante
- No publiques todavía el panel conectado ni cargues datos reales hasta completar la integración del inicio de sesión y CRUD remoto.
- Las políticas RLS de `01_schema.sql` restringen el acceso a productos por rol/empresa y el bucket de imágenes.
- La autenticación sin correo real se realiza con los identificadores internos anteriores y contraseña; no hay recuperación por email en esta etapa.


## Corrección de permisos (necesaria en el proyecto ya creado)

Si aparece `permission denied for table products`, ejecutá una sola vez el archivo `03_fix_permissions.sql` en Supabase → SQL Editor. Este archivo otorga permisos de tabla y agrega una política de lectura pública limitada al tenant `distribuidora`; no elimina productos ni perfiles.

Para probar localmente, iniciá un servidor local (por ejemplo, Live Server en VS Code) y abrí `index.html` mediante `http://127.0.0.1...`; no abras los HTML con doble clic (`file://`). En GitHub Pages funciona bajo HTTPS.
