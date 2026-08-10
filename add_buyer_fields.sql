-- Migration SQL: Añadir campos de Compradores (Parte Compradora) a la tabla 'properties' en Supabase

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS buyer1_name TEXT,
ADD COLUMN IF NOT EXISTS buyer1_dni TEXT,
ADD COLUMN IF NOT EXISTS buyer1_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS buyer1_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS buyer1_address TEXT,
ADD COLUMN IF NOT EXISTS has_buyer2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS buyer2_name TEXT,
ADD COLUMN IF NOT EXISTS buyer2_dni TEXT,
ADD COLUMN IF NOT EXISTS buyer2_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS buyer2_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS buyers_relationship TEXT DEFAULT 'ninguna';
