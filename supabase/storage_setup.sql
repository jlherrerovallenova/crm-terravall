-- 1. Crear el bucket 'property_media' si no existe, haciéndolo público para que las imágenes se puedan ver en la web.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property_media', 'property_media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS en la tabla de objetos de Storage (por si no lo estaba)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas para el bucket 'property_media'

-- Permitir a CUALQUIERA ver las imágenes (Lectura pública)
CREATE POLICY "Public media is viewable by everyone."
ON storage.objects FOR SELECT
USING (bucket_id = 'property_media');

-- Permitir SÓLO a usuarios autenticados subir imágenes
CREATE POLICY "Users can upload media."
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'property_media' 
    AND auth.uid() IS NOT NULL
);

-- Permitir a los usuarios actualizar sus propias imágenes
CREATE POLICY "Users can update their own media."
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'property_media' 
    AND owner = auth.uid()
);

-- Permitir a los usuarios borrar sus propias imágenes
CREATE POLICY "Users can delete their own media."
ON storage.objects FOR DELETE
USING (
    bucket_id = 'property_media' 
    AND owner = auth.uid()
);
