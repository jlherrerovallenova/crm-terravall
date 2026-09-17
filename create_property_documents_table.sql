-- =========================================================================================
-- SCRIPT COMPLETO: CREACIÓN DE TABLA Y PERMISOS DE DOCUMENTACIÓN DE COMPRAVENTA
-- Copia y pega TODO este bloque en el SQL Editor de Supabase y pulsa 'Run'
-- =========================================================================================

-- 1. Crear la tabla 'property_documents'
CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
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

-- 2. Índices para agilizar búsquedas
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_category ON public.property_documents(category);
CREATE INDEX IF NOT EXISTS idx_property_documents_doc_type ON public.property_documents(document_type);

-- 3. Asignar permisos sobre la tabla
GRANT ALL ON TABLE public.property_documents TO anon, authenticated, service_role;

-- 4. Habilitar RLS con políticas de acceso completas
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select a todos en property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Permitir insert a todos en property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Permitir update a todos en property_documents" ON public.property_documents;
DROP POLICY IF EXISTS "Permitir delete a todos en property_documents" ON public.property_documents;

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
