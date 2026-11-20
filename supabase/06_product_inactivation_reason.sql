-- Motivo de desactivación de productos.
-- Ejecutar una sola vez en Supabase SQL Editor.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS inactive_reason text;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_inactive_reason_check;

ALTER TABLE public.products
ADD CONSTRAINT products_inactive_reason_check
CHECK (
  inactive_reason IS NULL OR
  inactive_reason IN ('sin_stock', 'no_se_vende', 'temporal', 'otro')
);

-- Los productos activos no deben conservar un motivo de desactivación.
UPDATE public.products
SET inactive_reason = NULL
WHERE active = true AND inactive_reason IS NOT NULL;
