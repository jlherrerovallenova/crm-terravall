-- =======================================================
-- MIGRACIÓN: Tabla de Contratos de Arrendamiento / Alquiler
-- CRM TERRAVALL
-- =======================================================

CREATE TABLE IF NOT EXISTS rental_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  city TEXT DEFAULT 'Valladolid',
  date_str TEXT NOT NULL,
  
  -- Propietario / Arrendador 1
  owner1_name TEXT NOT NULL,
  owner1_dni TEXT NOT NULL,
  owner1_civil_status TEXT DEFAULT 'soltero',
  owner1_street TEXT,
  owner1_number TEXT,
  owner1_floor_letter TEXT,
  owner1_city TEXT DEFAULT 'Valladolid',
  owner1_province TEXT DEFAULT 'Valladolid',
  owner1_zipcode TEXT,
  
  -- Propietario / Arrendador 2
  has_owner2 BOOLEAN DEFAULT false,
  owner2_name TEXT,
  owner2_dni TEXT,
  owner2_civil_status TEXT DEFAULT 'soltero',
  owner2_street TEXT,
  owner2_number TEXT,
  owner2_floor_letter TEXT,
  owner2_city TEXT,
  owner2_province TEXT,
  owner2_zipcode TEXT,
  
  -- Inquilino / Arrendatario 1
  tenant1_name TEXT NOT NULL,
  tenant1_dni TEXT NOT NULL,
  tenant1_civil_status TEXT DEFAULT 'soltero',
  tenant1_street TEXT,
  tenant1_number TEXT,
  tenant1_floor_letter TEXT,
  tenant1_city TEXT DEFAULT 'Valladolid',
  tenant1_province TEXT DEFAULT 'Valladolid',
  tenant1_zipcode TEXT,
  
  -- Inquilino / Arrendatario 2
  has_tenant2 BOOLEAN DEFAULT false,
  tenant2_name TEXT,
  tenant2_dni TEXT,
  tenant2_civil_status TEXT DEFAULT 'soltero',
  tenant2_street TEXT,
  tenant2_number TEXT,
  tenant2_floor_letter TEXT,
  tenant2_city TEXT,
  tenant2_province TEXT,
  tenant2_zipcode TEXT,
  
  -- Inmueble y Finca Registral
  property_address TEXT NOT NULL,
  property_street TEXT,
  property_number TEXT,
  property_floor_letter TEXT,
  property_city TEXT DEFAULT 'Valladolid',
  property_province TEXT DEFAULT 'Valladolid',
  property_zipcode TEXT,
  cadastral_reference TEXT,
  registry_number TEXT,
  registry_city TEXT,
  cru TEXT,
  
  -- Equipamiento y Características
  kitchen_equipped BOOLEAN DEFAULT false,
  is_furnished BOOLEAN DEFAULT false,
  max_occupants INT DEFAULT 1,
  pets_allowed BOOLEAN DEFAULT false,
  
  -- Condiciones Económicas y Duración
  start_date TEXT NOT NULL,
  duration_years INT DEFAULT 1,
  monthly_rent NUMERIC NOT NULL,
  iban TEXT NOT NULL,
  iban_holder TEXT NOT NULL,
  owner_email TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  rent_index TEXT DEFAULT 'I.R.A.V.',
  deposit_amount NUMERIC NOT NULL,
  additional_guarantee NUMERIC DEFAULT 0,
  community_paid_by_owner BOOLEAN DEFAULT true,
  ibi_paid_by_owner BOOLEAN DEFAULT true,
  
  -- Firmas y Metadatos
  signatures JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rental_contracts' AND policyname = 'Permitir lectura publica de contratos de alquiler'
    ) THEN
        CREATE POLICY "Permitir lectura publica de contratos de alquiler"
          ON rental_contracts FOR SELECT
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rental_contracts' AND policyname = 'Permitir edicion de contratos de alquiler'
    ) THEN
        CREATE POLICY "Permitir edicion de contratos de alquiler"
          ON rental_contracts FOR ALL
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;
