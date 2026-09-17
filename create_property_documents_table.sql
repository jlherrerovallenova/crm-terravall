-- =========================================================================================
-- SCRIPT DEFINITIVO: TABLA Y PERMISOS PARA DOCUMENTACIÓN DE COMPRAVENTA
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase
-- =========================================================================================

-- 1. Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tabla 'property_documents' si no existe
CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'vendedor', 'comprador', 'proceso', 'otros'
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_category ON public.property_documents(category);
CREATE INDEX IF NOT EXISTS idx_property_documents_doc_type ON public.property_documents(document_type);

-- 3. Conceder permisos explícitos de tabla a los roles de Supabase (anon y authenticated)
GRANT ALL ON TABLE public.property_documents TO anon, authenticated, service_role;

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Limpiar cualquier política previa para evitar conflictos
DROP POLICY IF EXISTS "Allow public select on property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Allow authenticated insert on property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Allow authenticated update on property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Allow authenticated delete on property_documents" ON public.property_documents;

DROP POLICY IF EXISTS "Permitir select a todos en property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Permitir insert a todos en property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Permitir update a todos en property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Permitir delete a todos en property_documents" ON public.property_documents;

-- 5. Crear políticas universales (permiten tanto sesión 'anon' como 'authenticated' del CRM)
CREATE POLICY "Permitir select a todos en property_documents" 
ON public.property_documents FOR SELECT 
USING (true);

CREATE POLICY "Permitir insert a todos en property_documents" 
ON public.property_documents FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir update a todos en property_documents" 
ON public.property_documents FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir delete a todos en property_documents" 
ON public.property_documents FOR DELETE 
USING (true);

-- 6. Políticas permisivas para Storage en el bucket 'property_documents'
DROP POLICY IF EXISTS "Permitir leer archivos en property_documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir archivos en property_documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar archivos en property_documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar archivos en property_documents" ON storage.objects;
DROP POLICY IF EXISTS "Acceso de lectura a documentos de inmuebles" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir documentos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualizar documentos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar documentos a usuarios autenticados" ON storage.objects;

CREATE POLICY "Permitir leer archivos en property_documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'property_documents');

CREATE POLICY "Permitir subir archivos en property_documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property_documents');

CREATE POLICY "Permitir actualizar archivos en property_documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property_documents');

CREATE POLICY "Permitir borrar archivos en property_documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'property_documents');
