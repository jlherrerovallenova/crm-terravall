-- Script de actualización de esquema y políticas RLS para Supabase
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase.

-- 1. Crear tipos ENUM si no existen
DO $$ BEGIN
    CREATE TYPE property_visibility AS ENUM ('exact', 'street_only', 'hidden');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exceptional_situation AS ENUM ('ocupada', 'alquilada', 'nuda_propiedad', 'ninguna');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notes_visibility AS ENUM ('solo_yo', 'oficina');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Asegurar que todas las columnas existen en la tabla 'properties'
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS subtype TEXT,
ADD COLUMN IF NOT EXISTS is_top_floor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_stairs TEXT,
ADD COLUMN IF NOT EXISTS door TEXT,
ADD COLUMN IF NOT EXISTS urbanization_name TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'exact',
ADD COLUMN IF NOT EXISTS hide_exact_address BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_bank_owned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exceptional_situation TEXT DEFAULT 'ninguna',
ADD COLUMN IF NOT EXISTS energy_consumption DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS emissions_certificate TEXT DEFAULT 'en_tramite',
ADD COLUMN IF NOT EXISTS emissions DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS capture_agent TEXT,
ADD COLUMN IF NOT EXISTS sales_agent TEXT,
ADD COLUMN IF NOT EXISTS internal_reference TEXT,
ADD COLUMN IF NOT EXISTS private_notes TEXT,
ADD COLUMN IF NOT EXISTS notes_visibility TEXT DEFAULT 'solo_yo',
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_dni TEXT,
ADD COLUMN IF NOT EXISTS owner_address TEXT,
ADD COLUMN IF NOT EXISTS owner_city TEXT,
ADD COLUMN IF NOT EXISTS owner_zipcode TEXT,
ADD COLUMN IF NOT EXISTS owner_province TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS commission_type TEXT NOT NULL DEFAULT 'porcentaje',
ADD COLUMN IF NOT EXISTS commission_value NUMERIC,
ADD COLUMN IF NOT EXISTS exclusivity_months INTEGER;

-- 3. Habilitar RLS y corregir políticas de permisos
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas restrictivas anteriores en 'properties'
DROP POLICY IF EXISTS "Users can update their own properties." ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties." ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties." ON properties;
DROP POLICY IF EXISTS "Public properties are viewable by everyone." ON properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON properties;
DROP POLICY IF EXISTS "Allow public select on properties" ON properties;
DROP POLICY IF EXISTS "Allow authenticated insert on properties" ON properties;
DROP POLICY IF EXISTS "Allow authenticated update on properties" ON properties;
DROP POLICY IF EXISTS "Allow authenticated delete on properties" ON properties;

-- Crear políticas permisivas para CRM (lectura pública, escritura para autenticados)
CREATE POLICY "Allow public select on properties" 
ON properties FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on properties" 
ON properties FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on properties" 
ON properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on properties" 
ON properties FOR DELETE TO authenticated USING (true);

-- Limpiar y recrear políticas para la tabla 'property_media'
DROP POLICY IF EXISTS "Public media is viewable by everyone." ON property_media;
DROP POLICY IF EXISTS "Users can insert media for their properties." ON property_media;
DROP POLICY IF EXISTS "Users can update their media." ON property_media;
DROP POLICY IF EXISTS "Users can delete their media." ON property_media;
DROP POLICY IF EXISTS "Allow public select on property_media" ON property_media;
DROP POLICY IF EXISTS "Allow authenticated insert on property_media" ON property_media;
DROP POLICY IF EXISTS "Allow authenticated update on property_media" ON property_media;
DROP POLICY IF EXISTS "Allow authenticated delete on property_media" ON property_media;

CREATE POLICY "Allow public select on property_media" 
ON property_media FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on property_media" 
ON property_media FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on property_media" 
ON property_media FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on property_media" 
ON property_media FOR DELETE TO authenticated USING (true);
