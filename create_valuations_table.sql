-- =======================================================
-- MIGRACIÓN: Tabla de Valoraciones de Inmuebles (ACM)
-- CRM TERRAVALL
-- =======================================================

-- 1. Crear tabla property_valuations
CREATE TABLE IF NOT EXISTS property_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  property_type TEXT NOT NULL DEFAULT 'piso',
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  zipcode TEXT,
  address TEXT,
  area_built NUMERIC NOT NULL,
  area_useful NUMERIC,
  rooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  condition TEXT DEFAULT 'buen_estado',
  has_elevator BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_terrace BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  price_min NUMERIC NOT NULL,
  price_target NUMERIC NOT NULL,
  price_max NUMERIC NOT NULL,
  rent_target NUMERIC,
  price_per_m2 NUMERIC NOT NULL,
  ai_opinion TEXT,
  agent_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'property_valuations' AND policyname = 'Permitir lectura publica de valoraciones'
    ) THEN
        CREATE POLICY "Permitir lectura publica de valoraciones"
          ON property_valuations FOR SELECT
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'property_valuations' AND policyname = 'Permitir edicion de valoraciones a todos'
    ) THEN
        CREATE POLICY "Permitir edicion de valoraciones a todos"
          ON property_valuations FOR ALL
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;
