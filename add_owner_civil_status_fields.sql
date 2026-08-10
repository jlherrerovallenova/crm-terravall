-- Migration SQL: Añadir campos de estado civil y régimen matrimonial de propietarios a la tabla 'properties' en Supabase

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS owner_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS owner_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS has_owner2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner2_name TEXT,
ADD COLUMN IF NOT EXISTS owner2_dni TEXT,
ADD COLUMN IF NOT EXISTS owner2_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS owners_relationship TEXT DEFAULT 'ninguna';
