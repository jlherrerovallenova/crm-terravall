import { z } from "zod";

export const valuationSchema = z.object({
  client_name: z.string().min(2, "El nombre del cliente es obligatorio"),
  client_phone: z.string().optional(),
  client_email: z.union([z.string().email({ message: "Email no válido" }), z.literal("")]).optional(),
  property_type: z.enum(["piso", "chalet", "local", "oficina", "terreno", "nave"]),
  city: z.string().min(2, "El municipio es obligatorio"),
  province: z.string().min(2, "La provincia es obligatoria"),
  zone: z.string().optional(),
  zipcode: z.string().optional(),
  address: z.string().optional(),
  cadastral_reference: z.string().optional(),
  year_built: z.preprocess(
    val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
    z.number().int().optional()
  ),
  area_built: z.preprocess(
    val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
    z.number({ message: "Los m² construidos deben ser un número positivo" }).positive("Debe ser mayor a 0")
  ),
  area_useful: z.preprocess(
    val => (val === "" || val === null || (typeof val === "number" && isNaN(val)) ? undefined : Number(val)),
    z.number().positive().optional()
  ),
  rooms: z.number().int().nonnegative().default(0),
  bathrooms: z.number().int().nonnegative().default(0),
  condition: z.enum(["obra_nueva", "buen_estado", "a_reformar"]),
  energy_certificate: z.enum(["A", "B", "C", "D", "E", "F", "G", "en_tramite", "exento"]).default("en_tramite"),
  orientation: z.enum(["Norte", "Sur", "Este", "Oeste", "Noreste", "Noroeste", "Sureste", "Suroeste", "Sin especificar"]).default("Sur"),
  floor_height: z.string().default("Planta Intermedia"),
  purpose: z.enum(["venta", "alquiler", "herencia", "hipotecaria_orientativa"]).default("venta"),
  has_elevator: z.boolean().default(false),
  has_parking: z.boolean().default(false),
  has_terrace: z.boolean().default(false),
  has_pool: z.boolean().default(false),
  has_storage: z.boolean().default(false),
  has_heating: z.boolean().default(true),
  has_views: z.boolean().default(false),
});

export type ValuationFormValues = z.infer<typeof valuationSchema>;
