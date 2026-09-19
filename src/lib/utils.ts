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

/**
 * Convierte un texto a formato Título (Title Case) respetando preposiciones y artículos españoles.
 */
export const toTitleCase = (str?: string): string => {
  if (!str || !str.trim()) return '';
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en', 'o', 'u', 'con', 'por']);
  
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return '';
      if (index > 0 && lowercaseWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Construye una dirección formateada a partir de sus componentes desglosados.
 */
export const buildAddressString = (
  street?: string,
  number?: string,
  floorLetter?: string,
  city?: string,
  province?: string,
  zipcode?: string
): string => {
  const parts: string[] = [];

  let streetAndNum = (street || '').trim();
  if (number && number.trim()) {
    streetAndNum += streetAndNum ? ` ${number.trim()}` : number.trim();
  }
  if (floorLetter && floorLetter.trim()) {
    streetAndNum += streetAndNum ? ` ${floorLetter.trim()}` : floorLetter.trim();
  }
  if (streetAndNum) parts.push(streetAndNum);

  let cityAndZip = (city || '').trim();
  if (zipcode && zipcode.trim()) {
    cityAndZip = cityAndZip ? `${cityAndZip} (${zipcode.trim()})` : zipcode.trim();
  }
  if (cityAndZip) parts.push(cityAndZip);

  if (province && province.trim() && province.trim().toLowerCase() !== (city || '').trim().toLowerCase()) {
    parts.push(province.trim());
  }

  return parts.join(', ');
};

/**
 * Formatea el registro de la propiedad con su número.
 */
export const formatRegistryOffice = (city?: string, officeNum?: string): string => {
  const c = toTitleCase(city) || '';
  if (!officeNum || !officeNum.trim()) return c || '[Municipio]';
  const num = officeNum.trim();
  const formattedNum = /^n[ºº\.]/i.test(num) ? num : `Nº ${num}`;
  return c ? `${c} ${formattedNum}` : formattedNum;
};

/**
 * Añade Don / Doña / D. / Dª. según el nombre de pila español.
 */
export const formatNameWithHonorific = (rawName?: string, short: boolean = false): string => {
  if (!rawName || !rawName.trim()) return '';
  const cleanName = toTitleCase(rawName.trim());

  // Si ya empieza por Don, Doña, D. o Dª, lo mantenemos
  if (/^(don|doña|d\.|dª\.|dª)\s+/i.test(cleanName)) {
    return cleanName;
  }

  // Extraer el primer nombre de pila
  const firstWord = cleanName.split(/\s+/)[0].toLowerCase();

  // Nombres masculinos españoles comunes terminados en 'a'
  const maleNamesEndingInA = new Set([
    'borja', 'gorka', 'jonatan', 'joshua', 'koldo', 'luka', 'luca', 'nikita', 'enea', 'bautista', 'mustafa', 'musa', 'issa'
  ]);

  // Nombres femeninos españoles comunes que no terminan en 'a'
  const femaleNamesOther = new Set([
    'carmen', 'pilar', 'ines', 'inés', 'dolores', 'mercedes', 'rosario', 'rocio', 'rocío', 'luz', 'paz', 'sol',
    'belen', 'belén', 'concepcion', 'concepción', 'consuelo', 'asuncion', 'asunción', 'encarnacion', 'encarnación',
    'milagros', 'nieves', 'remedios', 'socorro', 'soledad', 'valvanuz', 'mar', 'raquel', 'isabel', 'beatriz',
    'astrid', 'miriam', 'montserrat', 'sonia', 'rut', 'ruth', 'ester', 'esther', 'elena', 'iris', 'monserrat', 'celia'
  ]);

  const isFemale = (firstWord.endsWith('a') || firstWord.endsWith('ía') || femaleNamesOther.has(firstWord)) && !maleNamesEndingInA.has(firstWord);

  const prefix = isFemale 
    ? (short ? 'Dª.' : 'Doña') 
    : (short ? 'D.' : 'Don');

  return `${prefix} ${cleanName}`;
};

/**
 * Construye la dirección formateada para contratos de alquiler.
 */
export const buildRentalAddressString = (
  street?: string,
  number?: string,
  floorLetter?: string,
  city?: string,
  province?: string,
  zipcode?: string,
  fallback?: string
): string => {
  const parts: string[] = [];
  if (street && street.trim()) {
    let s = street.trim();
    if (number && number.trim()) s += ` nº ${number.trim()}`;
    if (floorLetter && floorLetter.trim()) s += `, ${floorLetter.trim()}`;
    parts.push(s);
  }
  const locParts: string[] = [];
  if (city && city.trim()) locParts.push(city.trim());
  if (province && province.trim()) locParts.push(province.trim());
  if (locParts.length > 0) parts.push(locParts.join(' '));
  if (zipcode && zipcode.trim()) parts.push(`CP ${zipcode.trim()}`);
  return parts.length > 0 ? parts.join(', ') : fallback || '';
};

/**
 * Convierte un número en su representación en letras para alquileres.
 */
export const numberToWordsEs = (num: number): string => {
  if (!num || isNaN(num)) return '';
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO EUROS';
  if (num === 100) return 'CIEN EUROS';

  const convertGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      if (n === 100) str += 'CIEN ';
      else str += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) str += ' Y ' + units[n % 10];
      str += ' ';
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  };

  let result = '';
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (thousands > 0) {
    if (thousands === 1) result += 'MIL ';
    else result += convertGroup(thousands) + ' MIL ';
  }
  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return result.trim() + ' EUROS';
};

const rentalCurrencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

export const formatRentalCurrency = (val: number | string): string => {
  const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '0,00 €';
  const formattedNum = rentalCurrencyFormatter.format(num);
  const words = numberToWordsEs(Math.floor(num));
  return `${formattedNum} (${words})`;
};

export const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

