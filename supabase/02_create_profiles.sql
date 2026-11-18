-- Ejecutar DESPUÉS de crear los dos usuarios en Authentication > Users.
-- Crear usuarios con estos emails internos (no reciben correos):
--   pulso@cuentas.pulsodigital.test
--   distribuidora@cuentas.pulsodigital.test
-- En Supabase Dashboard: Add user, contraseña fuerte y marcar Auto Confirm User.
-- Luego ejecutar este SQL. Reemplaza los usernames si lo deseas.

insert into public.profiles(user_id, tenant_id, role, username)
select id, null, 'platform_admin', 'pulso'
from auth.users where email='pulso@cuentas.pulsodigital.test'
on conflict (user_id) do update set role=excluded.role, username=excluded.username;

insert into public.profiles(user_id, tenant_id, role, username)
select u.id, t.id, 'tenant_admin', 'distribuidora'
from auth.users u cross join public.tenants t
where u.email='distribuidora@cuentas.pulsodigital.test' and t.slug='distribuidora'
on conflict (user_id) do update set tenant_id=excluded.tenant_id, role=excluded.role, username=excluded.username;
