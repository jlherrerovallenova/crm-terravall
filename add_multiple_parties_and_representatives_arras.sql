-- Migración para soportar múltiples vendedores (> 2), múltiples compradores (> 2) y personas apoderadas / representantes en contratos de arras

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS sellers_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS buyers_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS representatives_data JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.sellers_data IS 'Lista estructurada de múltiples vendedores propietarios para el contrato de arras';
COMMENT ON COLUMN public.properties.buyers_data IS 'Lista estructurada de múltiples compradores para el contrato de arras';
COMMENT ON COLUMN public.properties.representatives_data IS 'Lista de personas apoderadas / representantes legales con poderes notariales';
