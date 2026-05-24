-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enum types para mantener integridad en los datos básicos
CREATE TYPE property_type AS ENUM ('piso', 'chalet', 'local', 'oficina', 'terreno');
CREATE TYPE property_operation AS ENUM ('venta', 'alquiler', 'traspaso');
CREATE TYPE property_condition AS ENUM ('buen_estado', 'a_reformar', 'obra_nueva');
CREATE TYPE media_type AS ENUM ('image', 'video', 'virtual_tour');

-- 2. Tabla Principal de Inmuebles
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Agente que da de alta el inmueble (relacionado con el Auth de Supabase)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  type property_type NOT NULL,
  operation property_operation NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  
  -- Ubicación
  address_hidden TEXT NOT NULL,
  address_public TEXT NOT NULL,
  
  -- Dimensiones
  area_useful INTEGER NOT NULL,
  area_built INTEGER NOT NULL,
  
  -- Textos SEO
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Características Base
  condition property_condition NOT NULL,
  
  -- Campo JSONB Dinámico (Aquí van las validaciones específicas de Zod)
  specific_features JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 3. Tabla Multimedia (Fotos, Vídeos, Tour 3D)
CREATE TABLE IF NOT EXISTS property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  type media_type NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Trigger para actualizar "updated_at" automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_modtime
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 5. Row Level Security (RLS) - Permisos
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;

-- Por ahora, permitimos acceso de lectura público, pero solo autenticados pueden crear/editar
CREATE POLICY "Public properties are viewable by everyone." 
ON properties FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties." 
ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties." 
ON properties FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties." 
ON properties FOR DELETE USING (auth.uid() = user_id);

-- Lo mismo para la tabla de archivos multimedia
CREATE POLICY "Public media is viewable by everyone." 
ON property_media FOR SELECT USING (true);

CREATE POLICY "Users can insert media for their properties." 
ON property_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM properties WHERE id = property_media.property_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their media." 
ON property_media FOR UPDATE USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_media.property_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their media." 
ON property_media FOR DELETE USING (
  EXISTS (SELECT 1 FROM properties WHERE id = property_media.property_id AND user_id = auth.uid())
);

-- =========================================================================================
-- PARCHE: Actualización para cumplimiento 100% de Idealista (Añadir a un proyecto existente)
-- =========================================================================================

-- 1. Nuevo Enum para Certificado Energético
CREATE TYPE energy_cert_type AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'exento', 'en_tramite');

-- 2. Añadir nuevas columnas globales a la tabla properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS subtype TEXT,
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Por definir',
ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT 'Por definir',
ADD COLUMN IF NOT EXISTS zipcode TEXT NOT NULL DEFAULT '00000',
ADD COLUMN IF NOT EXISTS hide_exact_address BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS energy_certificate energy_cert_type NOT NULL DEFAULT 'en_tramite',
ADD COLUMN IF NOT EXISTS publish_web BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_idealista BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_fotocasa BOOLEAN NOT NULL DEFAULT false;
