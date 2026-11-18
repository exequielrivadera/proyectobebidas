-- Permisos necesarios para el catálogo público y el panel privado.
-- Ejecutar una sola vez desde Supabase SQL Editor.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- El catálogo puede leer productos activos; RLS limita qué filas son visibles.
GRANT SELECT ON TABLE public.products TO anon, authenticated;

-- Los usuarios autenticados pueden operar productos; RLS limita cada operación
-- al tenant correspondiente o al administrador de plataforma.
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

-- El panel necesita leer el perfil y el tenant del usuario autenticado.
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.tenants TO anon, authenticated;

-- Permitir que la subconsulta de la política pública encuentre únicamente
-- el tenant de la demo. No expone otras empresas a visitantes anónimos.
DROP POLICY IF EXISTS "public read distributor tenant" ON public.tenants;
CREATE POLICY "public read distributor tenant"
ON public.tenants
FOR SELECT
TO anon, authenticated
USING (slug = 'distribuidora');

GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
