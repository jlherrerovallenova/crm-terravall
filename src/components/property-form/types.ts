import { 
  Clipboard, 
  MapPin, 
  Ruler, 
  Globe, 
  FileSignature, 
  Home, 
  Key, 
  Store, 
  Briefcase, 
  Compass, 
  Warehouse,
  type LucideIcon
} from 'lucide-react';
import type { PropertyFormValues } from '@/schema/property.schema';

export interface PropertyFormProps {
  initialData?: PropertyFormValues & { id?: string };
}

export interface StepItem {
  id: number;
  name: string;
  desc: string;
  icon: LucideIcon;
}

export const steps: StepItem[] = [
  { id: 1, name: 'Básicos', desc: 'Tipo, precio y contrato', icon: Clipboard },
  { id: 2, name: 'Ubicación', desc: 'Dirección y visibilidad', icon: MapPin },
  { id: 3, name: 'Detalles', desc: 'Características y energía', icon: Ruler },
  { id: 4, name: 'Publicación', desc: 'Fotos, descripción y portales', icon: Globe },
  { id: 5, name: 'Encargo Venta', desc: 'Propietario y honorarios', icon: FileSignature }
];

export const propertyTypes = [
  { value: 'piso', label: 'Piso / Apartamento', icon: Home, desc: 'Apartamentos, áticos, dúplex y estudios' },
  { value: 'chalet', label: 'Chalet / Casa', icon: Key, desc: 'Casas unifamiliares, chalets y adosados' },
  { value: 'local', label: 'Local Comercial', icon: Store, desc: 'Locales comerciales, oficinas a pie de calle' },
  { value: 'oficina', label: 'Oficina', icon: Briefcase, desc: 'Despachos, oficinas en edificios comerciales' },
  { value: 'terreno', label: 'Terreno', icon: Compass, desc: 'Parcelas urbanas, rústicas e industriales' },
  { value: 'nave', label: 'Nave Industrial', icon: Warehouse, desc: 'Almacenes, naves comerciales y logísticas' },
];

export const operations = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'traspaso', label: 'Traspaso' }
];

export const energyOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'exento', 'en_tramite'];

export const defaultSpecificFeatures = {
  // Piso / Vivienda
  floor: 0,
  rooms: 0,
  bathrooms: 0,
  community_fees: 0,
  has_elevator: false,
  has_terrace: false,
  has_balcony: false,
  orientation: [],
  interior_exterior: 'exterior',
  built_in_wardrobes: false,
  air_conditioning: false,
  has_storage_room: false,
  has_pool: false,
  has_garden: false,
  has_parking: false,
  parking_included: true,
  parking_price: 0,
  accessible_exterior: false,
  wheelchair_accessible: false,
  construction_year: 0,
  // Chalet
  plot_area: 0,
  garden_type: 'ninguno',
  floors_count: 1,
  // Local
  facade_meters: 0,
  smoke_extractor: false,
  last_activity: '',
  layout: 'diáfano',
  shop_windows: 0,
  // Oficina
  // Terreno
  zoning: 'residencial',
  buildable_area: 0,
  has_electricity: false,
  has_water: false,
  has_gas: false,
  has_sewerage: false,
  // Nave
  activity: 'almacen',
  height_free: 0,
  loading_docks: 0,
  cranes_count: 0,
  has_heating: false,
  has_air_conditioning: false,
  has_security_system: false,
  has_fire_system: false,
  has_offices: false
};

export const currencyFormatter = new Intl.NumberFormat('es-ES', { 
  style: 'currency', 
  currency: 'EUR', 
  maximumFractionDigits: 0 
});

export const sanitizeData = (data: any) => {
  if (!data) return data;
  const clean: any = {};
  for (const k in data) {
    clean[k] = data[k] === null ? undefined : data[k];
  }
  return clean;
};

export const cleanErrorMessage = (msg?: string): string => {
  if (!msg) return "Este campo es obligatorio";
  if (msg.includes("expected number") || msg.includes("received NaN") || msg.includes("received nan") || msg.includes("Expected number")) {
    return "Introduce un número válido";
  }
  if (msg.includes("Required") || msg.includes("required")) {
    return "Este campo es obligatorio";
  }
  if (msg.includes("Invalid email") || msg.includes("invalid email")) {
    return "El correo electrónico no es válido";
  }
  if (msg.includes("Invalid url") || msg.includes("invalid url")) {
    return "La URL introducida no es válida";
  }
  return msg;
};

export const FIELD_LABELS: Record<string, string> = {
  type: "Tipo de Inmueble",
  operation: "Tipo de Operación",
  subtype: "Subtipo de Inmueble",
  price: "Precio de Salida",
  address_hidden: "Dirección Exacta (Calle y Número)",
  address_public: "Zona / Barrio Público",
  city: "Municipio",
  province: "Provincia",
  zipcode: "Código Postal",
  block_stairs: "Portal / Escalera",
  door: "Puerta",
  urbanization_name: "Urbanización",
  visibility: "Visibilidad de Dirección",
  capture_agent: "Agente de Captación",
  sales_agent: "Agente de Venta",
  title: "Título Comercial (SEO)",
  description: "Descripción Detallada (SEO)",
  owner_name: "Nombre del Propietario / Vendedor",
  owner_phone: "Teléfono del Propietario",
  owner_email: "Email del Propietario",
  owner_address: "Domicilio del Propietario",
  owner_city: "Municipio del Propietario",
  owner_zipcode: "CP del Propietario",
  owner_dni: "DNI / NIE del Propietario",
  registry_number: "Nº Finca Registral",
  cadastral_reference: "Referencia Catastral",
};

export const getErrorFields = (obj: any): string[] => {
  let fields: string[] = [];
  for (const key in obj) {
    if (obj[key]?.message) {
      fields.push(FIELD_LABELS[key] || key);
    } else if (typeof obj[key] === 'object') {
      fields = [...fields, ...getErrorFields(obj[key])];
    }
  }
  return fields;
};
