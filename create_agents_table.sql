-- =======================================================
-- MIGRACIÓN: Tabla de Agentes Autorizados (Supabase)
-- CRM TERRAVALL
-- =======================================================

-- 1. Crear tabla agents
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  role TEXT DEFAULT 'Agente Comercial',
  status TEXT DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Permitir lectura publica de agentes'
    ) THEN
        CREATE POLICY "Permitir lectura publica de agentes"
          ON agents FOR SELECT
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Permitir edicion de agentes a todos'
    ) THEN
        CREATE POLICY "Permitir edicion de agentes a todos"
          ON agents FOR ALL
          USING (true)
          WITH CHECK (true);
    END IF;
END $$;

-- 4. Insertar datos iniciales por defecto si la tabla está vacía
INSERT INTO agents (name, email, phone, role, status) VALUES
  ('Mª del Mar Rivas', 'mar.terravall@hotmail.com', '600000001', 'Administrador', 'activo'),
  ('Yolanda Alba', 'yolanda@terravall.com', '600000002', 'Agente Captador', 'activo'),
  ('Juan L. Herrero', 'juan@terravall.com', '600000003', 'Agente Comercial', 'activo')
ON CONFLICT (email) DO NOTHING;
