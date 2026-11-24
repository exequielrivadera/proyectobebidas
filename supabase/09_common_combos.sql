-- Combos comunes configurables por cada distribuidora.
CREATE TABLE IF NOT EXISTS public.common_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80),
  description text NOT NULL DEFAULT '',
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 2 AND 6),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS common_combos_tenant_active_idx ON public.common_combos(tenant_id, active);
ALTER TABLE public.common_combos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read active distributor combos" ON public.common_combos;
CREATE POLICY "public read active distributor combos" ON public.common_combos
 FOR SELECT TO anon, authenticated USING (active = true AND tenant_id IN (SELECT id FROM public.tenants WHERE slug='distribuidora'));
DROP POLICY IF EXISTS "tenant admins manage own combos" ON public.common_combos;
CREATE POLICY "tenant admins manage own combos" ON public.common_combos
 FOR ALL TO authenticated
 USING (public.current_role() IN ('tenant_admin','platform_admin') AND (public.current_role()='platform_admin' OR tenant_id=public.current_tenant_id()))
 WITH CHECK (public.current_role() IN ('tenant_admin','platform_admin') AND (public.current_role()='platform_admin' OR tenant_id=public.current_tenant_id()));
GRANT SELECT ON public.common_combos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.common_combos TO authenticated;
