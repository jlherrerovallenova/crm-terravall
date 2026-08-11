-- Migration SQL: Añadir todos los campos desglosados de dirección y clientes en la tabla 'properties'

ALTER TABLE properties
-- Desglose de dirección del Vendedor 1 (Propietario 1)
ADD COLUMN IF NOT EXISTS owner_street TEXT,
ADD COLUMN IF NOT EXISTS owner_number TEXT,
ADD COLUMN IF NOT EXISTS owner_floor_letter TEXT,

-- Desglose de dirección del Vendedor 2 (Propietario 2)
ADD COLUMN IF NOT EXISTS owner2_street TEXT,
ADD COLUMN IF NOT EXISTS owner2_number TEXT,
ADD COLUMN IF NOT EXISTS owner2_floor_letter TEXT,
ADD COLUMN IF NOT EXISTS owner2_city TEXT,
ADD COLUMN IF NOT EXISTS owner2_province TEXT,
ADD COLUMN IF NOT EXISTS owner2_zipcode TEXT,
ADD COLUMN IF NOT EXISTS seller2_same_address BOOLEAN DEFAULT TRUE,

-- Datos completos y desglose de Comprador 1
ADD COLUMN IF NOT EXISTS buyer1_name TEXT,
ADD COLUMN IF NOT EXISTS buyer1_dni TEXT,
ADD COLUMN IF NOT EXISTS buyer1_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS buyer1_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS buyer1_address TEXT,
ADD COLUMN IF NOT EXISTS buyer1_street TEXT,
ADD COLUMN IF NOT EXISTS buyer1_number TEXT,
ADD COLUMN IF NOT EXISTS buyer1_floor_letter TEXT,
ADD COLUMN IF NOT EXISTS buyer1_city TEXT,
ADD COLUMN IF NOT EXISTS buyer1_province TEXT,
ADD COLUMN IF NOT EXISTS buyer1_zipcode TEXT,

-- Datos completos y desglose de Comprador 2
ADD COLUMN IF NOT EXISTS has_buyer2 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS buyer2_name TEXT,
ADD COLUMN IF NOT EXISTS buyer2_dni TEXT,
ADD COLUMN IF NOT EXISTS buyer2_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS buyer2_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS buyer2_address TEXT,
ADD COLUMN IF NOT EXISTS buyer2_street TEXT,
ADD COLUMN IF NOT EXISTS buyer2_number TEXT,
ADD COLUMN IF NOT EXISTS buyer2_floor_letter TEXT,
ADD COLUMN IF NOT EXISTS buyer2_city TEXT,
ADD COLUMN IF NOT EXISTS buyer2_province TEXT,
ADD COLUMN IF NOT EXISTS buyer2_zipcode TEXT,
ADD COLUMN IF NOT EXISTS buyer2_same_address BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS buyers_relationship TEXT DEFAULT 'ninguna',

-- Datos Registrales e Identificadores
ADD COLUMN IF NOT EXISTS cru TEXT,
ADD COLUMN IF NOT EXISTS cadastral_reference TEXT,
ADD COLUMN IF NOT EXISTS fincas_data JSONB,
ADD COLUMN IF NOT EXISTS arras_contract_data JSONB;
