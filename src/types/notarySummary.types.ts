export interface NotarySummaryFinca {
  id: string;
  label: string; // e.g. "Vivienda", "Trastero", "Garaje"
  registryDescription: string; // e.g. "Inscrita en el Registro de la Propiedad TRES de Valladolid. Finca número 44106."
  price: number; // e.g. 295000
}

export interface NotarySummaryPaymentItem {
  id: string;
  concept: string; // e.g. "PRECIO VENTA", "TOTAL", "ARRAS", "RESTO PAGO"
  detail: string; // e.g. "Vivienda", "Transferencia", "Cheque bancario / Lisa Ann Bombin Navarro"
  amount: number;
  isTotal?: boolean;
}

export interface NotarySummaryData {
  // Datos de Firma y Notaría
  signingDate: string; // e.g. "Día 7 de septiembre de 2026"
  signingTime: string; // e.g. "9:30 am"
  notaryName: string; // e.g. "D. Javier Gómez"
  notaryAddress: string; // e.g. "Miguel Íscar 21"
  notaryOfficer: string; // e.g. "Olga Salas"

  // Título / Objeto de la Operación
  operationTitle: string; // e.g. "COMPRAVENTA DE LA VIVIENDA Y TRASTERO EN CALLE MANZANA Nº 4, 3º B (VALLADOLID)"

  // Fincas Registrales
  fincas: NotarySummaryFinca[];

  // Resumen de Pagos
  totalPrice: number;
  arrasAmount: number;
  arrasMethod: string; // e.g. "Transferencia"
  arrasDetail?: string;
  remainingAmount: number;
  remainingMethod: string; // e.g. "Cheque bancario"
  remainingDetail: string; // e.g. "Lisa Ann Bombin Navarro"

  // Opcionales para flexibilidad extra
  customPaymentRows?: NotarySummaryPaymentItem[];
  notes?: string;
  updatedAt?: string;
}
