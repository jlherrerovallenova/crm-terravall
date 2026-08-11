-- Migration SQL: Añadir campos desglosados de dirección, CRU y Referencia Catastral en la tabla 'properties'

ALTER TABLE properties
-- Desglose de dirección del Vendedor (Propietario 1)
ADD COLUMN IF NOT EXISTS owner_street TEXT,
ADD COLUMN IF NOT EXISTS owner_number TEXT,
ADD COLUMN IF NOT EXISTS owner_floor_letter TEXT,

-- Desglose de dirección del Comprador 1
ADD COLUMN IF NOT EXISTS buyer1_street TEXT,
ADD COLUMN IF NOT EXISTS buyer1_number TEXT,
ADD COLUMN IF NOT EXISTS buyer1_floor_letter TEXT,
ADD COLUMN IF NOT EXISTS buyer1_city TEXT,
ADD COLUMN IF NOT EXISTS buyer1_province TEXT,
ADD COLUMN IF NOT EXISTS buyer1_zipcode TEXT,

-- Datos Registrales e Identificadores
ADD COLUMN IF NOT EXISTS cru TEXT,
ADD COLUMN IF NOT EXISTS cadastral_reference TEXT;
