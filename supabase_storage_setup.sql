-- =========================================================================================
-- SCRIPT DE CONFIGURACIÓN DE STORAGE EN SUPABASE (EJECUTAR EN EL SQL EDITOR DE SUPABASE)
-- =========================================================================================

-- 1. Crear el bucket público 'property_media' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property_media',
  'property_media',
  true,
  5242880, -- Límite de 5MB por archivo
  '{"image/*"}' -- Solo permitir imágenes
)
ON CONFLICT (id) DO NOTHING;

-- 2. Asegurarse de que RLS está activo en la tabla de objetos de storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes para evitar duplicados en caso de re-ejecución
DROP POLICY IF EXISTS "Acceso público para visualizar fotos de inmuebles" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subidas a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de fotos a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrado de fotos a usuarios autenticados" ON storage.objects;

-- 4. Crear políticas de acceso para el bucket 'property_media'

-- Permitir acceso público de lectura a las imágenes
CREATE POLICY "Acceso público para visualizar fotos de inmuebles"
ON storage.objects FOR SELECT
USING (bucket_id = 'property_media');

-- Permitir subir archivos a usuarios autenticados
CREATE POLICY "Permitir subidas a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property_media');

-- Permitir actualizar archivos a usuarios autenticados
CREATE POLICY "Permitir actualización de fotos a usuarios autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property_media');

-- Permitir borrar archivos a usuarios autenticados
CREATE POLICY "Permitir borrado de fotos a usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property_media');
