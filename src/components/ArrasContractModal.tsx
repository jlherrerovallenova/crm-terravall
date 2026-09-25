import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrasContractDocument, type ArrasData, type CivilStatus, type MatrimonialRegime, type RelationshipType, type FincaItem, type PersonParty, type RepresentativeItem, getSellerSignersFromData, getBuyerSignersFromData } from './ArrasContractDocument';
import { toTitleCase, buildAddressString, formatNameWithHonorific } from '../lib/utils';
import { SignatureCanvas } from './SignatureCanvas';
import { fetchZipcode } from '@/lib/gemini';
import { fetchCatastroData } from '@/lib/catastro';
import { X, Printer, Copy, Check, FileText, UserPlus, Trash2, CheckSquare, Square, Plus, AlertTriangle, CheckCircle2, Calculator, FileDown, Save, BookmarkCheck, Search, PenTool, Users, ShieldCheck, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onSaveSuccess?: (updatedData?: any) => void;
}

const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const numberToWordsEs = (num: number): string => {
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

const formatCurrency = (val: number | string) => {
  const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '';
  const formattedNum = currencyFormatter.format(num);
  const words = numberToWordsEs(num);
  return `${formattedNum} (${words})`;
};

const validateIBAN = (ibanInput: string): { isValid: boolean; message: string; formatted: string } => {
  if (!ibanInput || !ibanInput.trim()) {
    return { isValid: false, message: 'La cuenta bancaria es requerida', formatted: '' };
  }

  const clean = ibanInput.replace(/[\s-]/g, '').toUpperCase();
  const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;

  if (clean.startsWith('ES')) {
    if (clean.length !== 24) {
      return {
        isValid: false,
        message: `IBAN español incompleto (${clean.length}/24 caracteres). Formato: ESXX XXXX XXXX XXXX XXXX XXXX`,
        formatted,
      };
    }

    const rearranged = clean.substring(4) + clean.substring(0, 4);
    const numericStr = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString());

    let remainder = 0;
    for (let i = 0; i < numericStr.length; i += 7) {
      const block = remainder.toString() + numericStr.substring(i, i + 7);
      remainder = parseInt(block, 10) % 97;
    }

    if (remainder !== 1) {
      return {
        isValid: false,
        message: 'IBAN español no válido (dígitos de control incorrectos)',
        formatted,
      };
    }
  }

  return { isValid: true, message: 'IBAN verificado correctamente', formatted };
};

const cleanDniString = (val?: string): string => {
  if (!val) return '';
  const clean = val.replace(/\./g, '').trim().toUpperCase();
  const matchDni = clean.match(/^(\d{1,8})(-?)([A-Z])$/);
  if (matchDni) {
    const digits = matchDni[1].padStart(8, '0');
    const hyphen = matchDni[2] || '';
    const letter = matchDni[3];
    return `${digits}${hyphen}${letter}`;
  }
  return clean;
};

const validateDNI_NIE = (docStr: string): { isValid: boolean; message: string; formatted: string } => {
  if (!docStr || !docStr.trim()) {
    return { isValid: false, message: 'El documento de identidad es requerido', formatted: '' };
  }

  const clean = docStr.replace(/[\s\.-]/g, '').toUpperCase();
  const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';

  let normalizedClean = clean;
  const shortDniMatch = clean.match(/^(\d{1,8})([A-Z])$/);
  if (shortDniMatch) {
    normalizedClean = `${shortDniMatch[1].padStart(8, '0')}${shortDniMatch[2]}`;
  }

  const dniRegex = /^(\d{8})([A-Z])$/;
  const nieRegex = /^([XYZ])(\d{7})([A-Z])$/;
  const cifRegex = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/;

  if (dniRegex.test(normalizedClean)) {
    const num = parseInt(normalizedClean.substring(0, 8), 10);
    const letter = normalizedClean.charAt(8);
    const expectedLetter = validLetters[num % 23];

    if (letter !== expectedLetter) {
      return {
        isValid: false,
        message: `Letra de DNI incorrecta (${letter}). Para el nº ${num} corresponde la letra ${expectedLetter}.`,
        formatted: `${normalizedClean.substring(0, 8)}-${letter}`,
      };
    }
    return {
      isValid: true,
      message: 'DNI válido y verificado',
      formatted: `${normalizedClean.substring(0, 8)}-${letter}`,
    };
  }

  if (nieRegex.test(normalizedClean)) {
    const prefix = normalizedClean.charAt(0);
    let numericPrefix = '0';
    if (prefix === 'Y') numericPrefix = '1';
    if (prefix === 'Z') numericPrefix = '2';

    const numStr = numericPrefix + normalizedClean.substring(1, 8);
    const num = parseInt(numStr, 10);
    const letter = normalizedClean.charAt(8);
    const expectedLetter = validLetters[num % 23];

    if (letter !== expectedLetter) {
      return {
        isValid: false,
        message: `Letra de NIE incorrecta (${letter}). Corresponde la letra ${expectedLetter}.`,
        formatted: normalizedClean,
      };
    }
    return {
      isValid: true,
      message: 'NIE válido y verificado',
      formatted: normalizedClean,
    };
  }

  if (cifRegex.test(normalizedClean)) {
    return {
      isValid: true,
      message: 'CIF válido y verificado',
      formatted: normalizedClean,
    };
  }

  if (/^\d{1,8}$/.test(normalizedClean)) {
    return {
      isValid: false,
      message: `Falta la letra final (${normalizedClean.length}/8 dígitos).`,
      formatted: normalizedClean,
    };
  }

  return {
    isValid: false,
    message: 'Formato no válido (esperado: 8 dígitos + letra final. Ej: 12345678Z o NIE X1234567Z)',
    formatted: normalizedClean,
  };
};

const formatDateISOToSpanish = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return isoDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return isoDateStr;

  return `${day} de ${monthsSpanish[month]} de ${year}`;
};

const formatSpanishToISO = (spanishDateStr: string): string => {
  if (!spanishDateStr) return '';
  const match = spanishDateStr.match(/(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)\s+de\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase();
    const monthIndex = monthsSpanish.indexOf(monthName);
    if (monthIndex !== -1) {
      const month = (monthIndex + 1).toString().padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
  }
  return '';
};

const MONTHS_SPANISH = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

const extractNumericPrice = (priceStr: string | number): number => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const match = priceStr.match(/^[\d.,\s]+/);
  if (match) {
    const clean = match[0].replace(/\./g, '').replace(',', '.').replace(/\s/g, '');
    const num = parseFloat(clean);
    if (!isNaN(num)) return num;
  }
  return 0;
};

const getInitialArrasState = (
  property: any,
  formattedTodayDate: string,
  formattedDeadlineDate: string
): { data: ArrasData; isDraft: boolean } => {
  const price = property?.price || 0;
  const arras = Math.round(price * 0.1);
  const rest = price - arras;

  const mainFinca: FincaItem = {
    id: 'finca-1',
    title: 'VIVIENDA',
    registryNumber: property?.cru || '',
    registryCity: 'Valladolid',
    registryOfficeNumber: '',
    cru: property?.cru || '',
    cadastralReference: property?.cadastral_reference || property?.internal_reference || '',
    street: property?.address_hidden || '',
    number: property?.block_stairs || '',
    floorLetter: property?.door || '',
    city: property?.city || 'Valladolid',
    province: property?.province || 'Valladolid',
    zipcode: property?.zipcode || '',
    propertyAddress: property?.address_hidden ? `${property.address_hidden}, ${property.city} (${property.province})` : '',
    propertyDescription: property ? `VIVIENDA sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.cadastral_reference || property.internal_reference || '[Pendiente]'}.` : '',
    priceAmount: price,
    priceFormatted: price ? formatCurrency(price) : '0 €',
  };

  const initialFincas = (property?.fincas_data && Array.isArray(property.fincas_data) && property.fincas_data.length > 0)
    ? property.fincas_data.map((f: FincaItem, idx: number) => ({
        ...f,
        registryCity: f.registryCity || 'Valladolid',
        title: idx === 0 && (!f.title || f.title.toLowerCase() === 'piso principal' || f.title.toLowerCase() === 'piso') ? 'VIVIENDA' : (f.title || (idx === 0 ? 'VIVIENDA' : `Finca ${idx + 1}`)),
        priceAmount: f.priceAmount ?? (property.fincas_data.length === 1 ? price : undefined),
        priceFormatted: f.priceFormatted ?? (property.fincas_data.length === 1 && price ? formatCurrency(price) : undefined),
      }))
    : [mainFinca];

  const buildInitialSellers = (src?: any): PersonParty[] => {
    if (src?.sellers && Array.isArray(src.sellers) && src.sellers.length > 0) {
      return src.sellers;
    }
    if (src?.sellers_data && Array.isArray(src.sellers_data) && src.sellers_data.length > 0) {
      return src.sellers_data;
    }
    const s1: PersonParty = {
      id: 'seller-1',
      name: src?.seller1Name || src?.owner_name || '',
      dni: src?.seller1Dni || src?.owner_dni || '',
      civilStatus: (src?.seller1CivilStatus || src?.owner_civil_status || 'soltero') as CivilStatus,
      matrimonialRegime: (src?.seller1MatrimonialRegime || src?.owner_matrimonial_regime || 'gananciales') as MatrimonialRegime,
      address: src?.seller1Address || src?.owner_address || '',
      street: src?.seller1Street || src?.owner_street || src?.owner_address || '',
      number: src?.seller1Number || src?.owner_number || '',
      floorLetter: src?.seller1FloorLetter || src?.owner_floor_letter || '',
      city: src?.seller1City || src?.owner_city || src?.city || 'Valladolid',
      province: src?.seller1Province || src?.owner_province || src?.province || 'Valladolid',
      zipcode: src?.seller1Zipcode || src?.owner_zipcode || src?.zipcode || '',
    };
    const hasS2 = src?.hasSeller2 ?? src?.has_owner2 ?? false;
    const s2Name = src?.seller2Name || src?.owner2_name || '';
    if (hasS2 && s2Name) {
      const s2: PersonParty = {
        id: 'seller-2',
        name: s2Name,
        dni: src?.seller2Dni || src?.owner2_dni || '',
        civilStatus: (src?.seller2CivilStatus || src?.owner2_civil_status || 'soltero') as CivilStatus,
        matrimonialRegime: (src?.seller2MatrimonialRegime || src?.owner2_matrimonial_regime || 'gananciales') as MatrimonialRegime,
        address: src?.seller2Address || src?.owner2_address || s1.address,
        street: src?.seller2Street || src?.owner2_street || '',
        number: src?.seller2Number || src?.owner2_number || '',
        floorLetter: src?.seller2FloorLetter || src?.owner2_floor_letter || '',
        city: src?.seller2City || src?.owner2_city || '',
        province: src?.seller2Province || src?.owner2_province || '',
        zipcode: src?.seller2Zipcode || src?.owner2_zipcode || '',
        sameAddressAsFirst: src?.seller2SameAddress ?? src?.seller2_same_address ?? true,
      };
      return [s1, s2];
    }
    return [s1];
  };

  const buildInitialBuyers = (src?: any): PersonParty[] => {
    if (src?.buyers && Array.isArray(src.buyers) && src.buyers.length > 0) {
      return src.buyers;
    }
    if (src?.buyers_data && Array.isArray(src.buyers_data) && src.buyers_data.length > 0) {
      return src.buyers_data;
    }
    const b1: PersonParty = {
      id: 'buyer-1',
      name: src?.buyer1Name || src?.buyer1_name || '',
      dni: src?.buyer1Dni || src?.buyer1_dni || '',
      civilStatus: (src?.buyer1CivilStatus || src?.buyer1_civil_status || 'soltero') as CivilStatus,
      matrimonialRegime: (src?.buyer1MatrimonialRegime || src?.buyer1_matrimonial_regime || 'gananciales') as MatrimonialRegime,
      address: src?.buyer1Address || src?.buyer1_address || '',
      street: src?.buyer1Street || src?.buyer1_street || '',
      number: src?.buyer1Number || src?.buyer1_number || '',
      floorLetter: src?.buyer1FloorLetter || src?.buyer1_floor_letter || '',
      city: src?.buyer1City || src?.buyer1_city || 'Valladolid',
      province: src?.buyer1Province || src?.buyer1_province || 'Valladolid',
      zipcode: src?.buyer1Zipcode || src?.buyer1_zipcode || '',
    };
    const hasB2 = src?.hasBuyer2 ?? src?.has_buyer2 ?? false;
    const b2Name = src?.buyer2Name || src?.buyer2_name || '';
    if (hasB2 && b2Name) {
      const b2: PersonParty = {
        id: 'buyer-2',
        name: b2Name,
        dni: src?.buyer2Dni || src?.buyer2_dni || '',
        civilStatus: (src?.buyer2CivilStatus || src?.buyer2_civil_status || 'soltero') as CivilStatus,
        matrimonialRegime: (src?.buyer2MatrimonialRegime || src?.buyer2_matrimonial_regime || 'gananciales') as MatrimonialRegime,
        address: src?.buyer2Address || src?.buyer2_address || b1.address,
        street: src?.buyer2Street || src?.buyer2_street || '',
        number: src?.buyer2Number || src?.buyer2_number || '',
        floorLetter: src?.buyer2FloorLetter || src?.buyer2_floor_letter || '',
        city: src?.buyer2City || src?.buyer2_city || '',
        province: src?.buyer2Province || src?.buyer2_province || '',
        zipcode: src?.buyer2Zipcode || src?.buyer2_zipcode || '',
        sameAddressAsFirst: src?.buyer2SameAddress ?? src?.buyer2_same_address ?? true,
      };
      return [b1, b2];
    }
    return [b1];
  };

  const buildInitialRepresentatives = (src?: any): RepresentativeItem[] => {
    if (src?.representatives && Array.isArray(src.representatives)) {
      return src.representatives;
    }
    if (src?.representatives_data && Array.isArray(src.representatives_data)) {
      return src.representatives_data;
    }
    return [];
  };

  if (property?.id) {
    const draftKey = `arras_draft_${property.id}`;
    const localDraft = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null;
    if (localDraft) {
      try {
        const savedData = JSON.parse(localDraft);
        const restoredSellers = buildInitialSellers(savedData);
        const restoredBuyers = buildInitialBuyers(savedData);
        const restoredReps = buildInitialRepresentatives(savedData);
        const s1 = restoredSellers[0];
        const s2 = restoredSellers[1];
        const b1 = restoredBuyers[0];
        const b2 = restoredBuyers[1];

        return {
          isDraft: true,
          data: {
            ...savedData,
            sellers: restoredSellers,
            buyers: restoredBuyers,
            representatives: restoredReps,
            seller1Name: s1?.name || savedData.seller1Name || '',
            seller1Dni: s1?.dni || savedData.seller1Dni || '',
            seller1CivilStatus: s1?.civilStatus || savedData.seller1CivilStatus || 'soltero',
            seller1MatrimonialRegime: s1?.matrimonialRegime || savedData.seller1MatrimonialRegime || 'gananciales',
            seller1Address: s1?.address || savedData.seller1Address || '',
            seller1Street: s1?.street || savedData.seller1Street || '',
            seller1Number: s1?.number || savedData.seller1Number || '',
            seller1FloorLetter: s1?.floorLetter || savedData.seller1FloorLetter || '',
            seller1City: s1?.city || savedData.seller1City || 'Valladolid',
            seller1Province: s1?.province || savedData.seller1Province || 'Valladolid',
            seller1Zipcode: s1?.zipcode || savedData.seller1Zipcode || '',
            hasSeller2: restoredSellers.length > 1,
            seller2Name: s2?.name || savedData.seller2Name || '',
            seller2Dni: s2?.dni || savedData.seller2Dni || '',
            seller2CivilStatus: s2?.civilStatus || savedData.seller2CivilStatus || 'soltero',
            seller2MatrimonialRegime: s2?.matrimonialRegime || savedData.seller2MatrimonialRegime || 'gananciales',
            seller2SameAddress: s2?.sameAddressAsFirst ?? savedData.seller2SameAddress ?? true,
            seller2Address: s2?.address || savedData.seller2Address || '',
            seller2Street: s2?.street || savedData.seller2Street || '',
            seller2Number: s2?.number || savedData.seller2Number || '',
            seller2FloorLetter: s2?.floorLetter || savedData.seller2FloorLetter || '',
            seller2City: s2?.city || savedData.seller2City || '',
            seller2Province: s2?.province || savedData.seller2Province || '',
            seller2Zipcode: s2?.zipcode || savedData.seller2Zipcode || '',
            buyer1Name: b1?.name || savedData.buyer1Name || '',
            buyer1Dni: b1?.dni || savedData.buyer1Dni || '',
            buyer1CivilStatus: b1?.civilStatus || savedData.buyer1CivilStatus || 'soltero',
            buyer1MatrimonialRegime: b1?.matrimonialRegime || savedData.buyer1MatrimonialRegime || 'gananciales',
            buyer1Address: b1?.address || savedData.buyer1Address || '',
            buyer1Street: b1?.street || savedData.buyer1Street || '',
            buyer1Number: b1?.number || savedData.buyer1Number || '',
            buyer1FloorLetter: b1?.floorLetter || savedData.buyer1FloorLetter || '',
            buyer1City: b1?.city || savedData.buyer1City || 'Valladolid',
            buyer1Province: b1?.province || savedData.buyer1Province || 'Valladolid',
            buyer1Zipcode: b1?.zipcode || savedData.buyer1Zipcode || '',
            hasBuyer2: restoredBuyers.length > 1,
            buyer2Name: b2?.name || savedData.buyer2Name || '',
            buyer2Dni: b2?.dni || savedData.buyer2Dni || '',
            buyer2CivilStatus: b2?.civilStatus || savedData.buyer2CivilStatus || 'soltero',
            buyer2MatrimonialRegime: b2?.matrimonialRegime || savedData.buyer2MatrimonialRegime || 'gananciales',
            buyer2SameAddress: b2?.sameAddressAsFirst ?? savedData.buyer2SameAddress ?? true,
            buyer2Address: b2?.address || savedData.buyer2Address || '',
            buyer2Street: b2?.street || savedData.buyer2Street || '',
            buyer2Number: b2?.number || savedData.buyer2Number || '',
            buyer2FloorLetter: b2?.floorLetter || savedData.buyer2FloorLetter || '',
            buyer2City: b2?.city || savedData.buyer2City || '',
            buyer2Province: b2?.province || savedData.buyer2Province || '',
            buyer2Zipcode: b2?.zipcode || savedData.buyer2Zipcode || '',
            totalPrice: savedData.totalPrice || (price ? formatCurrency(price) : '0 €'),
            totalPriceNum: savedData.totalPriceNum || price,
            arrasAmount: savedData.arrasAmount || (price ? formatCurrency(arras) : '0 €'),
            arrasAmountNum: savedData.arrasAmountNum || arras,
            remainingAmount: savedData.remainingAmount || (price ? formatCurrency(rest) : '0 €'),
            remainingAmountNum: savedData.remainingAmountNum || rest,
            sellerIban: savedData.sellerIban || property.seller_iban || '',
            notaryDeadline: savedData.notaryDeadline || property.notary_deadline || formattedDeadlineDate,
            jurisdictionCity: savedData.jurisdictionCity || property.jurisdiction_city || 'Valladolid',
          }
        };
      } catch {
        // ignore
      }
    }
  }

  const initialSellers = buildInitialSellers(property);
  const initialBuyers = buildInitialBuyers(property);
  const initialRepresentatives = buildInitialRepresentatives(property);
  const s1 = initialSellers[0];
  const s2 = initialSellers[1];
  const b1 = initialBuyers[0];
  const b2 = initialBuyers[1];

  return {
    isDraft: false,
    data: {
      city: 'Valladolid',
      dateStr: formattedTodayDate,
      sellers: initialSellers,
      buyers: initialBuyers,
      representatives: initialRepresentatives,
      seller1Name: s1?.name || property?.owner_name || '',
      seller1Dni: s1?.dni || property?.owner_dni || '',
      seller1CivilStatus: (s1?.civilStatus || property?.owner_civil_status || 'soltero') as CivilStatus,
      seller1MatrimonialRegime: (s1?.matrimonialRegime || property?.owner_matrimonial_regime || 'gananciales') as MatrimonialRegime,
      seller1Address: s1?.address || property?.owner_address || '',
      seller1Street: s1?.street || property?.owner_street || property?.owner_address || '',
      seller1Number: s1?.number || property?.owner_number || '',
      seller1FloorLetter: s1?.floorLetter || property?.owner_floor_letter || '',
      seller1City: s1?.city || property?.owner_city || property?.city || 'Valladolid',
      seller1Province: s1?.province || property?.owner_province || property?.province || 'Valladolid',
      seller1Zipcode: s1?.zipcode || property?.owner_zipcode || property?.zipcode || '',
      hasSeller2: initialSellers.length > 1,
      seller2Name: s2?.name || property?.owner2_name || '',
      seller2Dni: s2?.dni || property?.owner2_dni || '',
      seller2CivilStatus: (s2?.civilStatus || property?.owner2_civil_status || 'soltero') as CivilStatus,
      seller2MatrimonialRegime: (s2?.matrimonialRegime || property?.owner2_matrimonial_regime || 'gananciales') as MatrimonialRegime,
      sellersRelationship: (property?.owners_relationship as RelationshipType) || 'ninguna',
      seller2SameAddress: s2?.sameAddressAsFirst ?? property?.seller2_same_address ?? true,
      seller2Address: s2?.address || property?.owner2_address || '',
      seller2Street: s2?.street || property?.owner2_street || '',
      seller2Number: s2?.number || property?.owner2_number || '',
      seller2FloorLetter: s2?.floorLetter || property?.owner2_floor_letter || '',
      seller2City: s2?.city || property?.owner2_city || '',
      seller2Province: s2?.province || property?.owner2_province || '',
      seller2Zipcode: s2?.zipcode || property?.owner2_zipcode || '',

      buyer1Name: b1?.name || property?.buyer1_name || '',
      buyer1Dni: b1?.dni || property?.buyer1_dni || '',
      buyer1CivilStatus: (b1?.civilStatus || property?.buyer1_civil_status || 'soltero') as CivilStatus,
      buyer1MatrimonialRegime: (b1?.matrimonialRegime || property?.buyer1_matrimonial_regime || 'gananciales') as MatrimonialRegime,
      buyer1Address: b1?.address || property?.buyer1_address || '',
      buyer1Street: b1?.street || property?.buyer1_street || '',
      buyer1Number: b1?.number || property?.buyer1_number || '',
      buyer1FloorLetter: b1?.floorLetter || property?.buyer1_floor_letter || '',
      buyer1City: b1?.city || property?.buyer1_city || 'Valladolid',
      buyer1Province: b1?.province || property?.buyer1_province || 'Valladolid',
      buyer1Zipcode: b1?.zipcode || property?.buyer1_zipcode || '',

      hasBuyer2: initialBuyers.length > 1,
      buyer2Name: b2?.name || property?.buyer2_name || '',
      buyer2Dni: b2?.dni || property?.buyer2_dni || '',
      buyer2CivilStatus: (b2?.civilStatus || property?.buyer2_civil_status || 'soltero') as CivilStatus,
      buyer2MatrimonialRegime: (b2?.matrimonialRegime || property?.buyer2_matrimonial_regime || 'gananciales') as MatrimonialRegime,
      buyersRelationship: (property?.buyers_relationship as RelationshipType) || 'ninguna',
      buyer2SameAddress: b2?.sameAddressAsFirst ?? property?.buyer2_same_address ?? true,
      buyer2Address: b2?.address || property?.buyer2_address || '',
      buyer2Street: b2?.street || property?.buyer2_street || '',
      buyer2Number: b2?.number || property?.buyer2_number || '',
      buyer2FloorLetter: b2?.floorLetter || property?.buyer2_floor_letter || '',
      buyer2City: b2?.city || property?.buyer2_city || '',
      buyer2Province: b2?.province || property?.buyer2_province || '',
      buyer2Zipcode: b2?.zipcode || property?.buyer2_zipcode || '',

      fincas: initialFincas,
      registryNumber: property?.cru || '',
      registryCity: 'Valladolid',
      propertyAddress: property ? `${property.address_hidden}, ${property.city} (${property.province})` : '',
      propertyDescription: mainFinca.propertyDescription,
      chargesOption: property?.charges_option || '1',
      retentionAmount: property?.retention_amount || '3.000 € (TRES MIL EUROS)',
      returnDays: property?.return_days || '15 días',
      managementMonths: property?.management_months || '6 meses',
      includeKitchenClause: property?.include_kitchen_clause ?? true,
      includeFurnitureClause: property?.include_furniture_clause ?? false,
      furnitureDescription: property?.furniture_description || 'Mobiliario según inventario (sofá, salón completo, conjunto de comedor y dormitorios)',
      includePhotoReportClause: property?.include_photo_report_clause ?? false,
      selectedPhotos: [],
      includeMortgageSuspensiveClause: property?.include_mortgage_suspensive_clause ?? false,
      mortgageDays: property?.mortgage_days || '30',
      mortgageAmount: property?.mortgage_amount || (price ? formatCurrency(Math.round(price * 0.8)) : '0 €'),
      totalPrice: price ? formatCurrency(price) : '0 €',
      totalPriceNum: price,
      arrasAmount: price ? formatCurrency(arras) : '0 €',
      arrasAmountNum: arras,
      remainingAmount: price ? formatCurrency(rest) : '0 €',
      remainingAmountNum: rest,
      sellerIban: property?.seller_iban || '',
      notaryDeadline: property?.notary_deadline || formattedDeadlineDate,
      jurisdictionCity: property?.jurisdiction_city || 'Valladolid',
    }
  };
};

const ArrasContractModalContent: React.FC<Props> = ({ isOpen: _isOpen, onClose, property, onSaveSuccess }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'signatures' | 'preview'>('form');
  const [copied, setCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [loadingCatastroFincaId, setLoadingCatastroFincaId] = useState<string | null>(null);

  const today = new Date();
  const formattedTodayDate = `${today.getDate()} de ${MONTHS_SPANISH[today.getMonth()]} de ${today.getFullYear()}`;

  // Fecha por defecto escritura (30 días tras hoy)
  const defaultDeadlineDate = new Date();
  defaultDeadlineDate.setDate(today.getDate() + 30);
  const formattedDeadlineDate = `${defaultDeadlineDate.getDate()} de ${MONTHS_SPANISH[defaultDeadlineDate.getMonth()]} de ${defaultDeadlineDate.getFullYear()}`;

  const initialData = useMemo(
    () => getInitialArrasState(property, formattedTodayDate, formattedDeadlineDate),
    [property, formattedTodayDate, formattedDeadlineDate]
  );
  const [formData, setFormData] = useState<ArrasData>(initialData.data);
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(initialData.isDraft);

  const handleLookupCatastro = async (fincaId: string, refCat: string) => {
    if (!refCat || refCat.trim().length < 14) {
      alert('Introduce una Referencia Catastral válida (14 a 20 caracteres).');
      return;
    }
    setLoadingCatastroFincaId(fincaId);
    try {
      const data = await fetchCatastroData(refCat);
      if (data) {
        setFormData((prev) => {
          const updatedFincas = (prev.fincas || []).map((f) => {
            if (f.id === fincaId) {
              return {
                ...f,
                cadastralReference: data.refCat,
                street: data.street || f.street,
                number: data.number || f.number,
                floorLetter: data.floorLetter || f.floorLetter,
                city: data.city || f.city,
                province: data.province || f.province,
                title: f.title || data.use || 'VIVIENDA',
                propertyDescription: data.legalDescription || f.propertyDescription,
                propertyAddress: `${data.street}${data.number ? ` ${data.number}` : ''}, ${data.city} (${data.province})`,
              };
            }
            return f;
          });
          return { ...prev, fincas: updatedFincas };
        });
        autoLookupFincaZipcode(fincaId, data.street, data.city, data.province, '', true, data.number);
      }
    } catch (err: any) {
      alert(err.message || 'No se pudieron consultar los datos del Catastro.');
    } finally {
      setLoadingCatastroFincaId(null);
    }
  };

  const downloadAsDocx = () => {
    handleSaveDraft();
    const element = document.getElementById('arras-contract-document');
    if (!element) return;

    const contentHtml = element.innerHTML;
    const header = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Contrato de Arras Penitenciales</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; margin: 1in; }
          h1, h2, h3 { font-family: 'Calibri', 'Arial', sans-serif; color: #0f172a; }
          h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 12pt; }
          h2 { font-size: 12pt; font-weight: bold; margin-top: 16pt; margin-bottom: 6pt; }
          p { margin-bottom: 8pt; text-align: justify; }
          .font-bold { font-weight: bold; }
          .text-center { text-align: center; }
          .uppercase { text-transform: uppercase; }
          img { max-width: 450px; height: auto; display: block; margin: 10px auto; border: 1px solid #cbd5e1; }
          .grid { display: block; }
          .page-break-before-always { page-break-before: always; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + header], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sellerClean = (formData.seller1Name || 'Vendedor').replace(/[^a-zA-Z0-9]/g, '_');
    const buyerClean = (formData.buyer1Name || 'Comprador').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Contrato_Arras_${sellerClean}_y_${buyerClean}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [availablePhotos, setAvailablePhotos] = useState<any[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // Fetch photos from database for this property
  useEffect(() => {
    let isMounted = true;
    if (property?.id) {
      Promise.resolve(
        supabase
          .from('property_media')
          .select('*')
          .eq('property_id', property.id)
          .order('sort_order', { ascending: true })
      )
        .then(({ data, error }) => {
          if (isMounted && !error && data) {
            setAvailablePhotos(data);
            setSelectedPhotoIds(data.map((p: any) => p.id));
          }
        })
        .catch((err: unknown) => {
          console.error('Error al cargar fotos del inmueble:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [property?.id]);

  // Sync selected photos to formData
  useEffect(() => {
    const selectedIdsSet = new Set(selectedPhotoIds);
    const selected = availablePhotos.filter((p) => selectedIdsSet.has(p.id));
    setFormData((prev) => ({
      ...prev,
      selectedPhotos: selected,
    }));
  }, [selectedPhotoIds, availablePhotos]);

  const togglePhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const selectAllPhotos = () => {
    setSelectedPhotoIds(availablePhotos.map((p) => p.id));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotoIds([]);
  };

  const sellerSigners = useMemo(() => getSellerSignersFromData(formData), [formData]);
  const buyerSigners = useMemo(() => getBuyerSignersFromData(formData), [formData]);

  const handleTotalPriceNumChange = (newVal: number) => {
    const defaultArras = Math.round(newVal * 0.1);
    const defaultRest = Math.max(0, newVal - defaultArras);
    setFormData((prev) => {
      const updatedFincas = prev.fincas && prev.fincas.length === 1
        ? [{ ...prev.fincas[0], priceAmount: newVal, priceFormatted: formatCurrency(newVal) }]
        : prev.fincas;
      return {
        ...prev,
        totalPriceNum: newVal,
        totalPrice: formatCurrency(newVal),
        arrasAmountNum: defaultArras,
        arrasAmount: formatCurrency(defaultArras),
        remainingAmountNum: defaultRest,
        remainingAmount: formatCurrency(defaultRest),
        fincas: updatedFincas,
      };
    });
  };

  const handleArrasAmountNumChange = (newVal: number) => {
    setFormData((prev) => {
      const total = prev.totalPriceNum || extractNumericPrice(prev.totalPrice);
      const newRest = Math.max(0, total - newVal);
      return {
        ...prev,
        arrasAmountNum: newVal,
        arrasAmount: formatCurrency(newVal),
        remainingAmountNum: newRest,
        remainingAmount: formatCurrency(newRest),
      };
    });
  };

  const totalPriceNumeric = formData.totalPriceNum !== undefined ? formData.totalPriceNum : extractNumericPrice(formData.totalPrice || property?.price || 0);

  const sumFincasPrices = (formData.fincas || []).reduce((acc, f) => acc + (f.priceAmount || 0), 0);
  const fincasPriceDiff = totalPriceNumeric - sumFincasPrices;
  const isPriceMatching = Math.abs(fincasPriceDiff) < 0.01;

  const autoBalanceFincas = () => {
    if (!formData.fincas || formData.fincas.length === 0) return;
    const otherSum = formData.fincas.slice(1).reduce((acc, f) => acc + (f.priceAmount || 0), 0);
    const mainPrice = Math.max(0, totalPriceNumeric - otherSum);

    setFormData((prev) => ({
      ...prev,
      fincas: prev.fincas.map((f, idx) => {
        if (idx === 0) {
          return {
            ...f,
            priceAmount: mainPrice,
            priceFormatted: formatCurrency(mainPrice),
          };
        }
        return f;
      }),
    }));
  };

  const handleSignatureSave = (signerId: string, dataUrl: string | null) => {
    setFormData((prev) => {
      const currentSigs = prev.signatures || {};
      const updatedSigs = {
        ...currentSigs,
        [signerId]: dataUrl || undefined,
        ...(signerId === 'seller-1' ? { seller1: dataUrl || undefined } : {}),
        ...(signerId === 'seller-2' ? { seller2: dataUrl || undefined } : {}),
        ...(signerId === 'buyer-1' ? { buyer1: dataUrl || undefined } : {}),
        ...(signerId === 'buyer-2' ? { buyer2: dataUrl || undefined } : {}),
        signedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        signatures: updatedSigs,
      };
    });
  };

  const updateFincaPrice = (id: string, newPriceNum: number) => {
    setFormData((prev) => ({
      ...prev,
      fincas: prev.fincas.map((f) =>
        f.id === id
          ? {
              ...f,
              priceAmount: newPriceNum,
              priceFormatted: formatCurrency(newPriceNum),
            }
          : f
      ),
    }));
  };

  const updateFincaAddress = (id: string, field: 'street' | 'number' | 'floorLetter' | 'city' | 'province' | 'zipcode', value: string) => {
    setFormData((prev) => ({
      ...prev,
      fincas: prev.fincas.map((f) => {
        if (f.id !== id) return f;
        const updatedFinca = { ...f, [field]: value };
        const fullAddr = buildAddressString(
          updatedFinca.street,
          updatedFinca.number,
          updatedFinca.floorLetter,
          updatedFinca.city,
          updatedFinca.province,
          updatedFinca.zipcode
        );
        return {
          ...updatedFinca,
          propertyAddress: fullAddr,
        };
      }),
    }));
  };

  // Handlers para Fincas
  const addFinca = () => {
    const nextIndex = (formData.fincas?.length || 0) + 1;
    const defaultTitle = nextIndex === 2 ? 'Plaza de Garaje' : nextIndex === 3 ? 'Trastero' : `Finca Registral ${nextIndex}`;
    const firstFinca = formData.fincas[0];
    const newFinca: FincaItem = {
      id: `finca-${Date.now()}`,
      title: defaultTitle,
      registryNumber: '',
      registryCity: firstFinca?.registryCity || property?.city || 'Valladolid',
      street: '',
      number: '',
      floorLetter: '',
      city: property?.city || 'Valladolid',
      province: property?.province || 'Valladolid',
      zipcode: '',
      propertyAddress: firstFinca?.propertyAddress || '',
      propertyDescription: '',
      priceAmount: 0,
      priceFormatted: '0 € (CERO EUROS)',
    };
    setFormData((prev) => ({
      ...prev,
      fincas: [...(prev.fincas || []), newFinca],
    }));
  };

  const removeFinca = (id: string) => {
    if ((formData.fincas?.length || 0) <= 1) return;
    setFormData((prev) => ({
      ...prev,
      fincas: prev.fincas.filter((f) => f.id !== id),
    }));
  };

  const updateFinca = (id: string, field: keyof FincaItem, value: any) => {
    setFormData((prev) => {
      const updatedFincas = prev.fincas.map((f) => (f.id === id ? { ...f, [field]: value } : f));
      const isFirst = id === prev.fincas[0]?.id;
      return {
        ...prev,
        fincas: updatedFincas,
        ...(isFirst && field === 'propertyDescription' ? { propertyDescription: value } : {}),
        ...(isFirst && field === 'registryNumber' ? { registryNumber: value } : {}),
        ...(isFirst && field === 'registryCity' ? { registryCity: value } : {}),
        ...(isFirst && field === 'cru' ? { cru: value } : {}),
        ...(isFirst && field === 'cadastralReference' ? { cadastralReference: value } : {}),
      };
    });
  };

  // --- HANDLERS VENDEDORES ---
  const updateSeller = (id: string, field: keyof PersonParty, value: any) => {
    setFormData((prev) => {
      const sellers = prev.sellers || [];
      const updatedSellers = sellers.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, [field]: value };
        if (['street', 'number', 'floorLetter', 'city', 'province', 'zipcode'].includes(field as string)) {
          updated.address = buildAddressString(
            updated.street,
            updated.number,
            updated.floorLetter,
            updated.city,
            updated.province,
            updated.zipcode
          );
        }
        return updated;
      });

      // Si se actualiza el primer vendedor, propagar dirección a los que tengan sameAddressAsFirst
      const firstSeller = updatedSellers[0];
      if (id === firstSeller?.id && ['street', 'number', 'floorLetter', 'city', 'province', 'zipcode'].includes(field as string)) {
        updatedSellers.forEach((s, idx) => {
          if (idx > 0 && s.sameAddressAsFirst !== false) {
            s.street = firstSeller.street;
            s.number = firstSeller.number;
            s.floorLetter = firstSeller.floorLetter;
            s.city = firstSeller.city;
            s.province = firstSeller.province;
            s.zipcode = firstSeller.zipcode;
            s.address = firstSeller.address;
          }
        });
      }

      // Sincronizar campos legacy
      const s1 = updatedSellers[0];
      const s2 = updatedSellers[1];
      return {
        ...prev,
        sellers: updatedSellers,
        seller1Name: s1?.name || '',
        seller1Dni: s1?.dni || '',
        seller1CivilStatus: s1?.civilStatus || 'soltero',
        seller1MatrimonialRegime: s1?.matrimonialRegime,
        seller1Address: s1?.address || '',
        seller1Street: s1?.street || '',
        seller1Number: s1?.number || '',
        seller1FloorLetter: s1?.floorLetter || '',
        seller1City: s1?.city || '',
        seller1Province: s1?.province || '',
        seller1Zipcode: s1?.zipcode || '',
        hasSeller2: updatedSellers.length > 1,
        seller2Name: s2?.name || '',
        seller2Dni: s2?.dni || '',
        seller2CivilStatus: s2?.civilStatus || 'soltero',
        seller2MatrimonialRegime: s2?.matrimonialRegime,
        seller2SameAddress: s2?.sameAddressAsFirst ?? true,
        seller2Address: s2?.address || '',
        seller2Street: s2?.street || '',
        seller2Number: s2?.number || '',
        seller2FloorLetter: s2?.floorLetter || '',
        seller2City: s2?.city || '',
        seller2Province: s2?.province || '',
        seller2Zipcode: s2?.zipcode || '',
      };
    });
  };

  const addSeller = () => {
    setFormData((prev) => {
      const sellers = prev.sellers || [];
      const first = sellers[0];
      const nextIdx = sellers.length + 1;
      const newSeller: PersonParty = {
        id: `seller-${Date.now()}`,
        name: '',
        dni: '',
        civilStatus: 'soltero',
        matrimonialRegime: 'gananciales',
        sameAddressAsFirst: true,
        street: first?.street || '',
        number: first?.number || '',
        floorLetter: first?.floorLetter || '',
        city: first?.city || 'Valladolid',
        province: first?.province || 'Valladolid',
        zipcode: first?.zipcode || '',
        address: first?.address || '',
      };
      const updatedSellers = [...sellers, newSeller];
      const s2 = updatedSellers[1];
      return {
        ...prev,
        sellers: updatedSellers,
        hasSeller2: updatedSellers.length > 1,
        seller2Name: s2?.name || '',
        seller2Dni: s2?.dni || '',
        seller2CivilStatus: s2?.civilStatus || 'soltero',
        seller2MatrimonialRegime: s2?.matrimonialRegime,
      };
    });
  };

  const removeSeller = (id: string) => {
    setFormData((prev) => {
      const sellers = (prev.sellers || []).filter((s) => s.id !== id);
      if (sellers.length === 0) return prev;
      const updatedReps = (prev.representatives || []).map((r) => ({
        ...r,
        representedPartyIds: (r.representedPartyIds || []).filter((pId) => pId !== id),
      }));
      const s1 = sellers[0];
      const s2 = sellers[1];
      return {
        ...prev,
        sellers,
        representatives: updatedReps,
        seller1Name: s1?.name || '',
        seller1Dni: s1?.dni || '',
        seller1CivilStatus: s1?.civilStatus || 'soltero',
        seller1MatrimonialRegime: s1?.matrimonialRegime,
        seller1Address: s1?.address || '',
        seller1Street: s1?.street || '',
        seller1Number: s1?.number || '',
        seller1FloorLetter: s1?.floorLetter || '',
        seller1City: s1?.city || '',
        seller1Province: s1?.province || '',
        seller1Zipcode: s1?.zipcode || '',
        hasSeller2: sellers.length > 1,
        seller2Name: s2?.name || '',
        seller2Dni: s2?.dni || '',
        seller2CivilStatus: s2?.civilStatus || 'soltero',
        seller2MatrimonialRegime: s2?.matrimonialRegime,
        seller2SameAddress: s2?.sameAddressAsFirst ?? true,
        seller2Address: s2?.address || '',
        seller2Street: s2?.street || '',
        seller2Number: s2?.number || '',
        seller2FloorLetter: s2?.floorLetter || '',
        seller2City: s2?.city || '',
        seller2Province: s2?.province || '',
        seller2Zipcode: s2?.zipcode || '',
      };
    });
  };

  // --- HANDLERS COMPRADORES ---
  const updateBuyer = (id: string, field: keyof PersonParty, value: any) => {
    setFormData((prev) => {
      const buyers = prev.buyers || [];
      const updatedBuyers = buyers.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, [field]: value };
        if (['street', 'number', 'floorLetter', 'city', 'province', 'zipcode'].includes(field as string)) {
          updated.address = buildAddressString(
            updated.street,
            updated.number,
            updated.floorLetter,
            updated.city,
            updated.province,
            updated.zipcode
          );
        }
        return updated;
      });

      // Si se actualiza el primer comprador, propagar dirección a los que tengan sameAddressAsFirst
      const firstBuyer = updatedBuyers[0];
      if (id === firstBuyer?.id && ['street', 'number', 'floorLetter', 'city', 'province', 'zipcode'].includes(field as string)) {
        updatedBuyers.forEach((b, idx) => {
          if (idx > 0 && b.sameAddressAsFirst !== false) {
            b.street = firstBuyer.street;
            b.number = firstBuyer.number;
            b.floorLetter = firstBuyer.floorLetter;
            b.city = firstBuyer.city;
            b.province = firstBuyer.province;
            b.zipcode = firstBuyer.zipcode;
            b.address = firstBuyer.address;
          }
        });
      }

      // Sincronizar campos legacy
      const b1 = updatedBuyers[0];
      const b2 = updatedBuyers[1];
      return {
        ...prev,
        buyers: updatedBuyers,
        buyer1Name: b1?.name || '',
        buyer1Dni: b1?.dni || '',
        buyer1CivilStatus: b1?.civilStatus || 'soltero',
        buyer1MatrimonialRegime: b1?.matrimonialRegime,
        buyer1Address: b1?.address || '',
        buyer1Street: b1?.street || '',
        buyer1Number: b1?.number || '',
        buyer1FloorLetter: b1?.floorLetter || '',
        buyer1City: b1?.city || '',
        buyer1Province: b1?.province || '',
        buyer1Zipcode: b1?.zipcode || '',
        hasBuyer2: updatedBuyers.length > 1,
        buyer2Name: b2?.name || '',
        buyer2Dni: b2?.dni || '',
        buyer2CivilStatus: b2?.civilStatus || 'soltero',
        buyer2MatrimonialRegime: b2?.matrimonialRegime,
        buyer2SameAddress: b2?.sameAddressAsFirst ?? true,
        buyer2Address: b2?.address || '',
        buyer2Street: b2?.street || '',
        buyer2Number: b2?.number || '',
        buyer2FloorLetter: b2?.floorLetter || '',
        buyer2City: b2?.city || '',
        buyer2Province: b2?.province || '',
        buyer2Zipcode: b2?.zipcode || '',
      };
    });
  };

  const addBuyer = () => {
    setFormData((prev) => {
      const buyers = prev.buyers || [];
      const first = buyers[0];
      const newBuyer: PersonParty = {
        id: `buyer-${Date.now()}`,
        name: '',
        dni: '',
        civilStatus: 'soltero',
        matrimonialRegime: 'gananciales',
        sameAddressAsFirst: true,
        street: first?.street || '',
        number: first?.number || '',
        floorLetter: first?.floorLetter || '',
        city: first?.city || 'Valladolid',
        province: first?.province || 'Valladolid',
        zipcode: first?.zipcode || '',
        address: first?.address || '',
      };
      const updatedBuyers = [...buyers, newBuyer];
      const b2 = updatedBuyers[1];
      return {
        ...prev,
        buyers: updatedBuyers,
        hasBuyer2: updatedBuyers.length > 1,
        buyer2Name: b2?.name || '',
        buyer2Dni: b2?.dni || '',
        buyer2CivilStatus: b2?.civilStatus || 'soltero',
        buyer2MatrimonialRegime: b2?.matrimonialRegime,
      };
    });
  };

  const removeBuyer = (id: string) => {
    setFormData((prev) => {
      const buyers = (prev.buyers || []).filter((b) => b.id !== id);
      if (buyers.length === 0) return prev;
      const updatedReps = (prev.representatives || []).map((r) => ({
        ...r,
        representedPartyIds: (r.representedPartyIds || []).filter((pId) => pId !== id),
      }));
      const b1 = buyers[0];
      const b2 = buyers[1];
      return {
        ...prev,
        buyers,
        representatives: updatedReps,
        buyer1Name: b1?.name || '',
        buyer1Dni: b1?.dni || '',
        buyer1CivilStatus: b1?.civilStatus || 'soltero',
        buyer1MatrimonialRegime: b1?.matrimonialRegime,
        buyer1Address: b1?.address || '',
        buyer1Street: b1?.street || '',
        buyer1Number: b1?.number || '',
        buyer1FloorLetter: b1?.floorLetter || '',
        buyer1City: b1?.city || '',
        buyer1Province: b1?.province || '',
        buyer1Zipcode: b1?.zipcode || '',
        hasBuyer2: buyers.length > 1,
        buyer2Name: b2?.name || '',
        buyer2Dni: b2?.dni || '',
        buyer2CivilStatus: b2?.civilStatus || 'soltero',
        buyer2MatrimonialRegime: b2?.matrimonialRegime,
        buyer2SameAddress: b2?.sameAddressAsFirst ?? true,
        buyer2Address: b2?.address || '',
        buyer2Street: b2?.street || '',
        buyer2Number: b2?.number || '',
        buyer2FloorLetter: b2?.floorLetter || '',
        buyer2City: b2?.city || '',
        buyer2Province: b2?.province || '',
        buyer2Zipcode: b2?.zipcode || '',
      };
    });
  };

  // --- HANDLERS REPRESENTANTES / APODERADOS ---
  const addRepresentative = () => {
    const newRep: RepresentativeItem = {
      id: `rep-${Date.now()}`,
      name: '',
      dni: '',
      street: '',
      number: '',
      floorLetter: '',
      city: property?.city || 'Valladolid',
      province: property?.province || 'Valladolid',
      zipcode: '',
      address: '',
      notaryName: '',
      notaryCity: property?.city || 'Valladolid',
      powerDate: formattedTodayDate,
      protocolNumber: '',
      representedPartyIds: [],
    };
    setFormData((prev) => ({
      ...prev,
      representatives: [...(prev.representatives || []), newRep],
    }));
  };

  const removeRepresentative = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      representatives: (prev.representatives || []).filter((r) => r.id !== id),
    }));
  };

  const updateRepresentative = (id: string, field: keyof RepresentativeItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      representatives: (prev.representatives || []).map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (['street', 'number', 'floorLetter', 'city', 'province', 'zipcode'].includes(field as string)) {
          updated.address = buildAddressString(
            updated.street,
            updated.number,
            updated.floorLetter,
            updated.city,
            updated.province,
            updated.zipcode
          );
        }
        return updated;
      }),
    }));
  };

  const toggleRepresentedParty = (repId: string, partyId: string) => {
    setFormData((prev) => ({
      ...prev,
      representatives: (prev.representatives || []).map((r) => {
        if (r.id !== repId) return r;
        const current = r.representedPartyIds || [];
        const updated = current.includes(partyId)
          ? current.filter((id) => id !== partyId)
          : [...current, partyId];
        return { ...r, representedPartyIds: updated };
      }),
    }));
  };

  const setRepresentAllSellers = (repId: string) => {
    setFormData((prev) => {
      const sellerIds = (prev.sellers || []).map((s) => s.id);
      return {
        ...prev,
        representatives: (prev.representatives || []).map((r) => {
          if (r.id !== repId) return r;
          const current = new Set(r.representedPartyIds || []);
          sellerIds.forEach((id) => current.add(id));
          return { ...r, representedPartyIds: Array.from(current) };
        }),
      };
    });
  };

  const setRepresentAllBuyers = (repId: string) => {
    setFormData((prev) => {
      const buyerIds = (prev.buyers || []).map((b) => b.id);
      return {
        ...prev,
        representatives: (prev.representatives || []).map((r) => {
          if (r.id !== repId) return r;
          const current = new Set(r.representedPartyIds || []);
          buyerIds.forEach((id) => current.add(id));
          return { ...r, representedPartyIds: Array.from(current) };
        }),
      };
    });
  };

  const setRepresentEveryone = (repId: string) => {
    setFormData((prev) => {
      const allIds = [
        ...(prev.sellers || []).map((s) => s.id),
        ...(prev.buyers || []).map((b) => b.id),
      ];
      return {
        ...prev,
        representatives: (prev.representatives || []).map((r) =>
          r.id === repId ? { ...r, representedPartyIds: allIds } : r
        ),
      };
    });
  };

  // Delegados compatibles de actualización de dirección
  const updateSellerAddress = (field: 'seller1Street' | 'seller1Number' | 'seller1FloorLetter' | 'seller1City' | 'seller1Province' | 'seller1Zipcode', value: string) => {
    const sId = formData.sellers?.[0]?.id || 'seller-1';
    const fieldMap: Record<string, keyof PersonParty> = {
      seller1Street: 'street',
      seller1Number: 'number',
      seller1FloorLetter: 'floorLetter',
      seller1City: 'city',
      seller1Province: 'province',
      seller1Zipcode: 'zipcode',
    };
    updateSeller(sId, fieldMap[field], value);
  };

  const updateSeller2Address = (field: 'seller2Street' | 'seller2Number' | 'seller2FloorLetter' | 'seller2City' | 'seller2Province' | 'seller2Zipcode', value: string) => {
    const sId = formData.sellers?.[1]?.id || 'seller-2';
    const fieldMap: Record<string, keyof PersonParty> = {
      seller2Street: 'street',
      seller2Number: 'number',
      seller2FloorLetter: 'floorLetter',
      seller2City: 'city',
      seller2Province: 'province',
      seller2Zipcode: 'zipcode',
    };
    updateSeller(sId, fieldMap[field], value);
  };

  const updateBuyerAddress = (field: 'buyer1Street' | 'buyer1Number' | 'buyer1FloorLetter' | 'buyer1City' | 'buyer1Province' | 'buyer1Zipcode', value: string) => {
    const bId = formData.buyers?.[0]?.id || 'buyer-1';
    const fieldMap: Record<string, keyof PersonParty> = {
      buyer1Street: 'street',
      buyer1Number: 'number',
      buyer1FloorLetter: 'floorLetter',
      buyer1City: 'city',
      buyer1Province: 'province',
      buyer1Zipcode: 'zipcode',
    };
    updateBuyer(bId, fieldMap[field], value);
  };

  const updateBuyer2Address = (field: 'buyer2Street' | 'buyer2Number' | 'buyer2FloorLetter' | 'buyer2City' | 'buyer2Province' | 'buyer2Zipcode', value: string) => {
    const bId = formData.buyers?.[1]?.id || 'buyer-2';
    const fieldMap: Record<string, keyof PersonParty> = {
      buyer2Street: 'street',
      buyer2Number: 'number',
      buyer2FloorLetter: 'floorLetter',
      buyer2City: 'city',
      buyer2Province: 'province',
      buyer2Zipcode: 'zipcode',
    };
    updateBuyer(bId, fieldMap[field], value);
  };

  // Auto-búsqueda inteligente de CP por Nominatim / Gemini
  const autoLookupSellerZipcode = async (id: string, force: boolean = false) => {
    const s = formData.sellers?.find((item) => item.id === id);
    if (!s) return;
    if ((force || !s.zipcode) && (s.street || s.city)) {
      const cp = await fetchZipcode(s.street || '', s.city || '', s.province || '', s.number || '');
      if (cp) updateSeller(id, 'zipcode', cp);
    }
  };

  const autoLookupBuyerZipcode = async (id: string, force: boolean = false) => {
    const b = formData.buyers?.find((item) => item.id === id);
    if (!b) return;
    if ((force || !b.zipcode) && (b.street || b.city)) {
      const cp = await fetchZipcode(b.street || '', b.city || '', b.province || '', b.number || '');
      if (cp) updateBuyer(id, 'zipcode', cp);
    }
  };

  const autoLookupRepZipcode = async (id: string, force: boolean = false) => {
    const r = formData.representatives?.find((item) => item.id === id);
    if (!r) return;
    if ((force || !r.zipcode) && (r.street || r.city)) {
      const cp = await fetchZipcode(r.street || '', r.city || '', r.province || '', r.number || '');
      if (cp) updateRepresentative(id, 'zipcode', cp);
    }
  };

  const autoLookupSeller1Zipcode = async (force: boolean = false) => {
    const sId = formData.sellers?.[0]?.id || 'seller-1';
    await autoLookupSellerZipcode(sId, force);
  };

  const autoLookupSeller2Zipcode = async (force: boolean = false) => {
    const sId = formData.sellers?.[1]?.id || 'seller-2';
    await autoLookupSellerZipcode(sId, force);
  };

  const autoLookupBuyer1Zipcode = async (force: boolean = false) => {
    const bId = formData.buyers?.[0]?.id || 'buyer-1';
    await autoLookupBuyerZipcode(bId, force);
  };

  const autoLookupBuyer2Zipcode = async (force: boolean = false) => {
    const bId = formData.buyers?.[1]?.id || 'buyer-2';
    await autoLookupBuyerZipcode(bId, force);
  };

  const autoLookupFincaZipcode = async (fincaId: string, street?: string, city?: string, province?: string, currentZip?: string, force: boolean = false, number?: string) => {
    if ((force || !currentZip) && (street || city)) {
      const cp = await fetchZipcode(street || '', city || '', province || '', number || '');
      if (cp) updateFincaAddress(fincaId, 'zipcode', cp);
    }
  };

  const handleSaveDraft = async () => {
    if (!property?.id) return;
    const updatedFormData = {
      ...formData,
      propertyDescription: formData.fincas?.[0]?.propertyDescription || formData.propertyDescription,
    };
    const draftKey = `arras_draft_${property.id}`;
    localStorage.setItem(draftKey, JSON.stringify(updatedFormData));

    try {
      const updatePayload = {
        // Vendedor 1 (Propietario 1)
        owner_name: updatedFormData.seller1Name,
        owner_dni: updatedFormData.seller1Dni,
        owner_civil_status: updatedFormData.seller1CivilStatus,
        owner_matrimonial_regime: updatedFormData.seller1MatrimonialRegime,
        owner_address: updatedFormData.seller1Address,
        owner_street: updatedFormData.seller1Street,
        owner_number: updatedFormData.seller1Number,
        owner_floor_letter: updatedFormData.seller1FloorLetter,
        owner_city: updatedFormData.seller1City,
        owner_province: updatedFormData.seller1Province,
        owner_zipcode: updatedFormData.seller1Zipcode,

        // Vendedor 2 (Propietario 2)
        has_owner2: updatedFormData.hasSeller2,
        owner2_name: updatedFormData.seller2Name,
        owner2_dni: updatedFormData.seller2Dni,
        owner2_civil_status: updatedFormData.seller2CivilStatus,
        owner2_matrimonial_regime: updatedFormData.seller2MatrimonialRegime,
        owner2_address: updatedFormData.seller2Address,
        owner2_street: updatedFormData.seller2Street,
        owner2_number: updatedFormData.seller2Number,
        owner2_floor_letter: updatedFormData.seller2FloorLetter,
        owner2_city: updatedFormData.seller2City,
        owner2_province: updatedFormData.seller2Province,
        owner2_zipcode: updatedFormData.seller2Zipcode,
        seller2_same_address: updatedFormData.seller2SameAddress,
        owners_relationship: updatedFormData.sellersRelationship,

        // Comprador 1
        buyer1_name: updatedFormData.buyer1Name,
        buyer1_dni: updatedFormData.buyer1Dni,
        buyer1_civil_status: updatedFormData.buyer1CivilStatus,
        buyer1_matrimonial_regime: updatedFormData.buyer1MatrimonialRegime,
        buyer1_address: updatedFormData.buyer1Address,
        buyer1_street: updatedFormData.buyer1Street,
        buyer1_number: updatedFormData.buyer1Number,
        buyer1_floor_letter: updatedFormData.buyer1FloorLetter,
        buyer1_city: updatedFormData.buyer1City,
        buyer1_province: updatedFormData.buyer1Province,
        buyer1_zipcode: updatedFormData.buyer1Zipcode,

        // Comprador 2
        has_buyer2: updatedFormData.hasBuyer2,
        buyer2_name: updatedFormData.buyer2Name,
        buyer2_dni: updatedFormData.buyer2Dni,
        buyer2_civil_status: updatedFormData.buyer2CivilStatus,
        buyer2_matrimonial_regime: updatedFormData.buyer2MatrimonialRegime,
        buyer2_address: updatedFormData.buyer2Address,
        buyer2_street: updatedFormData.buyer2Street,
        buyer2_number: updatedFormData.buyer2Number,
        buyer2_floor_letter: updatedFormData.buyer2FloorLetter,
        buyer2_city: updatedFormData.buyer2City,
        buyer2_province: updatedFormData.buyer2Province,
        buyer2_zipcode: updatedFormData.buyer2Zipcode,
        buyer2_same_address: updatedFormData.buyer2SameAddress,
        buyers_relationship: updatedFormData.buyersRelationship,

        // Contrato, economía, fuero, cargas y fincas
        seller_iban: updatedFormData.sellerIban,
        notary_deadline: updatedFormData.notaryDeadline,
        jurisdiction_city: updatedFormData.jurisdictionCity,
        arras_amount_num: updatedFormData.arrasAmountNum,
        cru: updatedFormData.fincas?.[0]?.cru || property.cru || '',
        cadastral_reference: updatedFormData.fincas?.[0]?.cadastralReference || property.cadastral_reference || '',
        charges_option: updatedFormData.chargesOption,
        retention_amount: updatedFormData.retentionAmount,
        return_days: updatedFormData.returnDays,
        management_months: updatedFormData.managementMonths,
        include_kitchen_clause: updatedFormData.includeKitchenClause,
        include_furniture_clause: updatedFormData.includeFurnitureClause,
        furniture_description: updatedFormData.furnitureDescription,
        include_photo_report_clause: updatedFormData.includePhotoReportClause,
        include_mortgage_suspensive_clause: updatedFormData.includeMortgageSuspensiveClause,
        mortgage_days: updatedFormData.mortgageDays,
        mortgage_amount: updatedFormData.mortgageAmount,
        fincas_data: updatedFormData.fincas,
        sellers_data: updatedFormData.sellers,
        buyers_data: updatedFormData.buyers,
        representatives_data: updatedFormData.representatives,
        arras_contract_data: updatedFormData,
      };

      const { error } = await supabase
        .from('properties')
        .update(updatePayload)
        .eq('id', property.id);

      if (error) {
        console.error("Error persistiéndose en Supabase:", error);
      } else {
        onSaveSuccess?.(updatePayload);
      }
    } catch (err) {
      console.error("Error persistiéndose en Supabase:", err);
    }

    setDraftSaved(true);
    setHasRestoredDraft(true);
    setTimeout(() => setDraftSaved(false), 3500);
  };

  const handleClearAllContractData = async () => {
    if (!property?.id) return;
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas borrar por completo todos los datos del contrato de arras?\n\nEsta acción eliminará los datos de compradores, vendedores, fincas, IBAN, cláusulas y borrador guardado tanto del formulario como de la base de datos de Supabase."
    );
    if (!confirmed) return;

    const draftKey = `arras_draft_${property.id}`;
    localStorage.removeItem(draftKey);

    const price = property.price || 0;
    const arras = Math.round(price * 0.1);
    const rest = price - arras;

    const mainFinca: FincaItem = {
      id: 'finca-1',
      title: 'VIVIENDA',
      registryNumber: property.cru || '',
      registryCity: property.city || 'Valladolid',
      registryOfficeNumber: '',
      cru: property.cru || '',
      cadastralReference: property.cadastral_reference || property.internal_reference || '',
      street: property.address_hidden || '',
      number: property.block_stairs || '',
      floorLetter: property.door || '',
      city: property.city || 'Valladolid',
      province: property.province || 'Valladolid',
      zipcode: property.zipcode || '',
      propertyAddress: property.address_hidden ? `${property.address_hidden}, ${property.city} (${property.province})` : '',
      propertyDescription: `VIVIENDA sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.cadastral_reference || property.internal_reference || '[Pendiente]'}.`,
    };

    const emptyState: ArrasData = {
      city: 'Valladolid',
      dateStr: formattedTodayDate,
      seller1Name: '',
      seller1Dni: '',
      seller1CivilStatus: 'soltero',
      seller1MatrimonialRegime: 'gananciales',
      seller1Address: '',
      seller1Street: '',
      seller1Number: '',
      seller1FloorLetter: '',
      seller1City: property.city || '',
      seller1Province: property.province || '',
      seller1Zipcode: '',
      hasSeller2: false,
      seller2Name: '',
      seller2Dni: '',
      seller2CivilStatus: 'soltero',
      seller2MatrimonialRegime: 'gananciales',
      sellersRelationship: 'ninguna',
      seller2SameAddress: true,
      seller2Address: '',
      seller2Street: '',
      seller2Number: '',
      seller2FloorLetter: '',
      seller2City: '',
      seller2Province: '',
      seller2Zipcode: '',

      buyer1Name: '',
      buyer1Dni: '',
      buyer1CivilStatus: 'soltero',
      buyer1MatrimonialRegime: 'gananciales',
      buyer1Address: '',
      buyer1Street: '',
      buyer1Number: '',
      buyer1FloorLetter: '',
      buyer1City: '',
      buyer1Province: '',
      buyer1Zipcode: '',

      hasBuyer2: false,
      buyer2Name: '',
      buyer2Dni: '',
      buyer2CivilStatus: 'soltero',
      buyer2MatrimonialRegime: 'gananciales',
      buyersRelationship: 'ninguna',
      buyer2SameAddress: true,
      buyer2Address: '',
      buyer2Street: '',
      buyer2Number: '',
      buyer2FloorLetter: '',
      buyer2City: '',
      buyer2Province: '',
      buyer2Zipcode: '',

      sellers: [
        {
          id: 'seller-1',
          name: '',
          dni: '',
          civilStatus: 'soltero',
          matrimonialRegime: 'gananciales',
          address: '',
          street: '',
          number: '',
          floorLetter: '',
          city: property.city || 'Valladolid',
          province: property.province || 'Valladolid',
          zipcode: '',
        }
      ],
      buyers: [
        {
          id: 'buyer-1',
          name: '',
          dni: '',
          civilStatus: 'soltero',
          matrimonialRegime: 'gananciales',
          address: '',
          street: '',
          number: '',
          floorLetter: '',
          city: property.city || 'Valladolid',
          province: property.province || 'Valladolid',
          zipcode: '',
        }
      ],
      representatives: [],
      fincas: [mainFinca],
      registryNumber: property.cru || '',
      registryCity: property.city || 'Valladolid',
      propertyAddress: `${property.address_hidden}, ${property.city} (${property.province})`,
      propertyDescription: mainFinca.propertyDescription,
      chargesOption: '1',
      retentionAmount: '3.000 € (TRES MIL EUROS)',
      returnDays: '15 días',
      managementMonths: '6 meses',
      includeKitchenClause: true,
      includeFurnitureClause: false,
      furnitureDescription: '',
      includePhotoReportClause: false,
      selectedPhotos: [],
      includeMortgageSuspensiveClause: false,
      mortgageDays: '30',
      mortgageAmount: price ? formatCurrency(Math.round(price * 0.8)) : '0 €',
      totalPrice: price ? formatCurrency(price) : '0 €',
      totalPriceNum: price,
      arrasAmount: price ? formatCurrency(arras) : '0 €',
      arrasAmountNum: arras,
      remainingAmount: price ? formatCurrency(rest) : '0 €',
      remainingAmountNum: rest,
      sellerIban: '',
      notaryDeadline: formattedDeadlineDate,
      jurisdictionCity: 'Valladolid',
    };

    try {
      await supabase.from('properties').update({
        arras_contract_data: null,
        fincas_data: null,
        sellers_data: null,
        buyers_data: null,
        representatives_data: null,
        owner_name: null,
        owner_dni: null,
        owner_civil_status: 'soltero',
        owner_matrimonial_regime: 'gananciales',
        owner_address: null,
        owner_street: null,
        owner_number: null,
        owner_floor_letter: null,
        owner_city: null,
        owner_province: null,
        owner_zipcode: null,
        has_owner2: false,
        owner2_name: null,
        owner2_dni: null,
        owner2_civil_status: 'soltero',
        owner2_matrimonial_regime: 'gananciales',
        owner2_address: null,
        owner2_street: null,
        owner2_number: null,
        owner2_floor_letter: null,
        owner2_city: null,
        owner2_province: null,
        owner2_zipcode: null,
        seller2_same_address: true,
        owners_relationship: 'ninguna',
        buyer1_name: null,
        buyer1_dni: null,
        buyer1_civil_status: 'soltero',
        buyer1_matrimonial_regime: 'gananciales',
        buyer1_address: null,
        buyer1_street: null,
        buyer1_number: null,
        buyer1_floor_letter: null,
        buyer1_city: null,
        buyer1_province: null,
        buyer1_zipcode: null,
        has_buyer2: false,
        buyer2_name: null,
        buyer2_dni: null,
        buyer2_civil_status: 'soltero',
        buyer2_matrimonial_regime: 'gananciales',
        buyer2_address: null,
        buyer2_street: null,
        buyer2_number: null,
        buyer2_floor_letter: null,
        buyer2_city: null,
        buyer2_province: null,
        buyer2_zipcode: null,
        buyer2_same_address: true,
        buyers_relationship: 'ninguna',
        seller_iban: null,
        notary_deadline: null,
        jurisdiction_city: null,
        arras_amount_num: null,
        charges_option: '1',
        retention_amount: null,
        return_days: null,
        management_months: null,
        include_kitchen_clause: true,
        include_furniture_clause: false,
        furniture_description: null,
        include_photo_report_clause: false,
        include_mortgage_suspensive_clause: false,
        mortgage_days: null,
        mortgage_amount: null,
      }).eq('id', property.id);

      setFormData(emptyState);
      setHasRestoredDraft(false);
      onSaveSuccess?.();
    } catch (err) {
      console.error("Error al borrar datos del contrato en Supabase:", err);
    }
  };

  const handlePrint = () => {
    handleSaveDraft();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const documentHtml = document.querySelector('.printable-document')?.outerHTML || '';

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Contrato de Arras Penitenciales - ${property?.title || 'Inmueble'}</title>
        <style>
          @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
          body {
            font-family: 'Georgia', 'Times New Roman', Times, serif;
            color: #0f172a;
            line-height: 1.6;
            font-size: 13.5px;
            margin: 0;
            padding: 20px;
          }
          .printable-document { border: none !important; shadow: none !important; padding: 0 !important; max-width: 100% !important; }
          h1 { font-size: 18px; margin-bottom: 20px; text-align: center; }
          h2 { font-size: 15px; margin-top: 15px; margin-bottom: 10px; }
          p { text-align: justify; margin-bottom: 12px; }
          .no-print { text-align: right; margin-bottom: 20px; font-family: sans-serif; }
          .btn-print { background: #8f1505; color: white; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" class="btn-print">Imprimir / Descargar en PDF</button>
        </div>
        ${documentHtml}
      </body>
      </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
  };

  const handleCopyText = () => {
    const docElement = document.querySelector('.printable-document');
    if (docElement) {
      const text = (docElement as HTMLElement).innerText;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-snug">Generador de Contrato de Arras Penitenciales</h2>
              <p className="text-xs text-slate-400">Inmueble: {property?.title} ({property?.city})</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Botón Borrar Todos los Datos del Contrato */}
            <Button
              type="button"
              onClick={handleClearAllContractData}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white transition-colors gap-1.5 cursor-pointer text-xs font-semibold h-8"
              title="Borrar todos los datos del contrato en el formulario y en la base de datos"
            >
              <Trash2 size={14} /> Borrar Datos del Contrato
            </Button>

            {/* Botón Guardar Borrador */}
            <Button
              type="button"
              onClick={handleSaveDraft}
              className={`text-xs font-medium gap-1.5 h-8 transition-colors cursor-pointer ${
                draftSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {draftSaved ? (
                <>
                  <BookmarkCheck size={14} className="text-emerald-300" /> Borrador Guardado
                </>
              ) : (
                <>
                  <Save size={14} /> Guardar Borrador
                </>
              )}
            </Button>

            {/* Tabs Selector */}
            <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'form' ? 'bg-primary text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Datos del Contrato
              </button>
              <button
                onClick={() => setActiveTab('signatures')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'signatures' ? 'bg-primary text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <PenTool size={13} />
                2. Firma Digital
                {(formData.signatures?.seller1 || formData.signatures?.buyer1) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'preview' ? 'bg-primary text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                3. Vista Previa / Imprimir
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal de contrato de arras"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'form' ? (
            <div className="space-y-8 max-w-4xl mx-auto">

              {/* Banner de Borrador Restaurado o Guardado */}
              {hasRestoredDraft && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-emerald-950">Se ha cargado tu borrador guardado</span>
                      <span className="text-emerald-700">Puedes seguir editando los datos o borrar todos los datos del contrato en la base de datos.</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllContractData}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 shrink-0 gap-1 cursor-pointer font-semibold"
                  >
                    <Trash2 size={13} /> Borrar Datos del Contrato
                  </Button>
                </div>
              )}
              {/* Sección 1: Encabezado */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                  Lugar y Fecha de Firma
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Ciudad de Firma</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, city: toTitleCase(e.target.value) })}
                      placeholder="Ej: Valladolid"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-800">Fecha del Contrato *</Label>
                    <Input
                      type="date"
                      value={formatSpanishToISO(formData.dateStr)}
                      onChange={(e) => {
                        const iso = e.target.value;
                        const formattedStr = formatDateISOToSpanish(iso);
                        setFormData({ ...formData, dateStr: formattedStr });
                      }}
                      className="font-semibold text-slate-900 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-600 font-medium mt-1 truncate" title={formData.dateStr}>
                      Redacción legal: <span className="font-semibold text-slate-900">{formData.dateStr}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección 2: Parte Vendedora */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      Parte Vendedora (Propietarios) ({(formData.sellers || []).length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Puedes añadir tantos propietarios vendedores como consten en el título de propiedad.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSeller}
                    className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1.5 font-semibold cursor-pointer"
                  >
                    <UserPlus size={14} /> Añadir Vendedor
                  </Button>
                </div>

                <div className="space-y-5">
                  {(formData.sellers || []).map((seller, idx) => {
                    const isFirst = idx === 0;
                    const dniVal = validateDNI_NIE(seller.dni);
                    const isFilled = !!seller.dni?.trim();

                    const representingReps = (formData.representatives || []).filter(
                      (r) => r.representedPartyIds?.includes(seller.id)
                    );

                    return (
                      <div key={seller.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 relative">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              Vendedor {idx + 1} {isFirst ? '(Principal)' : ''} {seller.name ? `: ${seller.name}` : ''}
                            </span>
                            {representingReps.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                <ShieldCheck size={12} className="text-amber-700" />
                                Representado por: {representingReps.map((r) => r.name || 'Apoderado').join(', ')}
                              </span>
                            )}
                          </div>
                          {!isFirst && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSeller(seller.id)}
                              className="text-xs text-red-600 hover:bg-red-50 h-7 px-2 gap-1 cursor-pointer font-semibold"
                            >
                              <Trash2 size={13} /> Eliminar Vendedor
                            </Button>
                          )}
                        </div>

                        {/* Datos personales del vendedor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                          <div className={seller.civilStatus === 'casado' ? 'md:col-span-4' : 'md:col-span-6'}>
                            <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre Vendedor {idx + 1} *</Label>
                            <Input
                              value={seller.name}
                              onChange={(e) => updateSeller(seller.id, 'name', e.target.value)}
                              onBlur={(e) => updateSeller(seller.id, 'name', formatNameWithHonorific(e.target.value))}
                              placeholder="Nombre y Apellidos"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIF Vendedor {idx + 1} *</Label>
                            <Input
                              value={seller.dni}
                              onChange={(e) => updateSeller(seller.id, 'dni', e.target.value)}
                              onBlur={(e) => updateSeller(seller.id, 'dni', cleanDniString(e.target.value))}
                              placeholder="12345678X"
                              className={`uppercase ${
                                isFilled && !dniVal.isValid
                                  ? 'border-red-500 text-red-950 bg-red-50/20'
                                  : 'border-slate-200'
                              }`}
                            />
                            {isFilled && (
                              <p className={`text-[10px] font-medium mt-1 truncate ${
                                dniVal.isValid ? 'text-emerald-700' : 'text-red-600'
                              }`} title={dniVal.message}>
                                {dniVal.isValid ? `✓ ${dniVal.message}` : `⚠️ ${dniVal.message}`}
                              </p>
                            )}
                          </div>

                          <div className={seller.civilStatus === 'casado' ? 'md:col-span-2' : 'md:col-span-3'}>
                            <Label htmlFor={`seller-${seller.id}-civil-status`} className="text-xs font-medium text-slate-700 whitespace-nowrap">Estado Civil</Label>
                            <select
                              id={`seller-${seller.id}-civil-status`}
                              aria-label={`Estado Civil Vendedor ${idx + 1}`}
                              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              value={seller.civilStatus}
                              onChange={(e) => updateSeller(seller.id, 'civilStatus', e.target.value as CivilStatus)}
                            >
                              <option value="soltero">Soltero/a</option>
                              <option value="casado">Casado/a</option>
                              <option value="pareja_de_hecho">Pareja de hecho (inscrita)</option>
                              <option value="divorciado">Divorciado/a</option>
                              <option value="separado">Separado/a (legalmente)</option>
                              <option value="viudo">Viudo/a</option>
                            </select>
                          </div>

                          {seller.civilStatus === 'casado' && (
                            <div className="md:col-span-3">
                              <Label htmlFor={`seller-${seller.id}-matrimonial-regime`} className="text-xs font-medium text-slate-700 whitespace-nowrap">Régimen Matrimonial</Label>
                              <select
                                id={`seller-${seller.id}-matrimonial-regime`}
                                aria-label={`Régimen Matrimonial Vendedor ${idx + 1}`}
                                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={seller.matrimonialRegime || 'gananciales'}
                                onChange={(e) => updateSeller(seller.id, 'matrimonialRegime', e.target.value as MatrimonialRegime)}
                              >
                                <option value="gananciales">Sociedad de Gananciales</option>
                                <option value="separacion_bienes">Separación de Bienes</option>
                                <option value="participacion">Régimen de Participación</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Si hay exactamente 2 vendedores y es el 2º, preguntar relación entre ambos */}
                        {formData.sellers?.length === 2 && idx === 1 && (
                          <div className="pt-2 border-t border-slate-200">
                            <Label htmlFor="sellers-relationship-select" className="text-xs font-semibold text-slate-900 block mb-1">
                              ¿Qué relación o vínculo existe entre los dos Vendedores?
                            </Label>
                            <select
                              id="sellers-relationship-select"
                              aria-label="Vínculo o relación entre los Vendedores"
                              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              value={formData.sellersRelationship}
                              onChange={(e) => {
                                const rel = e.target.value as RelationshipType;
                                setFormData({
                                  ...formData,
                                  sellersRelationship: rel,
                                  seller1CivilStatus: rel === 'casados_entre_si' ? 'casado' : rel === 'pareja_hecho_entre_si' ? 'pareja_de_hecho' : formData.seller1CivilStatus,
                                  seller2CivilStatus: rel === 'casados_entre_si' ? 'casado' : rel === 'pareja_hecho_entre_si' ? 'pareja_de_hecho' : formData.seller2CivilStatus,
                                });
                              }}
                            >
                              <option value="ninguna">No / Independientes o casados con terceras personas</option>
                              <option value="casados_entre_si">Sí, están Casados entre sí</option>
                              <option value="pareja_hecho_entre_si">Sí, son Pareja de hecho inscrita entre sí</option>
                            </select>
                          </div>
                        )}

                        {/* Domicilio del vendedor */}
                        {!isFirst && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                            <input
                              type="checkbox"
                              id={`seller-same-address-${seller.id}`}
                              checked={seller.sameAddressAsFirst !== false}
                              onChange={(e) => {
                                const same = e.target.checked;
                                updateSeller(seller.id, 'sameAddressAsFirst', same);
                                if (same) {
                                  const first = formData.sellers?.[0];
                                  if (first) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      sellers: (prev.sellers || []).map((s) =>
                                        s.id === seller.id
                                          ? {
                                              ...s,
                                              sameAddressAsFirst: true,
                                              street: first.street,
                                              number: first.number,
                                              floorLetter: first.floorLetter,
                                              city: first.city,
                                              province: first.province,
                                              zipcode: first.zipcode,
                                              address: first.address,
                                            }
                                          : s
                                      ),
                                    }));
                                  }
                                }
                              }}
                              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                            />
                            <Label htmlFor={`seller-same-address-${seller.id}`} className="text-xs font-semibold text-slate-800 cursor-pointer">
                              Misma dirección que el Vendedor 1
                            </Label>
                          </div>
                        )}

                        {(isFirst || seller.sameAddressAsFirst === false) && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <Label className="text-xs font-semibold text-slate-800 block">
                              Domicilio {isFirst ? 'Vendedor 1 (y por defecto de la parte vendedora)' : `Vendedor ${idx + 1}`}
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                              <div className="md:col-span-3">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Domicilio (Calle / Avda / Plaza)</Label>
                                <Input
                                  value={seller.street || ''}
                                  onChange={(e) => updateSeller(seller.id, 'street', e.target.value)}
                                  onBlur={(e) => {
                                    updateSeller(seller.id, 'street', toTitleCase(e.target.value));
                                    autoLookupSellerZipcode(seller.id, true);
                                  }}
                                  placeholder="Ej: Calle Juan de Acosta"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Número</Label>
                                <Input
                                  value={seller.number || ''}
                                  onChange={(e) => updateSeller(seller.id, 'number', e.target.value)}
                                  onBlur={() => autoLookupSellerZipcode(seller.id, true)}
                                  placeholder="Ej: 6"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Piso y Letra</Label>
                                <Input
                                  value={seller.floorLetter || ''}
                                  onChange={(e) => updateSeller(seller.id, 'floorLetter', e.target.value)}
                                  onBlur={(e) => updateSeller(seller.id, 'floorLetter', toTitleCase(e.target.value))}
                                  placeholder="Ej: 2º B"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Municipio</Label>
                                <Input
                                  value={seller.city || ''}
                                  onChange={(e) => updateSeller(seller.id, 'city', e.target.value)}
                                  onBlur={(e) => {
                                    updateSeller(seller.id, 'city', toTitleCase(e.target.value));
                                    autoLookupSellerZipcode(seller.id, true);
                                  }}
                                  placeholder="Ej: Laguna de Duero"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Provincia</Label>
                                <Input
                                  value={seller.province || ''}
                                  onChange={(e) => updateSeller(seller.id, 'province', e.target.value)}
                                  onBlur={(e) => updateSeller(seller.id, 'province', toTitleCase(e.target.value))}
                                  placeholder="Ej: Valladolid"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">CP (Código Postal)</Label>
                                <Input
                                  value={seller.zipcode || ''}
                                  onChange={(e) => updateSeller(seller.id, 'zipcode', e.target.value)}
                                  placeholder="Ej: 47140"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 3: Parte Compradora */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      Parte Compradora ({(formData.buyers || []).length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Puedes añadir tantos compradores como vayan a figurar en la compraventa.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBuyer}
                    className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1.5 font-semibold cursor-pointer"
                  >
                    <UserPlus size={14} /> Añadir Comprador
                  </Button>
                </div>

                <div className="space-y-5">
                  {(formData.buyers || []).map((buyer, idx) => {
                    const isFirst = idx === 0;
                    const dniVal = validateDNI_NIE(buyer.dni);
                    const isFilled = !!buyer.dni?.trim();

                    const representingReps = (formData.representatives || []).filter(
                      (r) => r.representedPartyIds?.includes(buyer.id)
                    );

                    return (
                      <div key={buyer.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 relative">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              Comprador {idx + 1} {isFirst ? '(Principal)' : ''} {buyer.name ? `: ${buyer.name}` : ''}
                            </span>
                            {representingReps.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                <ShieldCheck size={12} className="text-amber-700" />
                                Representado por: {representingReps.map((r) => r.name || 'Apoderado').join(', ')}
                              </span>
                            )}
                          </div>
                          {!isFirst && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBuyer(buyer.id)}
                              className="text-xs text-red-600 hover:bg-red-50 h-7 px-2 gap-1 cursor-pointer font-semibold"
                            >
                              <Trash2 size={13} /> Eliminar Comprador
                            </Button>
                          )}
                        </div>

                        {/* Datos personales del comprador */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                          <div className={buyer.civilStatus === 'casado' ? 'md:col-span-4' : 'md:col-span-6'}>
                            <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre Comprador {idx + 1} *</Label>
                            <Input
                              value={buyer.name}
                              onChange={(e) => updateBuyer(buyer.id, 'name', e.target.value)}
                              onBlur={(e) => updateBuyer(buyer.id, 'name', formatNameWithHonorific(e.target.value))}
                              placeholder="Nombre y Apellidos"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIF Comprador {idx + 1} *</Label>
                            <Input
                              value={buyer.dni}
                              onChange={(e) => updateBuyer(buyer.id, 'dni', e.target.value)}
                              onBlur={(e) => updateBuyer(buyer.id, 'dni', cleanDniString(e.target.value))}
                              placeholder="12345678Z"
                              className={`uppercase ${
                                isFilled && !dniVal.isValid
                                  ? 'border-red-500 text-red-950 bg-red-50/20'
                                  : 'border-slate-200'
                              }`}
                            />
                            {isFilled && (
                              <p className={`text-[10px] font-medium mt-1 truncate ${
                                dniVal.isValid ? 'text-emerald-700' : 'text-red-600'
                              }`} title={dniVal.message}>
                                {dniVal.isValid ? `✓ ${dniVal.message}` : `⚠️ ${dniVal.message}`}
                              </p>
                            )}
                          </div>

                          <div className={buyer.civilStatus === 'casado' ? 'md:col-span-2' : 'md:col-span-3'}>
                            <Label htmlFor={`buyer-${buyer.id}-civil-status`} className="text-xs font-medium text-slate-700 whitespace-nowrap">Estado Civil</Label>
                            <select
                              id={`buyer-${buyer.id}-civil-status`}
                              aria-label={`Estado Civil Comprador ${idx + 1}`}
                              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              value={buyer.civilStatus}
                              onChange={(e) => updateBuyer(buyer.id, 'civilStatus', e.target.value as CivilStatus)}
                            >
                              <option value="soltero">Soltero/a</option>
                              <option value="casado">Casado/a</option>
                              <option value="pareja_de_hecho">Pareja de hecho (inscrita)</option>
                              <option value="divorciado">Divorciado/a</option>
                              <option value="separado">Separado/a (legalmente)</option>
                              <option value="viudo">Viudo/a</option>
                            </select>
                          </div>

                          {buyer.civilStatus === 'casado' && (
                            <div className="md:col-span-3">
                              <Label htmlFor={`buyer-${buyer.id}-matrimonial-regime`} className="text-xs font-medium text-slate-700 whitespace-nowrap">Régimen Matrimonial</Label>
                              <select
                                id={`buyer-${buyer.id}-matrimonial-regime`}
                                aria-label={`Régimen Matrimonial Comprador ${idx + 1}`}
                                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={buyer.matrimonialRegime || 'gananciales'}
                                onChange={(e) => updateBuyer(buyer.id, 'matrimonialRegime', e.target.value as MatrimonialRegime)}
                              >
                                <option value="gananciales">Sociedad de Gananciales</option>
                                <option value="separacion_bienes">Separación de Bienes</option>
                                <option value="participacion">Régimen de Participación</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Si hay exactamente 2 compradores y es el 2º, preguntar relación entre ambos */}
                        {formData.buyers?.length === 2 && idx === 1 && (
                          <div className="pt-2 border-t border-slate-200">
                            <Label htmlFor="buyers-relationship-select" className="text-xs font-semibold text-slate-900 block mb-1">
                              ¿Qué relación o vínculo existe entre los dos Compradores?
                            </Label>
                            <select
                              id="buyers-relationship-select"
                              aria-label="Vínculo o relación entre los Compradores"
                              className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              value={formData.buyersRelationship}
                              onChange={(e) => {
                                const rel = e.target.value as RelationshipType;
                                setFormData({
                                  ...formData,
                                  buyersRelationship: rel,
                                  buyer1CivilStatus: rel === 'casados_entre_si' ? 'casado' : rel === 'pareja_hecho_entre_si' ? 'pareja_de_hecho' : formData.buyer1CivilStatus,
                                  buyer2CivilStatus: rel === 'casados_entre_si' ? 'casado' : rel === 'pareja_hecho_entre_si' ? 'pareja_de_hecho' : formData.buyer2CivilStatus,
                                });
                              }}
                            >
                              <option value="ninguna">No / Independientes o casados con terceras personas</option>
                              <option value="casados_entre_si">Sí, están Casados entre sí</option>
                              <option value="pareja_hecho_entre_si">Sí, son Pareja de hecho inscrita entre sí</option>
                            </select>
                          </div>
                        )}

                        {/* Domicilio del comprador */}
                        {!isFirst && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                            <input
                              type="checkbox"
                              id={`buyer-same-address-${buyer.id}`}
                              checked={buyer.sameAddressAsFirst !== false}
                              onChange={(e) => {
                                const same = e.target.checked;
                                updateBuyer(buyer.id, 'sameAddressAsFirst', same);
                                if (same) {
                                  const first = formData.buyers?.[0];
                                  if (first) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      buyers: (prev.buyers || []).map((b) =>
                                        b.id === buyer.id
                                          ? {
                                              ...b,
                                              sameAddressAsFirst: true,
                                              street: first.street,
                                              number: first.number,
                                              floorLetter: first.floorLetter,
                                              city: first.city,
                                              province: first.province,
                                              zipcode: first.zipcode,
                                              address: first.address,
                                            }
                                          : b
                                      ),
                                    }));
                                  }
                                }
                              }}
                              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                            />
                            <Label htmlFor={`buyer-same-address-${buyer.id}`} className="text-xs font-semibold text-slate-800 cursor-pointer">
                              Misma dirección que el Comprador 1
                            </Label>
                          </div>
                        )}

                        {(isFirst || buyer.sameAddressAsFirst === false) && (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <Label className="text-xs font-semibold text-slate-800 block">
                              Domicilio {isFirst ? 'Comprador 1 (y por defecto de la parte compradora)' : `Comprador ${idx + 1}`}
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                              <div className="md:col-span-3">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Domicilio (Calle / Avda / Plaza)</Label>
                                <Input
                                  value={buyer.street || ''}
                                  onChange={(e) => updateBuyer(buyer.id, 'street', e.target.value)}
                                  onBlur={(e) => {
                                    updateBuyer(buyer.id, 'street', toTitleCase(e.target.value));
                                    autoLookupBuyerZipcode(buyer.id, true);
                                  }}
                                  placeholder="Ej: Plaza Ribera de Castilla"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Número</Label>
                                <Input
                                  value={buyer.number || ''}
                                  onChange={(e) => updateBuyer(buyer.id, 'number', e.target.value)}
                                  onBlur={() => autoLookupBuyerZipcode(buyer.id, true)}
                                  placeholder="Ej: 12"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Piso y Letra</Label>
                                <Input
                                  value={buyer.floorLetter || ''}
                                  onChange={(e) => updateBuyer(buyer.id, 'floorLetter', e.target.value)}
                                  onBlur={(e) => updateBuyer(buyer.id, 'floorLetter', toTitleCase(e.target.value))}
                                  placeholder="Ej: 4º D"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Municipio</Label>
                                <Input
                                  value={buyer.city || ''}
                                  onChange={(e) => updateBuyer(buyer.id, 'city', e.target.value)}
                                  onBlur={(e) => {
                                    updateBuyer(buyer.id, 'city', toTitleCase(e.target.value));
                                    autoLookupBuyerZipcode(buyer.id, true);
                                  }}
                                  placeholder="Ej: Valladolid"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Provincia</Label>
                                <Input
                                  value={buyer.province || ''}
                                  onChange={(e) => updateBuyer(buyer.id, 'province', e.target.value)}
                                  onBlur={(e) => updateBuyer(buyer.id, 'province', toTitleCase(e.target.value))}
                                  placeholder="Ej: Valladolid"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">CP (Código Postal)</Label>
                                <Input
                                  value={buyer.zipcode || ''}
                                  onChange={(e) => updateBuyer(buyer.id, 'zipcode', e.target.value)}
                                  placeholder="Ej: 47001"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 4: Representantes y Apoderados (Poderes Notariales) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      Representantes y Apoderados (Poderes Notariales) ({(formData.representatives || []).length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Opcional. Configura una o varias personas apoderadas que actúen en nombre y representación de todos o de algunos de los vendedores o compradores.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRepresentative}
                    className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1.5 font-semibold cursor-pointer"
                  >
                    <Plus size={14} /> Añadir Apoderado / Representante
                  </Button>
                </div>

                {(!formData.representatives || formData.representatives.length === 0) ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2">
                    <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      No hay personas apoderadas añadidas
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Todas las partes vendedoras y compradoras intervienen en su propio nombre y derecho. Si alguna persona actúa en representación de otra mediante poder notarial, haz clic en "Añadir Apoderado / Representante".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.representatives.map((rep, repIdx) => {
                      const repDniVal = validateDNI_NIE(rep.dni);
                      const isRepDniFilled = !!rep.dni?.trim();

                      return (
                        <div key={rep.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-4 relative shadow-2xs">
                          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">
                                {repIdx + 1}
                              </span>
                              Apoderado / Representante {repIdx + 1} {rep.name ? `: ${rep.name}` : ''}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRepresentative(rep.id)}
                              className="text-xs text-red-600 hover:bg-red-50 h-7 px-2 gap-1 cursor-pointer font-semibold"
                            >
                              <Trash2 size={13} /> Eliminar Apoderado
                            </Button>
                          </div>

                          {/* Selección de a quién representa */}
                          <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Label className="text-xs font-bold text-slate-900 block">
                                ¿A qué persona/s representa este apoderado? *
                              </Label>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setRepresentAllSellers(rep.id)}
                                  className="text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  A todos los Vendedores
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRepresentAllBuyers(rep.id)}
                                  className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  A todos los Compradores
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRepresentEveryone(rep.id)}
                                  className="text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  A Todos
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                              {/* Vendedores */}
                              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-1.5">
                                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide block border-b border-slate-200 pb-1">
                                  Parte Vendedora:
                                </span>
                                {(formData.sellers || []).map((s, sIdx) => {
                                  const isChecked = rep.representedPartyIds?.includes(s.id);
                                  return (
                                    <label
                                      key={s.id}
                                      className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                                        isChecked ? 'bg-blue-100/70 font-semibold text-blue-950' : 'hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleRepresentedParty(rep.id, s.id)}
                                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                                      />
                                      <span>
                                        Vendedor {sIdx + 1}: <span className="font-medium">{s.name || '[Sin nombre]'}</span> {s.dni ? `(${s.dni})` : ''}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Compradores */}
                              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-1.5">
                                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block border-b border-slate-200 pb-1">
                                  Parte Compradora:
                                </span>
                                {(formData.buyers || []).map((b, bIdx) => {
                                  const isChecked = rep.representedPartyIds?.includes(b.id);
                                  return (
                                    <label
                                      key={b.id}
                                      className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                                        isChecked ? 'bg-emerald-100/70 font-semibold text-emerald-950' : 'hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleRepresentedParty(rep.id, b.id)}
                                        className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                                      />
                                      <span>
                                        Comprador {bIdx + 1}: <span className="font-medium">{b.name || '[Sin nombre]'}</span> {b.dni ? `(${b.dni})` : ''}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            {(!rep.representedPartyIds || rep.representedPartyIds.length === 0) && (
                              <p className="text-[11px] text-amber-800 font-medium">
                                ⚠️ Selecciona al menos a una persona para que este apoderado la represente legalmente en el contrato.
                              </p>
                            )}
                          </div>

                          {/* Datos personales del apoderado */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                            <div className="md:col-span-8">
                              <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre y Apellidos del Apoderado/a *</Label>
                              <Input
                                value={rep.name}
                                onChange={(e) => updateRepresentative(rep.id, 'name', e.target.value)}
                                onBlur={(e) => updateRepresentative(rep.id, 'name', formatNameWithHonorific(e.target.value))}
                                placeholder="Ej: Dña. Carmen Rodríguez López"
                              />
                            </div>

                            <div className="md:col-span-4">
                              <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIE Apoderado/a *</Label>
                              <Input
                                value={rep.dni}
                                onChange={(e) => updateRepresentative(rep.id, 'dni', e.target.value)}
                                onBlur={(e) => updateRepresentative(rep.id, 'dni', cleanDniString(e.target.value))}
                                placeholder="12345678Z"
                                className={`uppercase ${
                                  isRepDniFilled && !repDniVal.isValid
                                    ? 'border-red-500 text-red-950 bg-red-50/20'
                                    : 'border-slate-200'
                                }`}
                              />
                              {isRepDniFilled && (
                                <p className={`text-[10px] font-medium mt-1 truncate ${
                                  repDniVal.isValid ? 'text-emerald-700' : 'text-red-600'
                                }`} title={repDniVal.message}>
                                  {repDniVal.isValid ? `✓ ${repDniVal.message}` : `⚠️ ${repDniVal.message}`}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Domicilio del apoderado */}
                          <div className="space-y-2 pt-2 border-t border-amber-200">
                            <Label className="text-xs font-semibold text-slate-800 block">Domicilio del Apoderado/a</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                              <div className="md:col-span-3">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Domicilio (Calle / Avda / Plaza)</Label>
                                <Input
                                  value={rep.street || ''}
                                  onChange={(e) => updateRepresentative(rep.id, 'street', e.target.value)}
                                  onBlur={(e) => {
                                    updateRepresentative(rep.id, 'street', toTitleCase(e.target.value));
                                    autoLookupRepZipcode(rep.id, true);
                                  }}
                                  placeholder="Ej: Paseo de Zorrilla"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Número</Label>
                                <Input
                                  value={rep.number || ''}
                                  onChange={(e) => updateRepresentative(rep.id, 'number', e.target.value)}
                                  onBlur={() => autoLookupRepZipcode(rep.id, true)}
                                  placeholder="Ej: 45"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Piso y Letra</Label>
                                <Input
                                  value={rep.floorLetter || ''}
                                  onChange={(e) => updateRepresentative(rep.id, 'floorLetter', e.target.value)}
                                  onBlur={(e) => updateRepresentative(rep.id, 'floorLetter', toTitleCase(e.target.value))}
                                  placeholder="Ej: 1º A"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Municipio</Label>
                                <Input
                                  value={rep.city || ''}
                                  onChange={(e) => updateRepresentative(rep.id, 'city', e.target.value)}
                                  onBlur={(e) => {
                                    updateRepresentative(rep.id, 'city', toTitleCase(e.target.value));
                                    autoLookupRepZipcode(rep.id, true);
                                  }}
                                  placeholder="Ej: Valladolid"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Provincia</Label>
                                <Input
                                  value={rep.province || ''}
                                  onChange={(e) => updateRepresentative(rep.id, 'province', e.target.value)}
                                  onBlur={(e) => updateRepresentative(rep.id, 'province', toTitleCase(e.target.value))}
                                  placeholder="Ej: Valladolid"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">CP (Código Postal)</Label>
                                <Input
                                  value={rep.zipcode || ''}
                                  onChange={(e) => updateRepresentative(rep.id, 'zipcode', e.target.value)}
                                  placeholder="Ej: 47007"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Datos notariales del poder */}
                          <div className="space-y-2 pt-2 border-t border-amber-200">
                            <Label className="text-xs font-semibold text-slate-900 block">
                              Datos de la Escritura de Poder Notarial
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                              <div className="md:col-span-4">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Notario Autorizante *</Label>
                                <Input
                                  value={rep.notaryName}
                                  onChange={(e) => updateRepresentative(rep.id, 'notaryName', e.target.value)}
                                  onBlur={(e) => updateRepresentative(rep.id, 'notaryName', formatNameWithHonorific(e.target.value))}
                                  placeholder="Ej: D. Juan Gómez Santos"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Ciudad / Notaría *</Label>
                                <Input
                                  value={rep.notaryCity}
                                  onChange={(e) => updateRepresentative(rep.id, 'notaryCity', e.target.value)}
                                  onBlur={(e) => updateRepresentative(rep.id, 'notaryCity', toTitleCase(e.target.value))}
                                  placeholder="Ej: Valladolid"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Fecha del Poder *</Label>
                                <Input
                                  type="date"
                                  value={formatSpanishToISO(rep.powerDate)}
                                  onChange={(e) => {
                                    const iso = e.target.value;
                                    const formattedStr = formatDateISOToSpanish(iso);
                                    updateRepresentative(rep.id, 'powerDate', formattedStr);
                                  }}
                                  className="bg-white text-xs h-9 cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={rep.powerDate}>
                                  {rep.powerDate}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Nº de Protocolo *</Label>
                                <Input
                                  value={rep.protocolNumber}
                                  onChange={(e) => updateRepresentative(rep.id, 'protocolNumber', e.target.value)}
                                  placeholder="Ej: 1.240"
                                  className="bg-white text-xs h-9"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sección 5: Fincas Registrales del Inmueble (Soporte Multi-Finca) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                      Fincas Registrales Objeto de Compraventa ({formData.fincas?.length || 1})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Puedes incluir varias fincas registrales (ej: vivienda principal + plaza de garaje + trastero).</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFinca}
                    className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1.5 font-semibold"
                  >
                    <Plus size={14} /> Añadir otra Finca / Anexo
                  </Button>
                </div>

                <div className="space-y-4">
                  {formData.fincas?.map((finca, index) => (
                    <div key={finca.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 relative">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-800 text-[10px] flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          Finca {index + 1}: {finca.title || 'Inmueble'}
                        </span>
                        {formData.fincas.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFinca(finca.id)}
                            className="text-xs text-red-600 hover:bg-red-50 h-7 px-2 gap-1"
                          >
                            <Trash2 size={13} /> Eliminar Finca
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Tipo</Label>
                          <Input
                            value={finca.title}
                            onChange={(e) => updateFinca(finca.id, 'title', e.target.value)}
                            onBlur={(e) => updateFinca(finca.id, 'title', toTitleCase(e.target.value))}
                            placeholder="Ej: Vivienda"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nº Finca Registral *</Label>
                          <Input
                            value={finca.registryNumber}
                            onChange={(e) => updateFinca(finca.id, 'registryNumber', e.target.value)}
                            placeholder="Ej: 14.520"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Registro (Ciudad)</Label>
                          <Input
                            value={finca.registryCity}
                            onChange={(e) => updateFinca(finca.id, 'registryCity', e.target.value)}
                            onBlur={(e) => updateFinca(finca.id, 'registryCity', toTitleCase(e.target.value))}
                            placeholder="Ej: Laguna de Duero"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap" title="Número de Registro">Nº Reg.</Label>
                          <Input
                            value={finca.registryOfficeNumber || ''}
                            onChange={(e) => updateFinca(finca.id, 'registryOfficeNumber', e.target.value)}
                            placeholder="Ej: 1"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">CRU (Código Reg. Único)</Label>
                          <Input
                            value={finca.cru || ''}
                            onChange={(e) => updateFinca(finca.id, 'cru', e.target.value)}
                            maxLength={15}
                            className="font-mono text-sm md:text-base font-semibold tracking-wider text-slate-900 h-10"
                            placeholder="Ej: 470120001234567"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                        <div className="md:col-span-8">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Referencia Catastral</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={loadingCatastroFincaId === finca.id || !finca.cadastralReference}
                              onClick={() => handleLookupCatastro(finca.id, finca.cadastralReference || '')}
                              className="h-6 text-[11px] px-2 text-primary border-primary/30 hover:bg-primary/5 gap-1 cursor-pointer"
                            >
                              <Search size={12} />
                              {loadingCatastroFincaId === finca.id ? 'Consultando Catastro...' : 'Importar del Catastro'}
                            </Button>
                          </div>
                          <Input
                            value={finca.cadastralReference || ''}
                            onChange={(e) => updateFinca(finca.id, 'cadastralReference', e.target.value.toUpperCase())}
                            className="font-mono text-sm md:text-base font-semibold tracking-wider text-slate-900 uppercase h-10"
                            placeholder="Ej: 6751301UM5065S00220K"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label className="text-xs font-semibold text-primary whitespace-nowrap">Precio Finca (€) *</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={finca.priceAmount ? finca.priceAmount.toLocaleString('es-ES') : ''}
                            onChange={(e) => {
                              const cleanStr = e.target.value.replace(/\D/g, '');
                              const num = cleanStr ? parseInt(cleanStr, 10) : 0;
                              updateFincaPrice(finca.id, num);
                            }}
                            placeholder="Ej: 320.000"
                            className="font-semibold text-slate-900 border-primary/40 focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Dirección Desglosada de la Finca */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <Label className="text-xs font-semibold text-slate-800 block">Dirección de la Finca</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                          <div className="md:col-span-3">
                            <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Dirección (Calle / Avda / Plaza)</Label>
                            <Input
                              value={finca.street || ''}
                              onChange={(e) => updateFincaAddress(finca.id, 'street', e.target.value)}
                              onBlur={(e) => {
                                updateFincaAddress(finca.id, 'street', toTitleCase(e.target.value));
                                autoLookupFincaZipcode(finca.id, finca.street, finca.city, finca.province, finca.zipcode, true, finca.number);
                              }}
                              placeholder="Ej: Calle Juan de Acosta"
                              className="bg-white text-xs h-9"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Número</Label>
                            <Input
                              value={finca.number || ''}
                              onChange={(e) => updateFincaAddress(finca.id, 'number', e.target.value)}
                              onBlur={() => autoLookupFincaZipcode(finca.id, finca.street, finca.city, finca.province, finca.zipcode, true, finca.number)}
                              placeholder="Ej: 6"
                              className="bg-white text-xs h-9"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Piso y letra</Label>
                            <Input
                              value={finca.floorLetter || ''}
                              onChange={(e) => updateFincaAddress(finca.id, 'floorLetter', e.target.value)}
                              onBlur={(e) => updateFincaAddress(finca.id, 'floorLetter', toTitleCase(e.target.value))}
                              placeholder="Ej: Entreplanta A"
                              className="bg-white text-xs h-9"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Municipio</Label>
                            <Input
                              value={finca.city || ''}
                              onChange={(e) => updateFincaAddress(finca.id, 'city', e.target.value)}
                              onBlur={(e) => {
                                updateFincaAddress(finca.id, 'city', toTitleCase(e.target.value));
                                autoLookupFincaZipcode(finca.id, finca.street, finca.city, finca.province, finca.zipcode, true, finca.number);
                              }}
                              placeholder="Ej: Laguna de Duero"
                              className="bg-white text-xs h-9"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Provincia</Label>
                            <Input
                              value={finca.province || ''}
                              onChange={(e) => updateFincaAddress(finca.id, 'province', e.target.value)}
                              onBlur={(e) => updateFincaAddress(finca.id, 'province', toTitleCase(e.target.value))}
                              placeholder="Ej: Valladolid"
                              className="bg-white text-xs h-9"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">CP (Código Postal)</Label>
                            <Input
                              value={finca.zipcode || ''}
                              onChange={(e) => updateFincaAddress(finca.id, 'zipcode', e.target.value)}
                              placeholder="Ej: 47140"
                              className="bg-white text-xs h-9"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`finca-desc-${finca.id}`} className="text-xs font-medium text-slate-700">Descripción Detallada (Superficie, Ref. Catastral...)</Label>
                        <textarea
                          id={`finca-desc-${finca.id}`}
                          aria-label="Descripción Detallada de la Finca"
                          rows={2}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          value={finca.propertyDescription ?? ''}
                          onChange={(e) => updateFinca(finca.id, 'propertyDescription', e.target.value)}
                          placeholder="Descripción detallada de la finca, superficie útil/construida, referencia catastral..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banner de Validación del Desglose de Precios */}
                {formData.fincas && formData.fincas.length > 1 && (
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                    isPriceMatching ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {isPriceMatching ? (
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                      )}
                      <div>
                        {isPriceMatching ? (
                          <p className="text-xs font-semibold">
                            ¡Perfecto! La suma de las fincas ({sumFincasPrices.toLocaleString('es-ES')} €) coincide exactamente con el Precio Total ({totalPriceNumeric.toLocaleString('es-ES')} €).
                          </p>
                        ) : (
                          <div>
                            <p className="text-xs font-bold">
                              Descuadre de Precios: La suma de las fincas ({sumFincasPrices.toLocaleString('es-ES')} €) no coincide con el Precio Total ({totalPriceNumeric.toLocaleString('es-ES')} €).
                            </p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              Diferencia: <span className="font-bold">{Math.abs(fincasPriceDiff).toLocaleString('es-ES')} €</span> {fincasPriceDiff > 0 ? '(falta por asignar)' : '(sobra en el desglose)'}.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isPriceMatching && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={autoBalanceFincas}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 font-semibold shadow-xs"
                      >
                        <Calculator size={14} /> Ajustar diferencia en Finca 1
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Sección 6: Estado de Cargas (Selector de 3 Opciones) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">6</span>
                  Estado de Cargas del Inmueble
                </h3>
                    <div className="space-y-3">
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.chargesOption === '1' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="chargesOption"
                          value="1"
                          checked={formData.chargesOption === '1'}
                          onChange={() => setFormData({ ...formData, chargesOption: '1' })}
                          className="mt-1 accent-primary"
                        />
                        <div>
                          <span className="font-bold text-sm text-slate-900">1. LIBRE DE CARGAS</span>
                          <p className="text-xs text-slate-500 mt-0.5">Sin cargas ni gravámenes, al corriente de impuestos y gastos de comunidad.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.chargesOption === '2' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="chargesOption"
                          value="2"
                          checked={formData.chargesOption === '2'}
                          onChange={() => setFormData({ ...formData, chargesOption: '2' })}
                          className="mt-1 accent-primary"
                        />
                        <div>
                          <span className="font-bold text-sm text-slate-900">2. LIBRE DE CARGAS MEDIANTE CANCELACIÓN ECONÓMICA EN ESCRITURA</span>
                          <p className="text-xs text-slate-500 mt-0.5">Existe hipoteca/carga que se cancelará económicamente con el precio de compraventa el día de la firma.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.chargesOption === '3' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                        <input
                          type="radio"
                          name="chargesOption"
                          value="3"
                          checked={formData.chargesOption === '3'}
                          onChange={() => setFormData({ ...formData, chargesOption: '3' })}
                          className="mt-1 accent-primary"
                        />
                        <div>
                          <span className="font-bold text-sm text-slate-900">3. CON RETENCIÓN DE IMPORTE PARA CANCELACIÓN REGISTRAL</span>
                          <p className="text-xs text-slate-500 mt-0.5">Se retendrá una cantidad del precio final para gestionar la cancelación registral (ej: gastos notaría/registro/gestoría).</p>
                        </div>
                      </label>
                    </div>

                    {formData.chargesOption === '3' && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3 mt-3">
                        <span className="font-semibold text-xs text-amber-900 block">Detalles de la Retención para Cancelación Registral</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-amber-900">Importe Retenido</Label>
                            <Input
                              value={formData.retentionAmount}
                              onChange={(e) => setFormData({ ...formData, retentionAmount: e.target.value })}
                              placeholder="Ej: 3.000 € (TRES MIL EUROS)"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-amber-900">Plazo Devolución Sobrante</Label>
                            <Input
                              value={formData.returnDays}
                              onChange={(e) => setFormData({ ...formData, returnDays: e.target.value })}
                              placeholder="Ej: 15 días"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-amber-900">Plazo Improrrogable Gestión</Label>
                            <Input
                              value={formData.managementMonths}
                              onChange={(e) => setFormData({ ...formData, managementMonths: e.target.value })}
                              placeholder="Ej: 6 meses"
                            />
                          </div>
                        </div>
                      </div>
                    )}
              </div>

              {/* Sección 7: Cláusulas Adicionales */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">7</span>
                  Cláusulas Adicionales (Mobiliario, Hipoteca y Fotoreportaje)
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeKitchenClause}
                      onChange={(e) => setFormData({ ...formData, includeKitchenClause: e.target.checked })}
                      className="w-4 h-4 rounded text-primary accent-primary"
                    />
                    Incluir cláusula de Cocina equipada con electrodomésticos (sin garantía express)
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeFurnitureClause}
                        onChange={(e) => setFormData({ ...formData, includeFurnitureClause: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                      />
                      Incluir transmisión de Mobiliario y Enseres
                    </label>

                    {formData.includeFurnitureClause && (
                      <div className="pl-7 pt-1">
                        <Label htmlFor="furniture-description-input" className="text-xs font-medium text-slate-700">Descripción / Lista del Mobiliario Incluido</Label>
                        <textarea
                          id="furniture-description-input"
                          aria-label="Descripción o Lista del Mobiliario Incluido"
                          rows={3}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary mt-1"
                          value={formData.furnitureDescription}
                          onChange={(e) => setFormData({ ...formData, furnitureDescription: e.target.value })}
                          placeholder="Ej: Sofá de 3 plazas, mesa de comedor con 4 sillas, mueble de TV, cama matrimonio con canapé..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Condición Suspensiva Hipotecaria */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includeMortgageSuspensiveClause || false}
                        onChange={(e) => setFormData({ ...formData, includeMortgageSuspensiveClause: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                      />
                      Incluir Condición Suspensiva de Financiación Hipotecaria (Resolución sin penalización si el banco deniega la hipoteca)
                    </label>

                    {formData.includeMortgageSuspensiveClause && (
                      <div className="pl-7 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Plazo Máximo para Aprobación Bancaria</Label>
                          <Input
                            value={formData.mortgageDays}
                            onChange={(e) => setFormData({ ...formData, mortgageDays: e.target.value })}
                            placeholder="Ej: 30 días"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Importe Préstamo Hipotecario a Solicitar</Label>
                          <Input
                            value={formData.mortgageAmount}
                            onChange={(e) => setFormData({ ...formData, mortgageAmount: e.target.value })}
                            placeholder="Ej: 200.000 € (DOSCIENTOS MIL EUROS) o 80% del precio"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.includePhotoReportClause}
                        onChange={(e) => setFormData({ ...formData, includePhotoReportClause: e.target.checked })}
                        className="w-4 h-4 rounded text-primary accent-primary"
                      />
                      Incluir anexo con Fotoreportaje / Inventario Fotográfico del inmueble
                    </label>

                    {formData.includePhotoReportClause && (
                      <div className="pl-7 pt-2 space-y-3">
                        {availablePhotos.length === 0 ? (
                          <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            No hay fotografías registradas en la ficha de este inmueble. Suba fotos al inmueble para incluirlas en el anexo.
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-slate-700">
                                Fotos a incluir en el Anexo I ({selectedPhotoIds.length} de {availablePhotos.length} seleccionadas):
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={selectAllPhotos}
                                  className="text-primary hover:underline font-semibold"
                                >
                                  Seleccionar todas
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={deselectAllPhotos}
                                  className="text-slate-500 hover:underline font-medium"
                                >
                                  Desmarcar todas
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                              {(() => {
                                const selectedPhotoSet = new Set(selectedPhotoIds);
                                return availablePhotos.map((photo, idx) => {
                                  const isSelected = selectedPhotoSet.has(photo.id);
                                  return (
                                    <button
                                      type="button"
                                      key={photo.id}
                                      onClick={() => togglePhoto(photo.id)}
                                      aria-label={`Seleccionar fotografía ${idx + 1}: ${photo.title || 'Inmueble'}`}
                                      className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-colors group text-left p-0 ${
                                        isSelected
                                          ? 'border-primary shadow-sm ring-2 ring-primary/20'
                                          : 'border-slate-200 opacity-60 hover:opacity-100'
                                      }`}
                                    >
                                      <img
                                        src={photo.url}
                                        alt={`Foto ${idx + 1}`}
                                        className="w-full h-24 object-cover block"
                                      />
                                      <div className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-colors ${
                                        isSelected ? 'bg-primary text-white shadow-sm' : 'bg-slate-900/60 text-white'
                                      }`}>
                                        {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                                      </div>
                                      <div className="p-1 bg-white text-[10px] truncate text-slate-600 font-medium text-center border-t border-slate-100">
                                        {photo.title || `Fotografía ${idx + 1}`}
                                      </div>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* Sección 8: Condiciones Económicas */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">8</span>
                  Condiciones Económicas (Arras Penitenciales)
                </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-slate-800">Precio Total Venta (€) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={(() => {
                            const val = formData.totalPriceNum !== undefined && formData.totalPriceNum !== null ? formData.totalPriceNum : (extractNumericPrice(formData.totalPrice) || 0);
                            return val ? val.toLocaleString('es-ES') : '';
                          })()}
                          onChange={(e) => {
                            const cleanStr = e.target.value.replace(/\D/g, '');
                            const num = cleanStr ? parseInt(cleanStr, 10) : 0;
                            handleTotalPriceNumChange(num);
                          }}
                          placeholder="Ej: 320.000"
                          className="font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-800">Importe de Arras (€) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={(() => {
                            const val = formData.arrasAmountNum !== undefined && formData.arrasAmountNum !== null ? formData.arrasAmountNum : (extractNumericPrice(formData.arrasAmount) || 0);
                            return val ? val.toLocaleString('es-ES') : '';
                          })()}
                          onChange={(e) => {
                            const cleanStr = e.target.value.replace(/\D/g, '');
                            const num = cleanStr ? parseInt(cleanStr, 10) : 0;
                            handleArrasAmountNumChange(num);
                          }}
                          placeholder="Ej: 32.000"
                          className="font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-800">Importe Restante Escritura (€)</Label>
                        <Input
                          type="text"
                          readOnly
                          disabled
                          value={(() => {
                            const val = formData.remainingAmountNum !== undefined && formData.remainingAmountNum !== null ? formData.remainingAmountNum : (extractNumericPrice(formData.remainingAmount) || 0);
                            return val ? val.toLocaleString('es-ES') : '0';
                          })()}
                          placeholder="Autocalculado"
                          className="font-bold text-slate-800 bg-slate-100 border-slate-200 cursor-not-allowed shadow-none"
                        />
                      </div>
                    </div>

                    {(() => {
                      const ibanValidation = validateIBAN(formData.sellerIban);
                      const isFilled = !!formData.sellerIban?.trim();
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-slate-800">
                              IBAN Cuenta Vendedora para Transferencia *
                            </Label>
                            {isFilled && (
                              <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                                ibanValidation.isValid ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {ibanValidation.isValid ? (
                                  <>
                                    <CheckCircle2 size={13} /> Cuenta Válida
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle size={13} /> IBAN Incorrecto
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          <Input
                            value={formData.sellerIban}
                            onChange={(e) => setFormData({ ...formData, sellerIban: e.target.value })}
                            placeholder="ES21 0000 0000 0000 0000 0000"
                            className={`font-semibold transition-colors ${
                              isFilled
                                ? ibanValidation.isValid
                                  ? 'border-emerald-500 focus:ring-emerald-500/20 text-emerald-950 bg-emerald-50/10'
                                  : 'border-red-500 focus:ring-red-500/20 text-red-950 bg-red-50/20'
                                : 'border-slate-200'
                            }`}
                          />
                          {isFilled ? (
                            <p className={`text-[11px] font-medium flex items-center gap-1 mt-1 ${
                              ibanValidation.isValid ? 'text-emerald-700' : 'text-red-600'
                            }`}>
                              {ibanValidation.isValid ? (
                                <span>✓ {ibanValidation.message} ({ibanValidation.formatted})</span>
                              ) : (
                                <span>⚠️ {ibanValidation.message}</span>
                              )}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Introduce el número de cuenta formato IBAN (ej: ES21 1234 5678 9012 3456 7890)
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

              {/* Sección 9: Notaría y Fuero */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">9</span>
                  Escritura Pública y Fuero
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-800">Fecha Límite Firma ante Notario *</Label>
                    <Input
                      type="date"
                      value={formatSpanishToISO(formData.notaryDeadline)}
                      onChange={(e) => {
                        const iso = e.target.value;
                        const formattedStr = formatDateISOToSpanish(iso);
                        setFormData({ ...formData, notaryDeadline: formattedStr });
                      }}
                      className="font-semibold text-slate-900 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-600 font-medium mt-1 truncate" title={formData.notaryDeadline}>
                      Redacción legal: <span className="font-semibold text-slate-900">{formData.notaryDeadline}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Juzgados y Tribunales de (Fuero)</Label>
                    <Input
                      value={formData.jurisdictionCity}
                      onChange={(e) => setFormData({ ...formData, jurisdictionCity: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, jurisdictionCity: toTitleCase(e.target.value) })}
                      placeholder="Ej: Valladolid"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className={`gap-2 text-xs font-medium transition-colors ${
                    draftSaved
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {draftSaved ? (
                    <>
                      <BookmarkCheck size={15} className="text-emerald-600" /> Borrador Guardado
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Guardar Borrador para Continuar Después
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setActiveTab('signatures')}
                  className="bg-primary hover:bg-primary/95 text-white gap-2 font-medium px-6 py-2 text-xs"
                >
                  Continuar a Firma Digital →
                </Button>
              </div>
            </div>
          ) : activeTab === 'signatures' ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex items-start gap-4">
                <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 mt-0.5">
                  <PenTool className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white mb-1">
                    Captura de Firma Digital Táctil y Presencial
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Firme en la pantalla (tablet, smartphone o con ratón). Las firmas capturadas se insertarán digitalmente en las casillas del contrato y en el Anexo I (Inventario Fotográfico).
                  </p>
                </div>
              </div>

              {/* PARTE VENDEDORA */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    Parte Vendedora (Propietarios y Apoderados)
                  </h4>
                  <span className="text-xs text-slate-500 font-sans">
                    {sellerSigners.length} {sellerSigners.length === 1 ? 'firmante requerido' : 'firmantes requeridos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerSigners.map((signer) => (
                    <SignatureCanvas
                      key={signer.id}
                      title={signer.roleDescription}
                      signerName={signer.name}
                      initialSignature={formData.signatures?.[signer.id] || signer.signatureUrl}
                      onSave={(url) => handleSignatureSave(signer.id, url)}
                    />
                  ))}
                </div>
              </div>

              {/* PARTE COMPRADORA */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Parte Compradora (Compradores y Apoderados)
                  </h4>
                  <span className="text-xs text-slate-500 font-sans">
                    {buyerSigners.length} {buyerSigners.length === 1 ? 'firmante requerido' : 'firmantes requeridos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buyerSigners.map((signer) => (
                    <SignatureCanvas
                      key={signer.id}
                      title={signer.roleDescription}
                      signerName={signer.name}
                      initialSignature={formData.signatures?.[signer.id] || signer.signatureUrl}
                      onSave={(url) => handleSignatureSave(signer.id, url)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  className={`gap-2 text-xs font-medium transition-colors ${
                    draftSaved
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {draftSaved ? (
                    <>
                      <BookmarkCheck size={15} className="text-emerald-600" /> Borrador Guardado
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Guardar Borrador
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="bg-primary hover:bg-primary/95 text-white gap-2 font-medium px-6 py-2 text-xs"
                >
                  Ver Documento con Firmas →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toolbar de la vista previa */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto">
                <div className="text-sm font-medium text-slate-600">
                  Documento listo para impresión A4 o exportación PDF.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyText}
                    className="text-slate-700 border-slate-300 gap-2 text-xs"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? '¡Copiado!' : 'Copiar Texto Completo'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadAsDocx}
                    className="text-blue-700 border-blue-300 hover:bg-blue-50 gap-2 text-xs font-semibold"
                  >
                    <FileDown size={15} /> Descargar Word (.docx)
                  </Button>
                  <Button
                    onClick={handlePrint}
                    className="bg-primary hover:bg-primary/95 text-white gap-2 text-xs font-semibold shadow-sm"
                  >
                    <Printer size={15} /> Imprimir / Exportar PDF
                  </Button>
                </div>
              </div>

              {/* El documento maquetado */}
              <ArrasContractDocument data={formData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ArrasContractModal: React.FC<Props> = (props) => {
  if (!props.isOpen) return null;
  return <ArrasContractModalContent key={props.property?.id || 'arras-modal'} {...props} />;
};
