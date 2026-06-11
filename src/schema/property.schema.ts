import { z } from "zod";

// 1. Esquema Base Global
const basePropertySchema = z.object({
  operation: z.enum(["venta", "alquiler", "traspaso"], { required_error: "La operación es obligatoria" }),
  type: z.enum(["piso", "chalet", "local", "oficina", "terreno"]),
  subtype: z.string().optional(), // Ej: atico, duplex, estudio
  price: z.number().positive("El precio debe ser mayor a 0"),
  
  // Ubicación
  address_hidden: z.string().min(5, "La dirección privada es obligatoria"),
  address_public: z.string().min(5, "La ubicación pública es obligatoria"),
  city: z.string().min(2, "La población es obligatoria"),
  province: z.string().min(2, "La provincia es obligatoria"),
  zipcode: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  
  // Nuevos campos de ubicación
  block_stairs: z.string().optional(),
  door: z.string().optional(),
  urbanization_name: z.string().optional(),
  visibility: z.enum(["exact", "street_only", "hidden"]).default("exact"),
  is_top_floor: z.boolean().default(false),

  // Nuevos campos globales de características
  is_bank_owned: z.boolean().default(false),
  exceptional_situation: z.enum(["ocupada", "alquilada", "nuda_propiedad", "ninguna"]).default("ninguna"),

  area_built: z.number().positive("Los metros construidos son obligatorios"),
  area_useful: z.number().positive("Los metros útiles son obligatorios"),
  condition: z.enum(["buen_estado", "a_reformar", "obra_nueva"]),
  
  // Certificado Energético y Emisiones
  energy_certificate: z.enum(["A", "B", "C", "D", "E", "F", "G", "exento", "en_tramite"]).default("en_tramite"),
  energy_consumption: z.number().optional(),
  emissions_certificate: z.enum(["A", "B", "C", "D", "E", "F", "G", "exento", "en_tramite"]).default("en_tramite"),
  emissions: z.number().optional(),

  // Textos SEO
  title: z.string().min(10, "El título comercial es demasiado corto").max(100),
  description: z.string().min(50, "La descripción debe tener al menos 50 caracteres (SEO)"),

  // Publicación
  publish_web: z.boolean().default(false),
  publish_idealista: z.boolean().default(false),
  publish_fotocasa: z.boolean().default(false),

  // Datos Internos
  website_url: z.string().url().optional().or(z.literal("")),
  capture_agent: z.string().optional(),
  sales_agent: z.string().optional(),
  internal_reference: z.string().optional(),
  private_notes: z.string().optional(),
  notes_visibility: z.enum(["solo_yo", "oficina"]).default("solo_yo"),
});

// 2. Esquemas Específicos
const specificPisoSchema = z.object({
  type: z.literal("piso"),
  specific_features: z.object({
    floor: z.number().int({ message: "La planta debe ser un número entero" }),
    has_elevator: z.boolean(),
    community_fees: z.number().nonnegative(),
    has_terrace: z.boolean(),
    has_balcony: z.boolean().default(false),
    orientation: z.array(z.enum(["norte", "sur", "este", "oeste"])).optional().default([]),
    rooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    interior_exterior: z.enum(["interior", "exterior"]).default("exterior"),
    built_in_wardrobes: z.boolean().default(false),
    air_conditioning: z.boolean().default(false),
    has_storage_room: z.boolean().default(false),
    has_pool: z.boolean().default(false),
    has_garden: z.boolean().default(false),
    // Garaje
    has_parking: z.boolean().default(false),
    parking_included: z.union([z.boolean(), z.string()]).transform(val => val === true || val === "true").default(true),
    parking_price: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    // Accesibilidad
    accessible_exterior: z.boolean().default(false),
    wheelchair_accessible: z.boolean().default(false),
    // Calefacción y edificio
    heating_type: z.string().optional(),
    heating_fuel: z.string().optional(),
    construction_year: z.number().int().optional()
  })
});

const specificChaletSchema = z.object({
  type: z.literal("chalet"),
  specific_features: z.object({
    plot_area: z.number().positive("Los metros de parcela son obligatorios"),
    garden_type: z.enum(["privado", "comunitario", "ninguno"]),
    floors_count: z.number().int().positive(),
    has_pool: z.boolean(),
    heating_type: z.string().optional(),
    heating_fuel: z.string().optional(),
    rooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    built_in_wardrobes: z.boolean().default(false),
    air_conditioning: z.boolean().default(false),
    has_terrace: z.boolean().default(false),
    has_balcony: z.boolean().default(false),
    has_storage_room: z.boolean().default(false),
    has_parking: z.boolean().default(false),
    parking_included: z.union([z.boolean(), z.string()]).transform(val => val === true || val === "true").default(true),
    parking_price: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    construction_year: z.number().int().optional()
  })
});

const specificLocalSchema = z.object({
  type: z.literal("local"),
  specific_features: z.object({
    facade_meters: z.number().nonnegative(),
    smoke_extractor: z.boolean(),
    last_activity: z.string().optional(),
    layout: z.enum(["diáfano", "compartimentado"]),
    shop_windows: z.number().int().nonnegative(),
  })
});

// 3. Unión Discriminada
export const propertySchema = z.discriminatedUnion("type", [
  basePropertySchema.merge(specificPisoSchema),
  basePropertySchema.merge(specificChaletSchema),
  basePropertySchema.merge(specificLocalSchema),
]);

export type PropertyFormValues = z.infer<typeof propertySchema>;
