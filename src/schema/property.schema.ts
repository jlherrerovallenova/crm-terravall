import { z } from "zod";

// 1. Esquema Base Global
const basePropertySchema = z.object({
  operation: z.enum(["venta", "alquiler", "traspaso"], { message: "La operación es obligatoria" }),
  type: z.enum(["piso", "chalet", "local", "oficina", "terreno", "nave"]),
  subtype: z.string().optional(), // Ej: atico, duplex, estudio
  price: z.preprocess(
    val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
    z.number({ required_error: "El precio es obligatorio", invalid_type_error: "El precio debe ser un número mayor a 0" }).positive("El precio debe ser mayor a 0")
  ),
  
  // Ubicación
  address_hidden: z.string().min(5, "La dirección privada es obligatoria"),
  address_public: z.string().optional().default(""),
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

  area_built: z.preprocess(
    val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
    z.number({ required_error: "Los m² construidos son obligatorios", invalid_type_error: "Introduce un valor numérico para m² construidos" }).nonnegative("Los metros construidos no pueden ser negativos")
  ),
  area_useful: z.preprocess(
    val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
    z.number({ required_error: "Los m² útiles son obligatorios", invalid_type_error: "Introduce un valor numérico para m² útiles" }).nonnegative("Los metros útiles no pueden ser negativos")
  ),
  condition: z.enum(["buen_estado", "a_reformar", "obra_nueva"]),
  
  // Certificado Energético y Emisiones
  energy_certificate: z.enum(["A", "B", "C", "D", "E", "F", "G", "exento", "en_tramite"]).default("en_tramite"),
  energy_consumption: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
  emissions_certificate: z.enum(["A", "B", "C", "D", "E", "F", "G", "exento", "en_tramite"]).default("en_tramite"),
  emissions: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),

  // Textos SEO
  title: z.string().min(10, "El título comercial es demasiado corto").max(100),
  description: z.string().min(50, "La descripción debe tener al menos 50 caracteres (SEO)"),

  // Publicación
  publish_web: z.boolean().default(false),
  publish_idealista: z.boolean().default(false),
  publish_fotocasa: z.boolean().default(false),

  // Datos Internos
  website_url: z.string().url("La URL no es válida").optional().or(z.literal("")),
  capture_agent: z.string().optional(),
  sales_agent: z.string().optional(),
  internal_reference: z.string().optional(),
  private_notes: z.string().optional(),
  notes_visibility: z.enum(["solo_yo", "oficina"]).default("solo_yo"),

  // Encargo de Venta y Propietarios
  owner_name: z.string().optional(),
  owner_dni: z.string().optional(),
  owner_civil_status: z.enum(["soltero", "casado", "pareja_de_hecho", "divorciado", "separado", "viudo"]).optional().default("soltero"),
  owner_matrimonial_regime: z.enum(["gananciales", "separacion_bienes", "participacion"]).optional().default("gananciales"),
  owner_address: z.string().optional(),
  owner_city: z.string().optional(),
  owner_zipcode: z.string().optional(),
  owner_province: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().optional(),
  has_owner2: z.boolean().optional().default(false),
  owner2_name: z.string().optional(),
  owner2_dni: z.string().optional(),
  owner2_civil_status: z.enum(["soltero", "casado", "pareja_de_hecho", "divorciado", "separado", "viudo"]).optional().default("soltero"),
  owners_relationship: z.enum(["ninguna", "casados_entre_si", "pareja_hecho_entre_si"]).optional().default("ninguna"),
  commission_type: z.enum(["porcentaje", "fija"]).default("porcentaje"),
  commission_value: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
  exclusivity_months: z.union([z.number().int(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
});

// 2. Esquemas Específicos
const specificPisoSchema = z.object({
  type: z.literal("piso"),
  specific_features: z.object({
    floor: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
      z.number({ required_error: "La planta es obligatoria", invalid_type_error: "Introduce un número entero para la planta" }).int("La planta debe ser un número entero")
    ),
    has_elevator: z.boolean(),
    community_fees: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    has_terrace: z.boolean(),
    has_balcony: z.boolean().default(false),
    orientation: z.array(z.enum(["norte", "sur", "este", "oeste"])).optional().default([]),
    rooms: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int("Las habitaciones deben ser un número entero").nonnegative().default(0)
    ),
    bathrooms: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int("Los baños deben ser un número entero").nonnegative().default(0)
    ),
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
    construction_year: z.union([z.number().int(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v)
  })
});

const specificChaletSchema = z.object({
  type: z.literal("chalet"),
  specific_features: z.object({
    plot_area: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
      z.number({ required_error: "Los metros de parcela son obligatorios", invalid_type_error: "Introduce una cifra numérica de metros de parcela" }).positive("Los metros de parcela son obligatorios")
    ),
    garden_type: z.enum(["privado", "comunitario", "ninguno"]),
    floors_count: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 1 : Number(val)),
      z.number().int().positive().default(1)
    ),
    has_pool: z.boolean(),
    heating_type: z.string().optional(),
    heating_fuel: z.string().optional(),
    rooms: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
    bathrooms: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
    built_in_wardrobes: z.boolean().default(false),
    air_conditioning: z.boolean().default(false),
    has_terrace: z.boolean().default(false),
    has_balcony: z.boolean().default(false),
    has_storage_room: z.boolean().default(false),
    has_parking: z.boolean().default(false),
    parking_included: z.union([z.boolean(), z.string()]).transform(val => val === true || val === "true").default(true),
    parking_price: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    construction_year: z.union([z.number().int(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v)
  })
});

const specificLocalSchema = z.object({
  type: z.literal("local"),
  specific_features: z.object({
    facade_meters: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().nonnegative().default(0)
    ),
    smoke_extractor: z.boolean(),
    last_activity: z.string().optional(),
    layout: z.enum(["diáfano", "compartimentado"]),
    shop_windows: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
  })
});

const specificOficinaSchema = z.object({
  type: z.literal("oficina"),
  specific_features: z.object({
    layout: z.enum(["diáfano", "compartimentado"]),
    bathrooms: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
    has_elevator: z.boolean().default(false),
    has_parking: z.boolean().default(false),
    air_conditioning: z.boolean().default(false),
    heating_type: z.string().optional(),
    construction_year: z.union([z.number().int(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v)
  })
});

const specificTerrenoSchema = z.object({
  type: z.literal("terreno"),
  specific_features: z.object({
    plot_area: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
      z.number({ required_error: "Los metros de parcela son obligatorios", invalid_type_error: "Introduce una cifra numérica de metros de parcela" }).positive("Los metros de parcela son obligatorios")
    ),
    zoning: z.enum(["residencial", "comercial", "industrial", "agrario"]),
    buildable_area: z.union([z.number(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    has_electricity: z.boolean().default(false),
    has_water: z.boolean().default(false),
    has_gas: z.boolean().default(false),
    has_sewerage: z.boolean().default(false)
  })
});

const specificNaveSchema = z.object({
  type: z.literal("nave"),
  specific_features: z.object({
    activity: z.enum(["almacen", "industrial", "comercial", "oficinas", "otros"]),
    height_free: z.union([z.number().nonnegative(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    bathrooms: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
    loading_docks: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
    cranes_count: z.preprocess(
      val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? 0 : Number(val)),
      z.number().int().nonnegative().default(0)
    ),
    plot_area: z.union([z.number().nonnegative(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    construction_year: z.union([z.number().int(), z.nan()]).optional().transform(v => Number.isNaN(v) ? undefined : v),
    has_heating: z.boolean().default(false),
    has_air_conditioning: z.boolean().default(false),
    has_security_system: z.boolean().default(false),
    has_fire_system: z.boolean().default(false),
    has_offices: z.boolean().default(false),
  })
});

// 3. Unión Discriminada
export const propertySchema = z.discriminatedUnion("type", [
  basePropertySchema.merge(specificPisoSchema),
  basePropertySchema.merge(specificChaletSchema),
  basePropertySchema.merge(specificLocalSchema),
  basePropertySchema.merge(specificOficinaSchema),
  basePropertySchema.merge(specificTerrenoSchema),
  basePropertySchema.merge(specificNaveSchema),
]);

export type PropertyFormValues = z.infer<typeof propertySchema>;
