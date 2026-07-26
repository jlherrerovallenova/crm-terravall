-- Script de actualización para añadir las columnas del Encargo de Venta a la tabla 'properties' en Supabase

ALTER TABLE properties
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
