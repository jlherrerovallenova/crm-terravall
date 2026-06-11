INSERT INTO properties (
  type, operation, subtype, price, address_hidden, address_public, city, province, zipcode, 
  hide_exact_address, area_built, area_useful, condition, title, description, specific_features
) VALUES 
(
  'piso', 'venta', 'atico', 320000.00, 'Calle de Santiago 15, 5ºB', 'Centro', 'Valladolid', 'Valladolid', '47001',
  false, 120, 105, 'buen_estado', 'Espectacular Ático en pleno Centro de Valladolid', 
  'Extraordinario ático situado en la prestigiosa Calle Santiago. Cuenta con una gran terraza orientada al sur. Dispone de 3 amplios dormitorios, 2 baños completos y un enorme salón. Plaza de garaje incluida. ¡No deje pasar la oportunidad de vivir en pleno centro de la ciudad!',
  '{"floor": 5, "has_elevator": true, "rooms": 3, "bathrooms": 2, "has_parking": true}'::jsonb
),
(
  'piso', 'venta', null, 185000.00, 'Paseo de Zorrilla 88, 3ºA', 'Paseo de Zorrilla', 'Valladolid', 'Valladolid', '47006',
  false, 95, 82, 'a_reformar', 'Piso amplio y luminoso en Paseo de Zorrilla', 
  'Excelente piso situado en una de las mejores zonas del Paseo de Zorrilla, frente a El Corte Inglés. Excelente altura y luz natural todo el día. Dispone de 4 dormitorios y necesita actualización, ideal para hacerlo a tu gusto. Finca con ascensor.',
  '{"floor": 3, "has_elevator": true, "rooms": 4, "bathrooms": 1, "has_parking": false}'::jsonb
),
(
  'chalet', 'venta', 'adosado', 450000.00, 'Calle Hernando de Acuña 42', 'Parquesol', 'Valladolid', 'Valladolid', '47014',
  true, 280, 245, 'buen_estado', 'Exclusivo Chalet Adosado en Parquesol', 
  'Estupendo chalet adosado en Parquesol. 4 plantas, amplio salón con acceso al jardín, 4 dormitorios en la primera planta y buhardilla acondicionada. Bodega equipada con chimenea. Urbanización con zonas comunes, piscina y pistas deportivas. Calidades inmejorables.',
  '{"plot_area": 150, "floors_count": 4, "rooms": 5, "bathrooms": 4, "has_pool": true}'::jsonb
),
(
  'piso', 'alquiler', null, 950.00, 'Calle Duque de la Victoria 5, 2ºC', 'Centro - Plaza Mayor', 'Valladolid', 'Valladolid', '47001',
  true, 85, 75, 'obra_nueva', 'Precioso piso de diseño a estrenar junto a la Plaza Mayor', 
  'Vivienda recién reformada de forma integral. Diseño moderno y calidades de lujo. Suelo radiante, cocina integrada, 2 habitaciones y 1 baño. Un espacio único en el centro histórico de la ciudad. Ideal para parejas o profesionales.',
  '{"floor": 2, "has_elevator": true, "rooms": 2, "bathrooms": 1, "has_parking": false}'::jsonb
),
(
  'chalet', 'venta', 'independiente', 590000.00, 'Camino de la Flecha 18', 'Covaresa', 'Valladolid', 'Valladolid', '47008',
  false, 350, 310, 'buen_estado', 'Impresionante Chalet Independiente en Covaresa', 
  'Exclusiva propiedad en Covaresa. Chalet independiente sobre parcela de 800m2 con jardín privado y piscina. Salón a doble altura, 5 dormitorios y 4 baños completos. Garaje para 3 vehículos. Total privacidad en un entorno privilegiado de la ciudad.',
  '{"plot_area": 800, "floors_count": 2, "rooms": 5, "bathrooms": 4, "has_pool": true}'::jsonb
),
(
  'piso', 'venta', null, 215000.00, 'Calle Mieses 12, 1ºA', 'Villa del Prado', 'Valladolid', 'Valladolid', '47014',
  false, 110, 90, 'buen_estado', 'Magnífico piso familiar en Villa del Prado', 
  'Vivienda lista para entrar a vivir en una de las zonas de mayor expansión. Luminoso salón, 3 dormitorios, 2 baños. Urbanización cerrada con piscina y pádel. Incluye garaje y trastero. Ubicación excepcional junto a espacios verdes.',
  '{"floor": 1, "has_elevator": true, "rooms": 3, "bathrooms": 2, "has_parking": true, "has_pool": true}'::jsonb
),
(
  'piso', 'venta', null, 155000.00, 'Calle Cigüeña 22, 4ºD', 'Pajarillos', 'Valladolid', 'Valladolid', '47012',
  false, 85, 75, 'buen_estado', 'Acogedor piso exterior en zona consolidada', 
  'Excelente distribución con 3 dormitorios, baño reformado, amplia cocina y terraza cerrada. Finca dotada de ascensor. Zona inmejorable con todos los servicios, comercios, colegios y parques. Muy buena oportunidad de inversión o primera vivienda.',
  '{"floor": 4, "has_elevator": true, "rooms": 3, "bathrooms": 1, "has_parking": false}'::jsonb
),
(
  'piso', 'venta', 'duplex', 280000.00, 'Calle Monasterio de Yuste 8', 'Huerta del Rey', 'Valladolid', 'Valladolid', '47014',
  true, 140, 125, 'buen_estado', 'Espectacular Dúplex en Huerta del Rey', 
  'Dúplex de amplias dimensiones con vistas despejadas. 4 dormitorios y 3 baños. Construcción moderna, buenas calidades. Dispone de dos plazas de aparcamiento y un generoso trastero. Perfecto para familias que buscan espacio y comodidad a un paso del centro.',
  '{"floor": 6, "has_elevator": true, "rooms": 4, "bathrooms": 3, "has_parking": true}'::jsonb
),
(
  'chalet', 'alquiler', 'adosado', 1200.00, 'Calle del Pinar 14', 'Pinar de Jalón', 'Valladolid', 'Valladolid', '47013',
  true, 200, 175, 'buen_estado', 'Chalet Adosado de reciente construcción en Pinar de Jalón', 
  'Se alquila adosado sin amueblar. 4 dormitorios, buhardilla acondicionada y bonito jardín trasero de uso privativo. Sótano con garaje para dos coches. Urbanización muy tranquila que dispone de piscina. Muy buenas conexiones por ronda exterior.',
  '{"plot_area": 120, "floors_count": 3, "rooms": 4, "bathrooms": 3, "has_pool": true}'::jsonb
),
(
  'piso', 'venta', null, 350000.00, 'Acera de Recoletos 10, 2º Izda', 'Acera de Recoletos', 'Valladolid', 'Valladolid', '47004',
  false, 160, 140, 'a_reformar', 'Gran piso señorial con vistas al Campo Grande', 
  'Vivienda exclusiva situada en la mejor calle de Valladolid. Balcones orientados directamente a Campo Grande. Suelos de madera original y altos techos con molduras. Más de 150m2 para poder actualizar y convertir en una residencia espectacular.',
  '{"floor": 2, "has_elevator": true, "rooms": 5, "bathrooms": 2, "has_parking": false}'::jsonb
);
