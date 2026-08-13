-- =======================================================
-- MIGRACIÓN: Configuración Centralizada de la Agencia (Supabase)
-- CRM TERRAVALL
-- =======================================================

-- 1. Crear tabla agency_settings si no existe
CREATE TABLE IF NOT EXISTS agency_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT DEFAULT 'Terravall Inmobiliaria S.L.',
  commercial_name TEXT DEFAULT 'Terravall',
  cif TEXT DEFAULT 'B-47123456',
  phone TEXT DEFAULT '983 12 34 56',
  email TEXT DEFAULT 'info@terravall.com',
  address TEXT DEFAULT 'Paseo de Zorrilla 48, 47006 Valladolid',
  website TEXT DEFAULT 'https://www.terravall.com',
  idealista_client_id TEXT DEFAULT 'id_client_terravall_prod_7781',
  idealista_client_secret TEXT DEFAULT '••••••••••••••••••••••••••••••••',
  idealista_sync BOOLEAN DEFAULT true,
  fotocasa_api_key TEXT DEFAULT 'fc_key_99812_trvl',
  fotocasa_office_code TEXT DEFAULT 'OFC-47001-A',
  fotocasa_sync BOOLEAN DEFAULT false,
  gemini_api_key TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'agency_settings' AND policyname = 'Permitir lectura publica de configuracion de agencia'
    ) THEN
        CREATE POLICY "Permitir lectura publica de configuracion de agencia"
          ON agency_settings FOR SELECT
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'agency_settings' AND policyname = 'Permitir edicion a todos en agency_settings'
    ) THEN
        CREATE POLICY "Permitir edicion a todos en agency_settings"
          ON agency_settings FOR ALL
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;

-- 4. Insertar fila por defecto si la tabla está vacía
INSERT INTO agency_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
