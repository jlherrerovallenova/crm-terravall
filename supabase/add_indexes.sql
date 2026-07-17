-- =========================================================================================
-- OPTIMIZACIÓN DE RENDIMIENTO: Índices secundarios para el CRM de Terravall
-- Ejecuta este script en el SQL Editor de tu consola de Supabase.
-- =========================================================================================

-- 1. Indexar el agente propietario (mejora políticas RLS de lectura y escritura)
CREATE INDEX IF NOT EXISTS idx_properties_user_id 
ON properties(user_id);

-- 2. Indexar flags de publicación (acelera búsquedas de catálogo web y feed XML)
CREATE INDEX IF NOT EXISTS idx_properties_publish_flags 
ON properties(publish_web, publish_idealista, publish_fotocasa);

-- 3. Indexar referencia interna (acelera búsquedas exactas e incremento automático de referencias)
CREATE INDEX IF NOT EXISTS idx_properties_internal_ref 
ON properties(internal_reference);

-- 4. Indexar fecha de creación descendente (acelera carga del Dashboard y listados recientes)
CREATE INDEX IF NOT EXISTS idx_properties_created_at_desc 
ON properties(created_at DESC);

-- 5. Indexar relación de imágenes (acelera la carga de galerías de fotos por propiedad)
CREATE INDEX IF NOT EXISTS idx_property_media_property_id 
ON property_media(property_id);
