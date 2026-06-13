import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envVars = {};
fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

const properties = [
  {
    operation: "venta",
    type: "piso",
    subtype: "atico",
    price: 320000,
    address_hidden: "Calle de Santiago 15, 5ºB",
    address_public: "Centro",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47001",
    hide_exact_address: false,
    area_built: 120,
    area_useful: 105,
    condition: "buen_estado",
    title: "Espectacular Ático en pleno Centro de Valladolid",
    description: "Extraordinario ático situado en la prestigiosa Calle Santiago. Cuenta con una gran terraza orientada al sur. Dispone de 3 amplios dormitorios, 2 baños completos y un enorme salón. Plaza de garaje incluida. ¡No deje pasar la oportunidad de vivir en pleno centro de la ciudad!",
    specific_features: { floor: 5, has_elevator: true, rooms: 3, bathrooms: 2, has_parking: true }
  },
  {
    operation: "venta",
    type: "piso",
    price: 185000,
    address_hidden: "Paseo de Zorrilla 88, 3ºA",
    address_public: "Paseo de Zorrilla",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47006",
    hide_exact_address: false,
    area_built: 95,
    area_useful: 82,
    condition: "a_reformar",
    title: "Piso amplio y luminoso en Paseo de Zorrilla",
    description: "Excelente piso situado en una de las mejores zonas del Paseo de Zorrilla, frente a El Corte Inglés. Excelente altura y luz natural todo el día. Dispone de 4 dormitorios y necesita actualización, ideal para hacerlo a tu gusto. Finca con ascensor.",
    specific_features: { floor: 3, has_elevator: true, rooms: 4, bathrooms: 1, has_parking: false }
  },
  {
    operation: "venta",
    type: "chalet",
    subtype: "adosado",
    price: 450000,
    address_hidden: "Calle Hernando de Acuña 42",
    address_public: "Parquesol",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47014",
    hide_exact_address: true,
    area_built: 280,
    area_useful: 245,
    condition: "buen_estado",
    title: "Exclusivo Chalet Adosado en Parquesol",
    description: "Estupendo chalet adosado en Parquesol. 4 plantas, amplio salón con acceso al jardín, 4 dormitorios en la primera planta y buhardilla acondicionada. Bodega equipada con chimenea. Urbanización con zonas comunes, piscina y pistas deportivas. Calidades inmejorables.",
    specific_features: { plot_area: 150, floors_count: 4, rooms: 5, bathrooms: 4, has_pool: true }
  },
  {
    operation: "alquiler",
    type: "piso",
    price: 950,
    address_hidden: "Calle Duque de la Victoria 5, 2ºC",
    address_public: "Centro - Plaza Mayor",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47001",
    hide_exact_address: true,
    area_built: 85,
    area_useful: 75,
    condition: "obra_nueva",
    title: "Precioso piso de diseño a estrenar junto a la Plaza Mayor",
    description: "Vivienda recién reformada de forma integral. Diseño moderno y calidades de lujo. Suelo radiante, cocina integrada, 2 habitaciones y 1 baño. Un espacio único en el centro histórico de la ciudad. Ideal para parejas o profesionales.",
    specific_features: { floor: 2, has_elevator: true, rooms: 2, bathrooms: 1, has_parking: false }
  },
  {
    operation: "venta",
    type: "chalet",
    subtype: "independiente",
    price: 590000,
    address_hidden: "Camino de la Flecha 18",
    address_public: "Covaresa",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47008",
    hide_exact_address: false,
    area_built: 350,
    area_useful: 310,
    condition: "buen_estado",
    title: "Impresionante Chalet Independiente en Covaresa",
    description: "Exclusiva propiedad en Covaresa. Chalet independiente sobre parcela de 800m2 con jardín privado y piscina. Salón a doble altura, 5 dormitorios y 4 baños completos. Garaje para 3 vehículos. Total privacidad en un entorno privilegiado de la ciudad.",
    specific_features: { plot_area: 800, floors_count: 2, rooms: 5, bathrooms: 4, has_pool: true }
  },
  {
    operation: "venta",
    type: "piso",
    price: 215000,
    address_hidden: "Calle Mieses 12, 1ºA",
    address_public: "Villa del Prado",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47014",
    hide_exact_address: false,
    area_built: 110,
    area_useful: 90,
    condition: "buen_estado",
    title: "Magnífico piso familiar en Villa del Prado",
    description: "Vivienda lista para entrar a vivir en una de las zonas de mayor expansión. Luminoso salón, 3 dormitorios, 2 baños. Urbanización cerrada con piscina y pádel. Incluye garaje y trastero. Ubicación excepcional junto a espacios verdes.",
    specific_features: { floor: 1, has_elevator: true, rooms: 3, bathrooms: 2, has_parking: true, has_pool: true }
  },
  {
    operation: "venta",
    type: "piso",
    price: 155000,
    address_hidden: "Calle Cigüeña 22, 4ºD",
    address_public: "Pajarillos",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47012",
    hide_exact_address: false,
    area_built: 85,
    area_useful: 75,
    condition: "buen_estado",
    title: "Acogedor piso exterior en zona consolidada",
    description: "Excelente distribución con 3 dormitorios, baño reformado, amplia cocina y terraza cerrada. Finca dotada de ascensor. Zona inmejorable con todos los servicios, comercios, colegios y parques. Muy buena oportunidad de inversión o primera vivienda.",
    specific_features: { floor: 4, has_elevator: true, rooms: 3, bathrooms: 1, has_parking: false }
  },
  {
    operation: "venta",
    type: "piso",
    subtype: "duplex",
    price: 280000,
    address_hidden: "Calle Monasterio de Yuste 8",
    address_public: "Huerta del Rey",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47014",
    hide_exact_address: true,
    area_built: 140,
    area_useful: 125,
    condition: "buen_estado",
    title: "Espectacular Dúplex en Huerta del Rey",
    description: "Dúplex de amplias dimensiones con vistas despejadas. 4 dormitorios y 3 baños. Construcción moderna, buenas calidades. Dispone de dos plazas de aparcamiento y un generoso trastero. Perfecto para familias que buscan espacio y comodidad a un paso del centro.",
    specific_features: { floor: 6, has_elevator: true, rooms: 4, bathrooms: 3, has_parking: true }
  },
  {
    operation: "alquiler",
    type: "chalet",
    subtype: "adosado",
    price: 1200,
    address_hidden: "Calle del Pinar 14",
    address_public: "Pinar de Jalón",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47013",
    hide_exact_address: true,
    area_built: 200,
    area_useful: 175,
    condition: "buen_estado",
    title: "Chalet Adosado de reciente construcción en Pinar de Jalón",
    description: "Se alquila adosado sin amueblar. 4 dormitorios, buhardilla acondicionada y bonito jardín trasero de uso privativo. Sótano con garaje para dos coches. Urbanización muy tranquila que dispone de piscina. Muy buenas conexiones por ronda exterior.",
    specific_features: { plot_area: 120, floors_count: 3, rooms: 4, bathrooms: 3, has_pool: true }
  },
  {
    operation: "venta",
    type: "piso",
    price: 350000,
    address_hidden: "Acera de Recoletos 10, 2º Izda",
    address_public: "Acera de Recoletos",
    city: "Valladolid",
    province: "Valladolid",
    zipcode: "47004",
    hide_exact_address: false,
    area_built: 160,
    area_useful: 140,
    condition: "a_reformar",
    title: "Gran piso señorial con vistas al Campo Grande",
    description: "Vivienda exclusiva situada en la mejor calle de Valladolid. Balcones orientados directamente a Campo Grande. Suelos de madera original y altos techos con molduras. Más de 150m2 para poder actualizar y convertir en una residencia espectacular.",
    specific_features: { floor: 2, has_elevator: true, rooms: 5, bathrooms: 2, has_parking: false }
  }
];

async function seed() {
  console.log("Starting seed process...");
  for (const property of properties) {
    const { data, error } = await supabase.from('properties').insert([property]);
    if (error) console.error("Error inserting:", property.title, error.message);
    else console.log(`Successfully inserted: ${property.title}`);
  }
  console.log("Seeding complete.");
}

seed();
