import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un número entero (euros) a su representación en palabras en español (MAYÚSCULAS).
 * Versión correcta para documentos legales (Encargo de Venta, Contrato de Arras).
 */
export function numberToSpanishWords(num: number): string {
  if (!num || isNaN(num)) return 'CERO EUROS';
  if (num === 0) return 'CERO EUROS';

  const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (num === 100) return 'CIEN EUROS';
  if (num === 1000) return 'MIL EUROS';

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      if (n === 100) str += 'cien ';
      else str += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) str += ' y ' + units[n % 10];
      str += ' ';
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  let result = '';
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (thousands > 0) {
    if (thousands === 1) result += 'mil ';
    else result += convertGroup(thousands) + ' mil ';
  }
  if (remainder > 0) {
    result += convertGroup(remainder) + ' ';
  }

  return (result.trim() + ' euros').toUpperCase();
}

const priceFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * Formatea un número como precio en euros (es-ES).
 */
export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

/**
 * Traduce el tipo interno de inmueble a texto legible en español.
 */
export function formatType(type: string): string {
  const types: Record<string, string> = {
    piso: 'Piso',
    chalet: 'Chalet',
    local: 'Local',
    oficina: 'Oficina',
    terreno: 'Terreno',
    nave: 'Nave Industrial',
  };
  return types[type] || type;
}
