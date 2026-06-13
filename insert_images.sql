DO $$
DECLARE
    prop RECORD;
    img_urls TEXT[] := ARRAY[
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687931-cebf074d2847?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18efc2291?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1628012198051-50e8bc70715e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80'
    ];
    shuffled_imgs TEXT[];
    i INT;
BEGIN
    -- Limpiar imágenes previas
    DELETE FROM property_media;

    -- Iterar por cada inmueble
    FOR prop IN SELECT id FROM properties LOOP
        -- Mezclar el array de imágenes aleatoriamente
        SELECT array_agg(u ORDER BY random()) INTO shuffled_imgs
        FROM unnest(img_urls) u;

        -- Insertar las 3 primeras imágenes
        FOR i IN 1..3 LOOP
            INSERT INTO property_media (property_id, url, type) 
            VALUES (prop.id, shuffled_imgs[i], 'image');
        END LOOP;
    END LOOP;
END $$;
