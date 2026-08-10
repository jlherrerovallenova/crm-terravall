-- Migration SQL Completa: Añadir todos los campos de Propietarios, Compradores y Contrato de Arras a la tabla 'properties' en Supabase

ALTER TABLE properties
-- Propietarios (Vendedores)
ADD COLUMN IF NOT EXISTS owner_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS owner_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS has_owner2 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner2_name TEXT,
ADD COLUMN IF NOT EXISTS owner2_dni TEXT,
ADD COLUMN IF NOT EXISTS owner2_civil_status TEXT DEFAULT 'soltero',
ADD COLUMN IF NOT EXISTS owner2_matrimonial_regime TEXT DEFAULT 'gananciales',
ADD COLUMN IF NOT EXISTS owners_relationship TEXT DEFAULT 'ninguna',

-- Compradores
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
ADD COLUMN IF NOT EXISTS buyers_relationship TEXT DEFAULT 'ninguna',

-- Datos Adicionales del Contrato de Arras, IBAN y Fincas
ADD COLUMN IF NOT EXISTS seller_iban TEXT,
ADD COLUMN IF NOT EXISTS notary_deadline TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction_city TEXT,
ADD COLUMN IF NOT EXISTS arras_amount_num NUMERIC,
ADD COLUMN IF NOT EXISTS fincas_data JSONB,
ADD COLUMN IF NOT EXISTS arras_contract_data JSONB;
