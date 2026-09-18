-- =========================================================================================
-- SCRIPT: TABLA E HISTORIAL DE ENVÍOS DE DOCUMENTACIÓN (NOTARÍA, BANCOS, GESTORÍAS)
-- CRM TERRAVALL
-- =========================================================================================

-- 1. Crear la tabla 'documentation_emails'
CREATE TABLE IF NOT EXISTS public.documentation_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL DEFAULT 'notaria', -- 'notaria', 'banco', 'gestoria', 'personalizado'
  recipient_name TEXT,
  recipient_email TEXT NOT NULL,
  cc_emails TEXT,
  subject TEXT NOT NULL,
  message_body TEXT,
  selected_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'simulated'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para agilizar búsquedas por inmueble y fecha
CREATE INDEX IF NOT EXISTS idx_doc_emails_property_id ON public.documentation_emails(property_id);
CREATE INDEX IF NOT EXISTS idx_doc_emails_created_at ON public.documentation_emails(created_at DESC);

-- 3. Permisos
GRANT ALL ON TABLE public.documentation_emails TO anon, authenticated, service_role;

-- 4. Habilitar RLS con políticas de acceso completas
ALTER TABLE public.documentation_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select a todos en documentation_emails" ON public.documentation_emails;
DROP POLICY IF EXISTS "Permitir insert a todos en documentation_emails" ON public.documentation_emails;
DROP POLICY IF EXISTS "Permitir update a todos en documentation_emails" ON public.documentation_emails;
DROP POLICY IF EXISTS "Permitir delete a todos en documentation_emails" ON public.documentation_emails;

CREATE POLICY "Permitir select a todos en documentation_emails" 
ON public.documentation_emails FOR SELECT 
USING (true);

CREATE POLICY "Permitir insert a todos en documentation_emails" 
ON public.documentation_emails FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir update a todos en documentation_emails" 
ON public.documentation_emails FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir delete a todos en documentation_emails" 
ON public.documentation_emails FOR DELETE 
USING (true);
