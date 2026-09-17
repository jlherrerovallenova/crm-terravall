-- =========================================================================================
-- SCRIPT DE MIGRACIÓN: TABLA PARA DOCUMENTACIÓN DE COMPRAVENTA DE INMUEBLES
-- Ejecutar este script en el SQL Editor de tu Dashboard de Supabase
-- =========================================================================================

-- 1. Crear extensión UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla 'property_documents'
CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'vendedor', 'comprador', 'proceso', 'otros'
  document_type TEXT NOT NULL, -- 'vendedor_dni', 'vendedor_escritura', 'vendedor_nota_simple', 'vendedor_cee', 'vendedor_ibi', 'vendedor_rsu', 'vendedor_comunidad', 'vendedor_deuda_hipoteca', 'vendedor_suministros', 'comprador_identidad', 'comprador_medios_pago', 'proceso_contrato_arras', 'otros'
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas por inmueble y categoría
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_category ON public.property_documents(category);
CREATE INDEX IF NOT EXISTS idx_property_documents_doc_type ON public.property_documents(document_type);

-- 3. Habilitar RLS en la tabla 'property_documents'
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas si existieran en 'property_documents'
DROP POLICY IF EXISTS "Allow public select on property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Allow authenticated insert on property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Allow authenticated update on property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Allow authenticated delete on property_documents" ON public.property_documents;

-- Crear políticas de acceso para la tabla 'property_documents'
CREATE POLICY "Allow public select on property_documents" 
ON public.property_documents FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on property_documents" 
ON public.property_documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on property_documents" 
ON public.property_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on property_documents" 
ON public.property_documents FOR DELETE TO authenticated USING (true);

-- 4. Crear el bucket 'property_documents' en storage.buckets si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property_documents',
  'property_documents',
  true,
  26214400, -- Límite de 25MB por archivo
  NULL -- Permitir cualquier tipo de archivo
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = NULL;

-- 5. Políticas de acceso para el bucket 'property_documents'
-- NOTA: storage.objects ya tiene RLS activado por Supabase.
DROP POLICY IF EXISTS "Acceso de lectura a documentos de inmuebles" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir documentos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar documentos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar documentos a usuarios autenticados" ON storage.objects;

CREATE POLICY "Acceso de lectura a documentos de inmuebles"
ON storage.objects FOR SELECT
USING (bucket_id = 'property_documents');

CREATE POLICY "Permitir subir documentos a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property_documents');

CREATE POLICY "Permitir actualizar documentos a usuarios autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property_documents');

CREATE POLICY "Permitir borrar documentos a usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property_documents');
