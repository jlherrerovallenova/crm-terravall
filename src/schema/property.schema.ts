import { z } from "zod";

// 1. Esquema Base Global
const basePropertySchema = z.object({
  operation: z.enum(["venta", "alquiler", "traspaso"], { required_error: "La operación es obligatoria" }),
  type: z.enum(["piso", "chalet", "local", "oficina", "terreno"]),
  subtype: z.string().optional(), // Ej: atico, duplex, estudio
  price: z.number().positive("El precio debe ser mayor a 0"),
  
  // Ubicación atomizada para Idealista
  address_hidden: z.string().min(5, "La dirección privada es obligatoria"),
  address_public: z.string().min(5, "La ubicación pública es obligatoria"),
  city: z.string().min(2, "La población es obligatoria"),
  province: z.string().min(2, "La provincia es obligatoria"),
  zipcode: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  hide_exact_address: z.boolean().default(true),

  area_built: z.number().positive("Los metros construidos son obligatorios"),
  area_useful: z.number().positive("Los metros útiles son obligatorios"),
  condition: z.enum(["buen_estado", "a_reformar", "obra_nueva"]),
  
  // Certificado Energético (A, B, C, D, E, F, G, exento, en_tramite)
  energy_certificate: z.enum(["A", "B", "C", "D", "E", "F", "G", "exento", "en_tramite"]).default("en_tramite"),

  title: z.string().min(10, "El título comercial es demasiado corto").max(100),
  description: z.string().min(50, "La descripción debe tener al menos 50 caracteres (SEO)"),

  // Publicación
  publish_web: z.boolean().default(false),
  publish_idealista: z.boolean().default(false),
  publish_fotocasa: z.boolean().default(false),
});

// 2. Esquemas Específicos
const specificPisoSchema = z.object({
  type: z.literal("piso"),
  specific_features: z.object({
    floor: z.number().int({ message: "La planta debe ser un número entero" }),
    has_elevator: z.boolean(),
    community_fees: z.number().nonnegative(),
    has_terrace: z.boolean(),
    orientation: z.enum(["norte", "sur", "este", "oeste", "múltiple"]).optional(),
    rooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
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
    rooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
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
