import { z } from "zod";

export const civilStatusSchema = z.enum(['soltero', 'casado', 'pareja_de_hecho', 'divorciado', 'separado', 'viudo']);
export type CivilStatus = z.infer<typeof civilStatusSchema>;

export const rentalContractSchema = z.object({
  city: z.string().min(2, "La ciudad es obligatoria"),
  dateStr: z.string().min(5, "La fecha es obligatoria"),
  
  // Propietario / Arrendador 1
  owner1Name: z.string().min(3, "El nombre del propietario es obligatorio"),
  owner1Dni: z.string().min(5, "El DNI/NIE del propietario es obligatorio"),
  owner1CivilStatus: civilStatusSchema.default("soltero"),
  owner1Street: z.string().optional(),
  owner1Number: z.string().optional(),
  owner1FloorLetter: z.string().optional(),
  owner1City: z.string().optional(),
  owner1Province: z.string().optional(),
  owner1Zipcode: z.string().optional(),
  owner1Address: z.string().optional(),
  
  // Propietario / Arrendador 2
  hasOwner2: z.boolean().default(false),
  owner2Name: z.string().optional(),
  owner2Dni: z.string().optional(),
  owner2CivilStatus: civilStatusSchema.optional(),
  owner2Street: z.string().optional(),
  owner2Number: z.string().optional(),
  owner2FloorLetter: z.string().optional(),
  owner2City: z.string().optional(),
  owner2Province: z.string().optional(),
  owner2Zipcode: z.string().optional(),
  
  // Inquilino / Arrendatario 1
  tenant1Name: z.string().min(3, "El nombre del inquilino es obligatorio"),
  tenant1Dni: z.string().min(5, "El DNI/NIE del inquilino es obligatorio"),
  tenant1CivilStatus: civilStatusSchema.default("soltero"),
  tenant1Street: z.string().optional(),
  tenant1Number: z.string().optional(),
  tenant1FloorLetter: z.string().optional(),
  tenant1City: z.string().optional(),
  tenant1Province: z.string().optional(),
  tenant1Zipcode: z.string().optional(),
  tenant1Address: z.string().optional(),
  
  // Inquilino / Arrendatario 2
  hasTenant2: z.boolean().default(false),
  tenant2Name: z.string().optional(),
  tenant2Dni: z.string().optional(),
  tenant2CivilStatus: civilStatusSchema.optional(),
  tenant2Street: z.string().optional(),
  tenant2Number: z.string().optional(),
  tenant2FloorLetter: z.string().optional(),
  tenant2City: z.string().optional(),
  tenant2Province: z.string().optional(),
  tenant2Zipcode: z.string().optional(),
  
  // Inmueble
  propertyAddress: z.string().min(5, "La dirección de la vivienda es obligatoria"),
  propertyStreet: z.string().optional(),
  propertyNumber: z.string().optional(),
  propertyFloorLetter: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyProvince: z.string().optional(),
  propertyZipcode: z.string().optional(),
  cadastralReference: z.string().optional(),
  registryNumber: z.string().optional(),
  registryCity: z.string().optional(),
  cru: z.string().optional(),
  
  // Equipamiento
  kitchenEquipped: z.boolean().default(false),
  isFurnished: z.boolean().default(false),
  maxOccupants: z.number().int().positive().default(1),
  petsAllowed: z.boolean().default(false),
  
  // Condiciones Económicas
  startDate: z.string().min(5, "La fecha de entrada en vigor es obligatoria"),
  durationYears: z.number().int().positive().default(1),
  monthlyRent: z.number().positive("La renta mensual debe ser mayor a 0"),
  ibanHolder: z.string().min(3, "El titular del IBAN es obligatorio"),
  iban: z.string().min(10, "El IBAN es obligatorio"),
  ownerEmail: z.union([z.string().email({ message: "Email del propietario no válido" }), z.literal("")]).optional(),
  tenantEmail: z.union([z.string().email({ message: "Email del inquilino no válido" }), z.literal("")]).optional(),
  tenantPhone: z.string().optional(),
  rentIndex: z.string().default("I.R.A.V."),
  depositAmount: z.number().nonnegative("La fianza es obligatoria"),
  additionalGuarantee: z.number().nonnegative().default(0),
  communityPaidByOwner: z.boolean().default(true),
  ibiPaidByOwner: z.boolean().default(true)
});

export type RentalContractValues = z.infer<typeof rentalContractSchema>;
