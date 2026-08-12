import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrasContractDocument, toTitleCase, buildAddressString, formatNameWithHonorific, type ArrasData, type CivilStatus, type MatrimonialRegime, type RelationshipType, type FincaItem } from './ArrasContractDocument';
import { fetchZipcode } from '@/lib/gemini';
import { X, Printer, Copy, Check, FileText, UserPlus, Trash2, CheckSquare, Square, Plus, AlertTriangle, CheckCircle2, Calculator, FileDown, Save, RotateCcw, BookmarkCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onSaveSuccess?: (updatedData?: any) => void;
}

export const ArrasContractModal: React.FC<Props> = ({ isOpen, onClose, property, onSaveSuccess }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [copied, setCopied] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Helper de número a palabras en español
  const numberToWordsEs = (num: number): string => {
    if (!num || isNaN(num)) return '';
    const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECISIESTE', 'DIECINUEVE'];
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
    const formattedNum = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
    const words = numberToWordsEs(num);
    return `${formattedNum} (${words})`;
  };

  const today = new Date();
  const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const formattedTodayDate = `${today.getDate()} de ${monthsSpanish[today.getMonth()]} de ${today.getFullYear()}`;

  // Fecha por defecto escritura (30 días tras hoy)
  const defaultDeadlineDate = new Date();
  defaultDeadlineDate.setDate(today.getDate() + 30);
  const formattedDeadlineDate = `${defaultDeadlineDate.getDate()} de ${monthsSpanish[defaultDeadlineDate.getMonth()]} de ${defaultDeadlineDate.getFullYear()}`;

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
      if (!/^ES\d{22}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Un IBAN español solo debe contener las siglas ES seguidas de 22 números.',
          formatted,
        };
      }
    } else {
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) {
        return {
          isValid: false,
          message: 'Estructura de IBAN no válida. Debe comenzar por el código de país (ej: ES, FR, DE).',
          formatted,
        };
      }
    }

    // Algoritmo Módulo 97-10
    const rearranged = clean.slice(4) + clean.slice(0, 4);
    let expanded = '';
    for (let i = 0; i < rearranged.length; i++) {
      const char = rearranged[i];
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        expanded += (code - 55).toString();
      } else {
        expanded += char;
      }
    }

    let remainder = 0;
    for (let i = 0; i < expanded.length; i += 7) {
      const block = remainder.toString() + expanded.slice(i, i + 7);
      remainder = parseInt(block, 10) % 97;
    }

    if (remainder !== 1) {
      return {
        isValid: false,
        message: 'Los dígitos de control del IBAN no son válidos (revisa si hay algún error de tecleo).',
        formatted,
      };
    }

    return {
      isValid: true,
      message: 'IBAN verificado y correcto (Módulo 97 válido)',
      formatted,
    };
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

    const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${day} de ${monthsSpanish[month]} de ${year}`;
  };

  const formatSpanishToISO = (spanishDateStr: string): string => {
    if (!spanishDateStr) return '';
    const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const match = spanishDateStr.match(/(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)\s+de\s+(\d{4})/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[2].toLowerCase();
      const monthIdx = monthsSpanish.findIndex(m => m === monthName);
      const year = match[3];
      if (monthIdx !== -1) {
        const month = (monthIdx + 1).toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(spanishDateStr)) {
      return spanishDateStr;
    }
    return '';
  };

  const [formData, setFormData] = useState<ArrasData>({
    city: property?.city || 'Valladolid',
    dateStr: formattedTodayDate,

    // Vendedor
    seller1Name: property?.owner_name || '',
    seller1Dni: property?.owner_dni || '',
    seller1CivilStatus: (property?.owner_civil_status as CivilStatus) || 'soltero',
    seller1MatrimonialRegime: (property?.owner_matrimonial_regime as MatrimonialRegime) || 'gananciales',
    seller1Address: property?.owner_address ? `${property.owner_address}, ${property.owner_city || property?.city || ''}` : '',
    seller1Street: property?.owner_address || '',
    seller1Number: '',
    seller1FloorLetter: '',
    seller1City: property?.owner_city || property?.city || 'Valladolid',
    seller1Province: property?.owner_province || property?.province || 'Valladolid',
    seller1Zipcode: property?.owner_zipcode || '',
    hasSeller2: property?.has_owner2 || false,
    seller2Name: property?.owner2_name || '',
    seller2Dni: property?.owner2_dni || '',
    seller2CivilStatus: (property?.owner2_civil_status as CivilStatus) || 'soltero',
    seller2MatrimonialRegime: 'gananciales',
    sellersRelationship: (property?.owners_relationship as RelationshipType) || 'ninguna',
    seller2SameAddress: true,
    seller2Address: '',
    seller2Street: '',
    seller2Number: '',
    seller2FloorLetter: '',
    seller2City: property?.owner_city || property?.city || 'Valladolid',
    seller2Province: property?.owner_province || property?.province || 'Valladolid',
    seller2Zipcode: '',

    // Comprador
    buyer1Name: property?.buyer1_name || '',
    buyer1Dni: property?.buyer1_dni || '',
    buyer1CivilStatus: (property?.buyer1_civil_status as CivilStatus) || 'soltero',
    buyer1MatrimonialRegime: (property?.buyer1_matrimonial_regime as MatrimonialRegime) || 'gananciales',
    buyer1Address: property?.buyer1_address || '',
    buyer1Street: '',
    buyer1Number: '',
    buyer1FloorLetter: '',
    buyer1City: property?.city || 'Valladolid',
    buyer1Province: property?.province || 'Valladolid',
    buyer1Zipcode: '',
    hasBuyer2: property?.has_buyer2 || false,
    buyer2Name: property?.buyer2_name || '',
    buyer2Dni: property?.buyer2_dni || '',
    buyer2CivilStatus: (property?.buyer2_civil_status as CivilStatus) || 'soltero',
    buyer2MatrimonialRegime: (property?.buyer2_matrimonial_regime as MatrimonialRegime) || 'gananciales',
    buyersRelationship: (property?.buyers_relationship as RelationshipType) || 'ninguna',
    buyer2SameAddress: true,
    buyer2Address: '',
    buyer2Street: '',
    buyer2Number: '',
    buyer2FloorLetter: '',
    buyer2City: property?.city || 'Valladolid',
    buyer2Province: property?.province || 'Valladolid',
    buyer2Zipcode: '',

    // Fincas (1 o varias)
    fincas: [
      {
        id: 'finca-1',
        title: property ? `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} principal` : 'Vivienda principal',
        registryNumber: '',
        registryCity: property?.city || 'Valladolid',
        street: property?.address_hidden || '',
        number: property?.block_stairs || '',
        floorLetter: property?.door || '',
        city: property?.city || 'Valladolid',
        province: property?.province || 'Valladolid',
        zipcode: property?.zipcode || '',
        propertyAddress: property?.address_hidden ? `${property.address_hidden}, ${property.city || ''} (${property.province || ''})` : '',
        propertyDescription: property ? `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.internal_reference || '[Pendiente]'}.` : '',
      },
    ],
    registryNumber: '',
    registryCity: property?.city || 'Valladolid',
    propertyAddress: property?.address_hidden ? `${property.address_hidden}, ${property.city} (${property.province})` : '',
    propertyDescription: property ? `${property.title || 'Vivienda'}. ${property.area_built || 0} m² construidos, ${property.area_useful || 0} m² útiles. Ref. Catastral: ${property.internal_reference || '[Pendiente]'}.` : '',

    // Cargas
    chargesOption: '1',
    retentionAmount: '3.000 € (TRES MIL EUROS)',
    returnDays: '15 días',
    managementMonths: '6 meses',

    // Cláusulas especiales
    includeKitchenClause: true,
    includeFurnitureClause: false,
    furnitureDescription: 'Mobiliario según inventario (sofá, salón completo, conjunto de comedor y dormitorios)',
    includePhotoReportClause: true,
    includeMortgageSuspensiveClause: false,
    mortgageDays: '30 días',
    mortgageAmount: property?.price ? formatCurrency(Math.round(property.price * 0.8)) : '80% del precio de compraventa',

    // Economía
    totalPrice: property?.price ? formatCurrency(property.price) : '',
    arrasAmount: property?.price ? formatCurrency(Math.round(property.price * 0.1)) : '',
    remainingAmount: property?.price ? formatCurrency(Math.round(property.price * 0.9)) : '',
    sellerIban: 'ES00 0000 0000 0000 0000 0000',

    // Escritura y Fuero
    notaryDeadline: formattedDeadlineDate,
    jurisdictionCity: property?.city || 'Valladolid',
  });

  const downloadAsDocx = () => {
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
    if (property?.id && isOpen) {
      const fetchPhotos = async () => {
        try {
          const { data, error } = await supabase
            .from('property_media')
            .select('*')
            .eq('property_id', property.id)
            .order('sort_order', { ascending: true });

          if (!error && data) {
            setAvailablePhotos(data);
            setSelectedPhotoIds(data.map((p: any) => p.id));
          }
        } catch (err) {
          console.error('Error al cargar fotos del inmueble:', err);
        }
      };
      fetchPhotos();
    }
  }, [property?.id, isOpen]);

  // Sync selected photos to formData
  useEffect(() => {
    const selected = availablePhotos.filter((p) => selectedPhotoIds.includes(p.id));
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

  // Default initial finca price to total price if only 1 finca
  useEffect(() => {
    if (formData.fincas && formData.fincas.length === 1 && !formData.fincas[0].priceAmount && totalPriceNumeric > 0) {
      setFormData((prev) => ({
        ...prev,
        fincas: [
          {
            ...prev.fincas[0],
            priceAmount: totalPriceNumeric,
            priceFormatted: formatCurrency(totalPriceNumeric),
          },
        ],
      }));
    }
  }, [totalPriceNumeric]);

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
    setFormData((prev) => ({
      ...prev,
      fincas: prev.fincas.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
  };

  const updateSellerAddress = (field: 'seller1Street' | 'seller1Number' | 'seller1FloorLetter' | 'seller1City' | 'seller1Province' | 'seller1Zipcode', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const fullAddress = buildAddressString(
        updated.seller1Street,
        updated.seller1Number,
        updated.seller1FloorLetter,
        updated.seller1City,
        updated.seller1Province,
        updated.seller1Zipcode
      );
      const isSame = prev.seller2SameAddress !== false;
      return {
        ...updated,
        seller1Address: fullAddress,
        ...(isSame ? {
          seller2Street: updated.seller1Street,
          seller2Number: updated.seller1Number,
          seller2FloorLetter: updated.seller1FloorLetter,
          seller2City: updated.seller1City,
          seller2Province: updated.seller1Province,
          seller2Zipcode: updated.seller1Zipcode,
          seller2Address: fullAddress,
        } : {})
      };
    });
  };

  const updateSeller2Address = (field: 'seller2Street' | 'seller2Number' | 'seller2FloorLetter' | 'seller2City' | 'seller2Province' | 'seller2Zipcode', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const fullAddress = buildAddressString(
        updated.seller2Street,
        updated.seller2Number,
        updated.seller2FloorLetter,
        updated.seller2City,
        updated.seller2Province,
        updated.seller2Zipcode
      );
      return {
        ...updated,
        seller2Address: fullAddress,
      };
    });
  };

  const updateBuyerAddress = (field: 'buyer1Street' | 'buyer1Number' | 'buyer1FloorLetter' | 'buyer1City' | 'buyer1Province' | 'buyer1Zipcode', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const fullAddress = buildAddressString(
        updated.buyer1Street,
        updated.buyer1Number,
        updated.buyer1FloorLetter,
        updated.buyer1City,
        updated.buyer1Province,
        updated.buyer1Zipcode
      );
      const isSame = prev.buyer2SameAddress !== false;
      return {
        ...updated,
        buyer1Address: fullAddress,
        ...(isSame ? {
          buyer2Street: updated.buyer1Street,
          buyer2Number: updated.buyer1Number,
          buyer2FloorLetter: updated.buyer1FloorLetter,
          buyer2City: updated.buyer1City,
          buyer2Province: updated.buyer1Province,
          buyer2Zipcode: updated.buyer1Zipcode,
          buyer2Address: fullAddress,
        } : {})
      };
    });
  };

  const updateBuyer2Address = (field: 'buyer2Street' | 'buyer2Number' | 'buyer2FloorLetter' | 'buyer2City' | 'buyer2Province' | 'buyer2Zipcode', value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const fullAddress = buildAddressString(
        updated.buyer2Street,
        updated.buyer2Number,
        updated.buyer2FloorLetter,
        updated.buyer2City,
        updated.buyer2Province,
        updated.buyer2Zipcode
      );
      return {
        ...updated,
        buyer2Address: fullAddress,
      };
    });
  };

  // Auto-búsqueda inteligente de CP por Gemini / Municipio
  const autoLookupSeller1Zipcode = async () => {
    if (!formData.seller1Zipcode && (formData.seller1Street || formData.seller1City)) {
      const cp = await fetchZipcode(formData.seller1Street || '', formData.seller1City || '', formData.seller1Province || '');
      if (cp) updateSellerAddress('seller1Zipcode', cp);
    }
  };

  const autoLookupSeller2Zipcode = async () => {
    if (!formData.seller2Zipcode && (formData.seller2Street || formData.seller2City)) {
      const cp = await fetchZipcode(formData.seller2Street || '', formData.seller2City || '', formData.seller2Province || '');
      if (cp) updateSeller2Address('seller2Zipcode', cp);
    }
  };

  const autoLookupBuyer1Zipcode = async () => {
    if (!formData.buyer1Zipcode && (formData.buyer1Street || formData.buyer1City)) {
      const cp = await fetchZipcode(formData.buyer1Street || '', formData.buyer1City || '', formData.buyer1Province || '');
      if (cp) updateBuyerAddress('buyer1Zipcode', cp);
    }
  };

  const autoLookupBuyer2Zipcode = async () => {
    if (!formData.buyer2Zipcode && (formData.buyer2Street || formData.buyer2City)) {
      const cp = await fetchZipcode(formData.buyer2Street || '', formData.buyer2City || '', formData.buyer2Province || '');
      if (cp) updateBuyer2Address('buyer2Zipcode', cp);
    }
  };

  const autoLookupFincaZipcode = async (fincaId: string, street?: string, city?: string, province?: string, currentZip?: string) => {
    if (!currentZip && (street || city)) {
      const cp = await fetchZipcode(street || '', city || '', province || '');
      if (cp) updateFincaAddress(fincaId, 'zipcode', cp);
    }
  };
  useEffect(() => {
    if (!isOpen || !property) return;

    const price = property.price || 0;
    const arras = Math.round(price * 0.1);
    const rest = price - arras;

    const mainFinca: FincaItem = {
      id: 'finca-1',
      title: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} principal`,
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
      propertyDescription: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.cadastral_reference || property.internal_reference || '[Pendiente]'}.`,
    };

    let savedData: Partial<ArrasData> | null = null;
    if (property.arras_contract_data && typeof property.arras_contract_data === 'object' && Object.keys(property.arras_contract_data).length > 0) {
      savedData = property.arras_contract_data;
    } else if (property.id) {
      const draftKey = `arras_draft_${property.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            savedData = parsed;
          }
        } catch (e) {
          console.error("Error al leer borrador local:", e);
        }
      }
    }

    if (savedData) {
      const baseFincas = (savedData.fincas && Array.isArray(savedData.fincas) && savedData.fincas.length > 0)
        ? savedData.fincas
        : (property.fincas_data && Array.isArray(property.fincas_data) && property.fincas_data.length > 0 ? property.fincas_data : [mainFinca]);

      setFormData({
        city: savedData.city || property.city || 'Valladolid',
        dateStr: savedData.dateStr || formattedTodayDate,
        
        // Vendedor 1
        seller1Name: savedData.seller1Name || property.owner_name || '',
        seller1Dni: savedData.seller1Dni || property.owner_dni || '',
        seller1CivilStatus: savedData.seller1CivilStatus || (property.owner_civil_status as CivilStatus) || 'soltero',
        seller1MatrimonialRegime: savedData.seller1MatrimonialRegime || (property.owner_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        seller1Address: savedData.seller1Address || property.owner_address || '',
        seller1Street: savedData.seller1Street || property.owner_street || '',
        seller1Number: savedData.seller1Number || property.owner_number || '',
        seller1FloorLetter: savedData.seller1FloorLetter || property.owner_floor_letter || '',
        seller1City: savedData.seller1City || property.owner_city || property.city || '',
        seller1Province: savedData.seller1Province || property.owner_province || property.province || '',
        seller1Zipcode: savedData.seller1Zipcode || property.owner_zipcode || property.zipcode || '',

        // Vendedor 2
        hasSeller2: savedData.hasSeller2 !== undefined ? savedData.hasSeller2 : (property.has_owner2 || false),
        seller2Name: savedData.seller2Name || property.owner2_name || '',
        seller2Dni: savedData.seller2Dni || property.owner2_dni || '',
        seller2CivilStatus: savedData.seller2CivilStatus || (property.owner2_civil_status as CivilStatus) || 'soltero',
        seller2MatrimonialRegime: savedData.seller2MatrimonialRegime || (property.owner2_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        sellersRelationship: savedData.sellersRelationship || (property.owners_relationship as RelationshipType) || 'ninguna',
        seller2SameAddress: savedData.seller2SameAddress !== undefined ? savedData.seller2SameAddress : (property.seller2_same_address ?? true),
        seller2Address: savedData.seller2Address || property.owner2_address || '',
        seller2Street: savedData.seller2Street || property.owner2_street || '',
        seller2Number: savedData.seller2Number || property.owner2_number || '',
        seller2FloorLetter: savedData.seller2FloorLetter || property.owner2_floor_letter || '',
        seller2City: savedData.seller2City || property.owner2_city || '',
        seller2Province: savedData.seller2Province || property.owner2_province || '',
        seller2Zipcode: savedData.seller2Zipcode || property.owner2_zipcode || '',

        // Comprador 1
        buyer1Name: savedData.buyer1Name || property.buyer1_name || '',
        buyer1Dni: savedData.buyer1Dni || property.buyer1_dni || '',
        buyer1CivilStatus: savedData.buyer1CivilStatus || (property.buyer1_civil_status as CivilStatus) || 'soltero',
        buyer1MatrimonialRegime: savedData.buyer1MatrimonialRegime || (property.buyer1_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        buyer1Address: savedData.buyer1Address || property.buyer1_address || '',
        buyer1Street: savedData.buyer1Street || property.buyer1_street || '',
        buyer1Number: savedData.buyer1Number || property.buyer1_number || '',
        buyer1FloorLetter: savedData.buyer1FloorLetter || property.buyer1_floor_letter || '',
        buyer1City: savedData.buyer1City || property.buyer1_city || '',
        buyer1Province: savedData.buyer1Province || property.buyer1_province || '',
        buyer1Zipcode: savedData.buyer1Zipcode || property.buyer1_zipcode || '',

        // Comprador 2
        hasBuyer2: savedData.hasBuyer2 !== undefined ? savedData.hasBuyer2 : (property.has_buyer2 || false),
        buyer2Name: savedData.buyer2Name || property.buyer2_name || '',
        buyer2Dni: savedData.buyer2Dni || property.buyer2_dni || '',
        buyer2CivilStatus: savedData.buyer2CivilStatus || (property.buyer2_civil_status as CivilStatus) || 'soltero',
        buyer2MatrimonialRegime: savedData.buyer2MatrimonialRegime || (property.buyer2_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        buyersRelationship: savedData.buyersRelationship || (property.buyers_relationship as RelationshipType) || 'ninguna',
        buyer2SameAddress: savedData.buyer2SameAddress !== undefined ? savedData.buyer2SameAddress : (property.buyer2_same_address ?? true),
        buyer2Address: savedData.buyer2Address || property.buyer2_address || '',
        buyer2Street: savedData.buyer2Street || property.buyer2_street || '',
        buyer2Number: savedData.buyer2Number || property.buyer2_number || '',
        buyer2FloorLetter: savedData.buyer2FloorLetter || property.buyer2_floor_letter || '',
        buyer2City: savedData.buyer2City || property.buyer2_city || '',
        buyer2Province: savedData.buyer2Province || property.buyer2_province || '',
        buyer2Zipcode: savedData.buyer2Zipcode || property.buyer2_zipcode || '',

        // Fincas
        fincas: baseFincas,
        registryNumber: savedData.registryNumber || property.cru || '',
        registryCity: savedData.registryCity || property.city || 'Valladolid',
        propertyAddress: savedData.propertyAddress || `${property.address_hidden}, ${property.city} (${property.province})`,
        propertyDescription: savedData.propertyDescription || mainFinca.propertyDescription,

        // Cargas
        chargesOption: savedData.chargesOption || property.charges_option || '1',
        retentionAmount: savedData.retentionAmount || property.retention_amount || '3.000 € (TRES MIL EUROS)',
        returnDays: savedData.returnDays || property.return_days || '15 días',
        managementMonths: savedData.managementMonths || property.management_months || '6 meses',

        // Cláusulas especiales
        includeKitchenClause: savedData.includeKitchenClause !== undefined ? savedData.includeKitchenClause : (property.include_kitchen_clause ?? true),
        includeFurnitureClause: savedData.includeFurnitureClause !== undefined ? savedData.includeFurnitureClause : (property.include_furniture_clause ?? false),
        furnitureDescription: savedData.furnitureDescription || property.furniture_description || '',
        includePhotoReportClause: savedData.includePhotoReportClause !== undefined ? savedData.includePhotoReportClause : (property.include_photo_report_clause ?? false),
        selectedPhotos: savedData.selectedPhotos || [],
        includeMortgageSuspensiveClause: savedData.includeMortgageSuspensiveClause !== undefined ? savedData.includeMortgageSuspensiveClause : (property.include_mortgage_suspensive_clause ?? false),
        mortgageDays: savedData.mortgageDays || property.mortgage_days || '30',
        mortgageAmount: savedData.mortgageAmount || property.mortgage_amount || (price ? formatCurrency(Math.round(price * 0.8)) : '0 €'),

        // Economía
        totalPrice: savedData.totalPrice || (price ? formatCurrency(price) : '0 €'),
        totalPriceNum: savedData.totalPriceNum || price,
        arrasAmount: savedData.arrasAmount || (price ? formatCurrency(arras) : '0 €'),
        arrasAmountNum: savedData.arrasAmountNum || arras,
        remainingAmount: savedData.remainingAmount || (price ? formatCurrency(rest) : '0 €'),
        remainingAmountNum: savedData.remainingAmountNum || rest,
        sellerIban: savedData.sellerIban || property.seller_iban || '',

        // Escritura y Fuero
        notaryDeadline: savedData.notaryDeadline || property.notary_deadline || formattedDeadlineDate,
        jurisdictionCity: savedData.jurisdictionCity || property.jurisdiction_city || property.city || 'Valladolid',
      });
      setHasRestoredDraft(true);
    } else {
      setFormData({
        city: property.city || 'Valladolid',
        dateStr: formattedTodayDate,
        seller1Name: property.owner_name || '',
        seller1Dni: property.owner_dni || '',
        seller1CivilStatus: (property.owner_civil_status as CivilStatus) || 'soltero',
        seller1MatrimonialRegime: (property.owner_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        seller1Address: property.owner_address || '',
        seller1Street: property.owner_street || '',
        seller1Number: property.owner_number || '',
        seller1FloorLetter: property.owner_floor_letter || '',
        seller1City: property.owner_city || property.city || '',
        seller1Province: property.owner_province || property.province || '',
        seller1Zipcode: property.owner_zipcode || property.zipcode || '',
        hasSeller2: property.has_owner2 || false,
        seller2Name: property.owner2_name || '',
        seller2Dni: property.owner2_dni || '',
        seller2CivilStatus: (property.owner2_civil_status as CivilStatus) || 'soltero',
        seller2MatrimonialRegime: (property.owner2_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        sellersRelationship: (property.owners_relationship as RelationshipType) || 'ninguna',
        seller2SameAddress: property.seller2_same_address ?? true,
        seller2Address: property.owner2_address || '',
        seller2Street: property.owner2_street || '',
        seller2Number: property.owner2_number || '',
        seller2FloorLetter: property.owner2_floor_letter || '',
        seller2City: property.owner2_city || '',
        seller2Province: property.owner2_province || '',
        seller2Zipcode: property.owner2_zipcode || '',

        buyer1Name: property.buyer1_name || '',
        buyer1Dni: property.buyer1_dni || '',
        buyer1CivilStatus: (property.buyer1_civil_status as CivilStatus) || 'soltero',
        buyer1MatrimonialRegime: (property.buyer1_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        buyer1Address: property.buyer1_address || '',
        buyer1Street: property.buyer1_street || '',
        buyer1Number: property.buyer1_number || '',
        buyer1FloorLetter: property.buyer1_floor_letter || '',
        buyer1City: property.buyer1_city || '',
        buyer1Province: property.buyer1_province || '',
        buyer1Zipcode: property.buyer1_zipcode || '',

        hasBuyer2: property.has_buyer2 || false,
        buyer2Name: property.buyer2_name || '',
        buyer2Dni: property.buyer2_dni || '',
        buyer2CivilStatus: (property.buyer2_civil_status as CivilStatus) || 'soltero',
        buyer2MatrimonialRegime: (property.buyer2_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        buyersRelationship: (property.buyers_relationship as RelationshipType) || 'ninguna',
        buyer2SameAddress: property.buyer2_same_address ?? true,
        buyer2Address: property.buyer2_address || '',
        buyer2Street: property.buyer2_street || '',
        buyer2Number: property.buyer2_number || '',
        buyer2FloorLetter: property.buyer2_floor_letter || '',
        buyer2City: property.buyer2_city || '',
        buyer2Province: property.buyer2_province || '',
        buyer2Zipcode: property.buyer2_zipcode || '',

        fincas: (property.fincas_data && Array.isArray(property.fincas_data) && property.fincas_data.length > 0) ? property.fincas_data : [mainFinca],
        registryNumber: property.cru || '',
        registryCity: property.city || 'Valladolid',
        propertyAddress: `${property.address_hidden}, ${property.city} (${property.province})`,
        propertyDescription: mainFinca.propertyDescription,
        chargesOption: property.charges_option || '1',
        retentionAmount: property.retention_amount || '3.000 € (TRES MIL EUROS)',
        returnDays: property.return_days || '15 días',
        managementMonths: property.management_months || '6 meses',
        includeKitchenClause: property.include_kitchen_clause ?? true,
        includeFurnitureClause: property.include_furniture_clause ?? false,
        furnitureDescription: property.furniture_description || '',
        includePhotoReportClause: property.include_photo_report_clause ?? false,
        selectedPhotos: [],
        includeMortgageSuspensiveClause: property.include_mortgage_suspensive_clause ?? false,
        mortgageDays: property.mortgage_days || '30',
        mortgageAmount: property.mortgage_amount || (price ? formatCurrency(Math.round(price * 0.8)) : '0 €'),
        totalPrice: price ? formatCurrency(price) : '0 €',
        totalPriceNum: price,
        arrasAmount: price ? formatCurrency(arras) : '0 €',
        arrasAmountNum: arras,
        remainingAmount: price ? formatCurrency(rest) : '0 €',
        remainingAmountNum: rest,
        sellerIban: property.seller_iban || '',
        notaryDeadline: property.notary_deadline || formattedDeadlineDate,
        jurisdictionCity: property.jurisdiction_city || property.city || 'Valladolid',
      });
      setHasRestoredDraft(false);
    }
  }, [isOpen, property]);

  const handleSaveDraft = async () => {
    if (!property?.id) return;
    const draftKey = `arras_draft_${property.id}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));

    try {
      const updatePayload = {
        // Vendedor 1 (Propietario 1)
        owner_name: formData.seller1Name,
        owner_dni: formData.seller1Dni,
        owner_civil_status: formData.seller1CivilStatus,
        owner_matrimonial_regime: formData.seller1MatrimonialRegime,
        owner_address: formData.seller1Address,
        owner_street: formData.seller1Street,
        owner_number: formData.seller1Number,
        owner_floor_letter: formData.seller1FloorLetter,
        owner_city: formData.seller1City,
        owner_province: formData.seller1Province,
        owner_zipcode: formData.seller1Zipcode,

        // Vendedor 2 (Propietario 2)
        has_owner2: formData.hasSeller2,
        owner2_name: formData.seller2Name,
        owner2_dni: formData.seller2Dni,
        owner2_civil_status: formData.seller2CivilStatus,
        owner2_matrimonial_regime: formData.seller2MatrimonialRegime,
        owner2_address: formData.seller2Address,
        owner2_street: formData.seller2Street,
        owner2_number: formData.seller2Number,
        owner2_floor_letter: formData.seller2FloorLetter,
        owner2_city: formData.seller2City,
        owner2_province: formData.seller2Province,
        owner2_zipcode: formData.seller2Zipcode,
        seller2_same_address: formData.seller2SameAddress,
        owners_relationship: formData.sellersRelationship,

        // Comprador 1
        buyer1_name: formData.buyer1Name,
        buyer1_dni: formData.buyer1Dni,
        buyer1_civil_status: formData.buyer1CivilStatus,
        buyer1_matrimonial_regime: formData.buyer1MatrimonialRegime,
        buyer1_address: formData.buyer1Address,
        buyer1_street: formData.buyer1Street,
        buyer1_number: formData.buyer1Number,
        buyer1_floor_letter: formData.buyer1FloorLetter,
        buyer1_city: formData.buyer1City,
        buyer1_province: formData.buyer1Province,
        buyer1_zipcode: formData.buyer1Zipcode,

        // Comprador 2
        has_buyer2: formData.hasBuyer2,
        buyer2_name: formData.buyer2Name,
        buyer2_dni: formData.buyer2Dni,
        buyer2_civil_status: formData.buyer2CivilStatus,
        buyer2_matrimonial_regime: formData.buyer2MatrimonialRegime,
        buyer2_address: formData.buyer2Address,
        buyer2_street: formData.buyer2Street,
        buyer2_number: formData.buyer2Number,
        buyer2_floor_letter: formData.buyer2FloorLetter,
        buyer2_city: formData.buyer2City,
        buyer2_province: formData.buyer2Province,
        buyer2_zipcode: formData.buyer2Zipcode,
        buyer2_same_address: formData.buyer2SameAddress,
        buyers_relationship: formData.buyersRelationship,

        // Contrato, economía, fuero, cargas y fincas
        seller_iban: formData.sellerIban,
        notary_deadline: formData.notaryDeadline,
        jurisdiction_city: formData.jurisdictionCity,
        arras_amount_num: formData.arrasAmountNum,
        cru: formData.fincas?.[0]?.cru || property.cru || '',
        cadastral_reference: formData.fincas?.[0]?.cadastralReference || property.cadastral_reference || '',
        charges_option: formData.chargesOption,
        retention_amount: formData.retentionAmount,
        return_days: formData.returnDays,
        management_months: formData.managementMonths,
        include_kitchen_clause: formData.includeKitchenClause,
        include_furniture_clause: formData.includeFurnitureClause,
        furniture_description: formData.furnitureDescription,
        include_photo_report_clause: formData.includePhotoReportClause,
        include_mortgage_suspensive_clause: formData.includeMortgageSuspensiveClause,
        mortgage_days: formData.mortgageDays,
        mortgage_amount: formData.mortgageAmount,
        fincas_data: formData.fincas,
        arras_contract_data: formData,
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

  const handleClearDraft = async () => {
    if (!property?.id) return;
    const draftKey = `arras_draft_${property.id}`;
    localStorage.removeItem(draftKey);
    setHasRestoredDraft(false);

    try {
      await supabase.from('properties').update({
        arras_contract_data: null,
      }).eq('id', property.id);
      onSaveSuccess?.();
    } catch (err) {
      console.error("Error al limpiar borrador en Supabase:", err);
    }
  };

  const handlePrint = () => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
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
          
          <div className="flex items-center gap-3">
            {/* Botón Guardar Borrador */}
            <Button
              type="button"
              onClick={handleSaveDraft}
              className={`text-xs font-medium gap-1.5 h-8 transition-all ${
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'form' ? 'bg-primary text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Datos del Contrato
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'preview' ? 'bg-primary text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                2. Vista Previa / Imprimir
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
                      <span className="text-emerald-700">Puedes seguir editando los datos o descartar este borrador para volver a los datos por defecto del inmueble.</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearDraft}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 shrink-0 gap-1"
                  >
                    <RotateCcw size={13} /> Descartar Borrador
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
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                    Parte Vendedora (Propietarios)
                  </h3>
                  {!formData.hasSeller2 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, hasSeller2: true })}
                      className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1"
                    >
                      <UserPlus size={14} /> Añadir 2º Vendedor
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, hasSeller2: false, seller2Name: '', seller2Dni: '' })}
                      className="text-xs text-red-600 hover:bg-red-50 gap-1"
                    >
                      <Trash2 size={14} /> Quitar 2º Vendedor
                    </Button>
                  )}
                </div>

                {/* Vendedor 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                  <div className={formData.seller1CivilStatus === 'casado' ? 'md:col-span-4' : 'md:col-span-6'}>
                    <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre Vendedor 1 *</Label>
                    <Input
                      value={formData.seller1Name}
                      onChange={(e) => setFormData({ ...formData, seller1Name: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, seller1Name: formatNameWithHonorific(e.target.value) })}
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  {(() => {
                    const dniVal = validateDNI_NIE(formData.seller1Dni);
                    const isFilled = !!formData.seller1Dni?.trim();
                    return (
                      <div className="md:col-span-3">
                        <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIF Vendedor 1 *</Label>
                        <Input
                          value={formData.seller1Dni}
                          onChange={(e) => setFormData({ ...formData, seller1Dni: e.target.value })}
                          onBlur={(e) => setFormData({ ...formData, seller1Dni: cleanDniString(e.target.value) })}
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
                    );
                  })()}
                  <div className={formData.seller1CivilStatus === 'casado' ? 'md:col-span-2' : 'md:col-span-3'}>
                    <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Estado Civil Vendedor 1</Label>
                    <select
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formData.seller1CivilStatus}
                      onChange={(e) => setFormData({ ...formData, seller1CivilStatus: e.target.value as CivilStatus })}
                    >
                      <option value="soltero">Soltero/a</option>
                      <option value="casado">Casado/a</option>
                      <option value="pareja_de_hecho">Pareja de hecho (inscrita)</option>
                      <option value="divorciado">Divorciado/a</option>
                      <option value="separado">Separado/a (legalmente)</option>
                      <option value="viudo">Viudo/a</option>
                    </select>
                  </div>
                  {formData.seller1CivilStatus === 'casado' && (
                    <div className="md:col-span-3">
                      <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Régimen Matrimonial</Label>
                      <select
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={formData.seller1MatrimonialRegime || 'gananciales'}
                        onChange={(e) => setFormData({ ...formData, seller1MatrimonialRegime: e.target.value as MatrimonialRegime })}
                      >
                        <option value="gananciales">Sociedad de Gananciales</option>
                        <option value="separacion_bienes">Separación de Bienes</option>
                        <option value="participacion">Régimen de Participación</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="text-xs font-semibold text-slate-800 block">Domicilio Vendedor(es)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                    <div className="md:col-span-3">
                      <Label className="text-[11px] text-slate-600 font-medium">Domicilio (Calle / Avda / Plaza)</Label>
                      <Input
                        value={formData.seller1Street || ''}
                        onChange={(e) => updateSellerAddress('seller1Street', e.target.value)}
                        onBlur={(e) => {
                          updateSellerAddress('seller1Street', toTitleCase(e.target.value));
                          autoLookupSeller1Zipcode();
                        }}
                        placeholder="Ej: Calle Juan de Acosta"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-[11px] text-slate-600 font-medium">Número</Label>
                      <Input
                        value={formData.seller1Number || ''}
                        onChange={(e) => updateSellerAddress('seller1Number', e.target.value)}
                        onBlur={() => autoLookupSeller1Zipcode()}
                        placeholder="Ej: 6"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">Piso y Letra</Label>
                      <Input
                        value={formData.seller1FloorLetter || ''}
                        onChange={(e) => updateSellerAddress('seller1FloorLetter', e.target.value)}
                        onBlur={(e) => updateSellerAddress('seller1FloorLetter', toTitleCase(e.target.value))}
                        placeholder="Ej: Entreplanta A"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">Municipio</Label>
                      <Input
                        value={formData.seller1City || ''}
                        onChange={(e) => updateSellerAddress('seller1City', e.target.value)}
                        onBlur={(e) => {
                          updateSellerAddress('seller1City', toTitleCase(e.target.value));
                          autoLookupSeller1Zipcode();
                        }}
                        placeholder="Ej: Laguna de Duero"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">Provincia</Label>
                      <Input
                        value={formData.seller1Province || ''}
                        onChange={(e) => updateSellerAddress('seller1Province', e.target.value)}
                        onBlur={(e) => updateSellerAddress('seller1Province', toTitleCase(e.target.value))}
                        placeholder="Ej: Valladolid"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">CP (Código Postal)</Label>
                      <Input
                        value={formData.seller1Zipcode || ''}
                        onChange={(e) => updateSellerAddress('seller1Zipcode', e.target.value)}
                        placeholder="Ej: 47140"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Vendedor 2 opcional */}
                {formData.hasSeller2 && (
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                      <div className={formData.seller2CivilStatus === 'casado' ? 'md:col-span-4' : 'md:col-span-6'}>
                        <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre Vendedor 2</Label>
                        <Input
                          value={formData.seller2Name}
                          onChange={(e) => setFormData({ ...formData, seller2Name: e.target.value })}
                          onBlur={(e) => setFormData({ ...formData, seller2Name: formatNameWithHonorific(e.target.value) })}
                          placeholder="Nombre y Apellidos del 2º Vendedor"
                        />
                      </div>
                      {(() => {
                        const dniVal = validateDNI_NIE(formData.seller2Dni);
                        const isFilled = !!formData.seller2Dni?.trim();
                        return (
                          <div className="md:col-span-3">
                            <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIF Vendedor 2</Label>
                            <Input
                              value={formData.seller2Dni}
                              onChange={(e) => setFormData({ ...formData, seller2Dni: e.target.value })}
                              onBlur={(e) => setFormData({ ...formData, seller2Dni: cleanDniString(e.target.value) })}
                              placeholder="87654321Y"
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
                        );
                      })()}
                      <div className={formData.seller2CivilStatus === 'casado' ? 'md:col-span-2' : 'md:col-span-3'}>
                        <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Estado Civil Vendedor 2</Label>
                        <select
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          value={formData.seller2CivilStatus}
                          onChange={(e) => setFormData({ ...formData, seller2CivilStatus: e.target.value as CivilStatus })}
                        >
                          <option value="soltero">Soltero/a</option>
                          <option value="casado">Casado/a</option>
                          <option value="pareja_de_hecho">Pareja de hecho (inscrita)</option>
                          <option value="divorciado">Divorciado/a</option>
                          <option value="separado">Separado/a (legalmente)</option>
                          <option value="viudo">Viudo/a</option>
                        </select>
                      </div>
                      {formData.seller2CivilStatus === 'casado' && (
                        <div className="md:col-span-3">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Régimen Matrimonial</Label>
                          <select
                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={formData.seller2MatrimonialRegime || 'gananciales'}
                            onChange={(e) => setFormData({ ...formData, seller2MatrimonialRegime: e.target.value as MatrimonialRegime })}
                          >
                            <option value="gananciales">Sociedad de Gananciales</option>
                            <option value="separacion_bienes">Separación de Bienes</option>
                            <option value="participacion">Régimen de Participación</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <Label className="text-xs font-semibold text-slate-900 block mb-1">¿Qué relación o vínculo existe entre los dos Vendedores?</Label>
                      <select
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

                    {/* Dirección del 2º Vendedor */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="seller2SameAddress"
                          checked={formData.seller2SameAddress !== false}
                          onChange={(e) => {
                            const same = e.target.checked;
                            setFormData({
                              ...formData,
                              seller2SameAddress: same,
                              seller2Street: same ? formData.seller1Street : formData.seller2Street,
                              seller2Number: same ? formData.seller1Number : formData.seller2Number,
                              seller2FloorLetter: same ? formData.seller1FloorLetter : formData.seller2FloorLetter,
                              seller2City: same ? formData.seller1City : formData.seller2City,
                              seller2Province: same ? formData.seller1Province : formData.seller2Province,
                              seller2Zipcode: same ? formData.seller1Zipcode : formData.seller2Zipcode,
                              seller2Address: same ? formData.seller1Address : formData.seller2Address,
                            });
                          }}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                        <Label htmlFor="seller2SameAddress" className="text-xs font-semibold text-slate-800 cursor-pointer">
                          La dirección del 2º Vendedor es la misma que la del 1º Vendedor
                        </Label>
                      </div>

                      {formData.seller2SameAddress === false && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <Label className="text-xs font-semibold text-slate-800 block">Domicilio 2º Vendedor</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <div className="md:col-span-3">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Domicilio (Calle / Avda / Plaza)</Label>
                              <Input
                                value={formData.seller2Street || ''}
                                onChange={(e) => updateSeller2Address('seller2Street', e.target.value)}
                                onBlur={(e) => {
                                  updateSeller2Address('seller2Street', toTitleCase(e.target.value));
                                  autoLookupSeller2Zipcode();
                                }}
                                placeholder="Ej: Calle Gran Vía"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Número</Label>
                              <Input
                                value={formData.seller2Number || ''}
                                onChange={(e) => updateSeller2Address('seller2Number', e.target.value)}
                                onBlur={() => autoLookupSeller2Zipcode()}
                                placeholder="Ej: 14"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Piso y Letra</Label>
                              <Input
                                value={formData.seller2FloorLetter || ''}
                                onChange={(e) => updateSeller2Address('seller2FloorLetter', e.target.value)}
                                onBlur={(e) => updateSeller2Address('seller2FloorLetter', toTitleCase(e.target.value))}
                                placeholder="Ej: 3º B"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Municipio</Label>
                              <Input
                                value={formData.seller2City || ''}
                                onChange={(e) => updateSeller2Address('seller2City', e.target.value)}
                                onBlur={(e) => {
                                  updateSeller2Address('seller2City', toTitleCase(e.target.value));
                                  autoLookupSeller2Zipcode();
                                }}
                                placeholder="Ej: Madrid"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Provincia</Label>
                              <Input
                                value={formData.seller2Province || ''}
                                onChange={(e) => updateSeller2Address('seller2Province', e.target.value)}
                                onBlur={(e) => updateSeller2Address('seller2Province', toTitleCase(e.target.value))}
                                placeholder="Ej: Madrid"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">CP (Código Postal)</Label>
                              <Input
                                value={formData.seller2Zipcode || ''}
                                onChange={(e) => updateSeller2Address('seller2Zipcode', e.target.value)}
                                placeholder="Ej: 28013"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 3: Parte Compradora */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                    Parte Compradora
                  </h3>
                  {!formData.hasBuyer2 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, hasBuyer2: true })}
                      className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1"
                    >
                      <UserPlus size={14} /> Añadir 2º Comprador
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, hasBuyer2: false, buyer2Name: '', buyer2Dni: '' })}
                      className="text-xs text-red-600 hover:bg-red-50 gap-1"
                    >
                      <Trash2 size={14} /> Quitar 2º Comprador
                    </Button>
                  )}
                </div>

                {/* Comprador 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                  <div className={formData.buyer1CivilStatus === 'casado' ? 'md:col-span-4' : 'md:col-span-6'}>
                    <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre Comprador 1 *</Label>
                    <Input
                      value={formData.buyer1Name}
                      onChange={(e) => setFormData({ ...formData, buyer1Name: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, buyer1Name: formatNameWithHonorific(e.target.value) })}
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  {(() => {
                    const dniVal = validateDNI_NIE(formData.buyer1Dni);
                    const isFilled = !!formData.buyer1Dni?.trim();
                    return (
                      <div className="md:col-span-3">
                        <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIF Comprador 1 *</Label>
                        <Input
                          value={formData.buyer1Dni}
                          onChange={(e) => setFormData({ ...formData, buyer1Dni: e.target.value })}
                          onBlur={(e) => setFormData({ ...formData, buyer1Dni: cleanDniString(e.target.value) })}
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
                    );
                  })()}
                  <div className={formData.buyer1CivilStatus === 'casado' ? 'md:col-span-2' : 'md:col-span-3'}>
                    <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Estado Civil Comprador 1</Label>
                    <select
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={formData.buyer1CivilStatus}
                      onChange={(e) => setFormData({ ...formData, buyer1CivilStatus: e.target.value as CivilStatus })}
                    >
                      <option value="soltero">Soltero/a</option>
                      <option value="casado">Casado/a</option>
                      <option value="pareja_de_hecho">Pareja de hecho (inscrita)</option>
                      <option value="divorciado">Divorciado/a</option>
                      <option value="separado">Separado/a (legalmente)</option>
                      <option value="viudo">Viudo/a</option>
                    </select>
                  </div>
                  {formData.buyer1CivilStatus === 'casado' && (
                    <div className="md:col-span-3">
                      <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Régimen Matrimonial</Label>
                      <select
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={formData.buyer1MatrimonialRegime || 'gananciales'}
                        onChange={(e) => setFormData({ ...formData, buyer1MatrimonialRegime: e.target.value as MatrimonialRegime })}
                      >
                        <option value="gananciales">Sociedad de Gananciales</option>
                        <option value="separacion_bienes">Separación de Bienes</option>
                        <option value="participacion">Régimen de Participación</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Label className="text-xs font-semibold text-slate-800 block">Domicilio Comprador(es)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200">
                    <div className="md:col-span-3">
                      <Label className="text-[11px] text-slate-600 font-medium">Domicilio (Calle / Avda / Plaza)</Label>
                      <Input
                        value={formData.buyer1Street || ''}
                        onChange={(e) => updateBuyerAddress('buyer1Street', e.target.value)}
                        onBlur={(e) => {
                          updateBuyerAddress('buyer1Street', toTitleCase(e.target.value));
                          autoLookupBuyer1Zipcode();
                        }}
                        placeholder="Ej: Plaza Ribera de Castilla"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-[11px] text-slate-600 font-medium">Número</Label>
                      <Input
                        value={formData.buyer1Number || ''}
                        onChange={(e) => updateBuyerAddress('buyer1Number', e.target.value)}
                        onBlur={() => autoLookupBuyer1Zipcode()}
                        placeholder="Ej: 12"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">Piso y Letra</Label>
                      <Input
                        value={formData.buyer1FloorLetter || ''}
                        onChange={(e) => updateBuyerAddress('buyer1FloorLetter', e.target.value)}
                        onBlur={(e) => updateBuyerAddress('buyer1FloorLetter', toTitleCase(e.target.value))}
                        placeholder="Ej: 4º D"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">Municipio</Label>
                      <Input
                        value={formData.buyer1City || ''}
                        onChange={(e) => updateBuyerAddress('buyer1City', e.target.value)}
                        onBlur={(e) => {
                          updateBuyerAddress('buyer1City', toTitleCase(e.target.value));
                          autoLookupBuyer1Zipcode();
                        }}
                        placeholder="Ej: Valladolid"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">Provincia</Label>
                      <Input
                        value={formData.buyer1Province || ''}
                        onChange={(e) => updateBuyerAddress('buyer1Province', e.target.value)}
                        onBlur={(e) => updateBuyerAddress('buyer1Province', toTitleCase(e.target.value))}
                        placeholder="Ej: Valladolid"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-slate-600 font-medium">CP (Código Postal)</Label>
                      <Input
                        value={formData.buyer1Zipcode || ''}
                        onChange={(e) => updateBuyerAddress('buyer1Zipcode', e.target.value)}
                        placeholder="Ej: 47001"
                        className="bg-white text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Comprador 2 */}
                {formData.hasBuyer2 && (
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                      <div className={formData.buyer2CivilStatus === 'casado' ? 'md:col-span-4' : 'md:col-span-6'}>
                        <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Nombre Comprador 2</Label>
                        <Input
                          value={formData.buyer2Name}
                          onChange={(e) => setFormData({ ...formData, buyer2Name: e.target.value })}
                          onBlur={(e) => setFormData({ ...formData, buyer2Name: formatNameWithHonorific(e.target.value) })}
                          placeholder="Nombre y Apellidos del 2º Comprador"
                        />
                      </div>
                      {(() => {
                        const dniVal = validateDNI_NIE(formData.buyer2Dni);
                        const isFilled = !!formData.buyer2Dni?.trim();
                        return (
                          <div className="md:col-span-3">
                            <Label className="text-xs font-semibold text-slate-800 whitespace-nowrap">DNI / NIF Comprador 2</Label>
                            <Input
                              value={formData.buyer2Dni}
                              onChange={(e) => setFormData({ ...formData, buyer2Dni: e.target.value })}
                              onBlur={(e) => setFormData({ ...formData, buyer2Dni: cleanDniString(e.target.value) })}
                              placeholder="98765432W"
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
                        );
                      })()}
                      <div className={formData.buyer2CivilStatus === 'casado' ? 'md:col-span-2' : 'md:col-span-3'}>
                        <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Estado Civil Comprador 2</Label>
                        <select
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          value={formData.buyer2CivilStatus}
                          onChange={(e) => setFormData({ ...formData, buyer2CivilStatus: e.target.value as CivilStatus })}
                        >
                          <option value="soltero">Soltero/a</option>
                          <option value="casado">Casado/a</option>
                          <option value="pareja_de_hecho">Pareja de hecho (inscrita)</option>
                          <option value="divorciado">Divorciado/a</option>
                          <option value="separado">Separado/a (legalmente)</option>
                          <option value="viudo">Viudo/a</option>
                        </select>
                      </div>
                      {formData.buyer2CivilStatus === 'casado' && (
                        <div className="md:col-span-3">
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Régimen Matrimonial</Label>
                          <select
                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={formData.buyer2MatrimonialRegime || 'gananciales'}
                            onChange={(e) => setFormData({ ...formData, buyer2MatrimonialRegime: e.target.value as MatrimonialRegime })}
                          >
                            <option value="gananciales">Sociedad de Gananciales</option>
                            <option value="separacion_bienes">Separación de Bienes</option>
                            <option value="participacion">Régimen de Participación</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <Label className="text-xs font-semibold text-slate-900 block mb-1">¿Qué relación o vínculo existe entre los dos Compradores?</Label>
                      <select
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

                    {/* Dirección del 2º Comprador */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="buyer2SameAddress"
                          checked={formData.buyer2SameAddress !== false}
                          onChange={(e) => {
                            const same = e.target.checked;
                            setFormData({
                              ...formData,
                              buyer2SameAddress: same,
                              buyer2Street: same ? formData.buyer1Street : formData.buyer2Street,
                              buyer2Number: same ? formData.buyer1Number : formData.buyer2Number,
                              buyer2FloorLetter: same ? formData.buyer1FloorLetter : formData.buyer2FloorLetter,
                              buyer2City: same ? formData.buyer1City : formData.buyer2City,
                              buyer2Province: same ? formData.buyer1Province : formData.buyer2Province,
                              buyer2Zipcode: same ? formData.buyer1Zipcode : formData.buyer2Zipcode,
                              buyer2Address: same ? formData.buyer1Address : formData.buyer2Address,
                            });
                          }}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                        />
                        <Label htmlFor="buyer2SameAddress" className="text-xs font-semibold text-slate-800 cursor-pointer">
                          La dirección del 2º Comprador es la misma que la del 1º Comprador
                        </Label>
                      </div>

                      {formData.buyer2SameAddress === false && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <Label className="text-xs font-semibold text-slate-800 block">Domicilio 2º Comprador</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <div className="md:col-span-3">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Domicilio (Calle / Avda / Plaza)</Label>
                              <Input
                                value={formData.buyer2Street || ''}
                                onChange={(e) => updateBuyer2Address('buyer2Street', e.target.value)}
                                onBlur={(e) => {
                                  updateBuyer2Address('buyer2Street', toTitleCase(e.target.value));
                                  autoLookupBuyer2Zipcode();
                                }}
                                placeholder="Ej: Calle Mayor"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Número</Label>
                              <Input
                                value={formData.buyer2Number || ''}
                                onChange={(e) => updateBuyer2Address('buyer2Number', e.target.value)}
                                onBlur={() => autoLookupBuyer2Zipcode()}
                                placeholder="Ej: 5"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Piso y Letra</Label>
                              <Input
                                value={formData.buyer2FloorLetter || ''}
                                onChange={(e) => updateBuyer2Address('buyer2FloorLetter', e.target.value)}
                                onBlur={(e) => updateBuyer2Address('buyer2FloorLetter', toTitleCase(e.target.value))}
                                placeholder="Ej: 1º C"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Municipio</Label>
                              <Input
                                value={formData.buyer2City || ''}
                                onChange={(e) => updateBuyer2Address('buyer2City', e.target.value)}
                                onBlur={(e) => {
                                  updateBuyer2Address('buyer2City', toTitleCase(e.target.value));
                                  autoLookupBuyer2Zipcode();
                                }}
                                placeholder="Ej: Valladolid"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">Provincia</Label>
                              <Input
                                value={formData.buyer2Province || ''}
                                onChange={(e) => updateBuyer2Address('buyer2Province', e.target.value)}
                                onBlur={(e) => updateBuyer2Address('buyer2Province', toTitleCase(e.target.value))}
                                placeholder="Ej: Valladolid"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-[11px] text-slate-600 font-medium whitespace-nowrap">CP (Código Postal)</Label>
                              <Input
                                value={formData.buyer2Zipcode || ''}
                                onChange={(e) => updateBuyer2Address('buyer2Zipcode', e.target.value)}
                                placeholder="Ej: 47001"
                                className="bg-white text-xs h-9"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 4: Fincas Registrales del Inmueble (Soporte Multi-Finca) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
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
                    <div key={finca.id || index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 relative">
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
                          <Label className="text-xs font-medium text-slate-700 whitespace-nowrap">Referencia Catastral</Label>
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
                            type="number"
                            value={finca.priceAmount || ''}
                            onChange={(e) => updateFincaPrice(finca.id, parseFloat(e.target.value) || 0)}
                            placeholder="Ej: 220000"
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
                                autoLookupFincaZipcode(finca.id, finca.street, finca.city, finca.province, finca.zipcode);
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
                              onBlur={() => autoLookupFincaZipcode(finca.id, finca.street, finca.city, finca.province, finca.zipcode)}
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
                                autoLookupFincaZipcode(finca.id, finca.street, finca.city, finca.province, finca.zipcode);
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
                        <Label className="text-xs font-medium text-slate-700">Descripción Detallada (Superficie, Ref. Catastral...)</Label>
                        <textarea
                          rows={2}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          value={finca.propertyDescription}
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

              {/* Sección 5: Estado de Cargas (Selector de 3 Opciones) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
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
                      <span className="font-bold text-sm text-slate-900">2. GRAVADO CON HIPOTECA A CANCELAR EN EL MISMO ACTO</span>
                      <p className="text-xs text-slate-500 mt-0.5">Se cancela económica y registralmente en la escritura con presencia de la entidad acreedora.</p>
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
                      <span className="font-bold text-sm text-slate-900">3. GRAVADO CON HIPOTECA A CANCELAR PREVIAMENTE (RETENCIÓN)</span>
                      <p className="text-xs text-slate-500 mt-0.5">Hipoteca cancelada económicamente pero pendiente de inscripción registral. Se autoriza retención sobre el precio.</p>
                    </div>
                  </label>
                </div>

                {formData.chargesOption === '3' && (
                  <div className="mt-3 p-4 bg-amber-50/70 border border-amber-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-amber-900">Cantidad Retención</Label>
                      <Input
                        value={formData.retentionAmount}
                        onChange={(e) => setFormData({ ...formData, retentionAmount: e.target.value })}
                        placeholder="Ej: 3.000 €"
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
                )}
              </div>

              {/* Sección 6: Cláusulas Adicionales */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">6</span>
                  Cláusulas Adicionales (Mobiliario y Fotoreportaje)
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
                        <Label className="text-xs font-medium text-slate-700">Descripción / Lista del Mobiliario Incluido</Label>
                        <textarea
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
                              {availablePhotos.map((photo, idx) => {
                                const isSelected = selectedPhotoIds.includes(photo.id);
                                return (
                                  <div
                                    key={photo.id}
                                    onClick={() => togglePhoto(photo.id)}
                                    className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all group ${
                                      isSelected
                                        ? 'border-primary shadow-sm ring-2 ring-primary/20'
                                        : 'border-slate-200 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={`Foto ${idx + 1}`}
                                      className="w-full h-24 object-cover"
                                    />
                                    <div className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-colors ${
                                      isSelected ? 'bg-primary text-white shadow-sm' : 'bg-slate-900/60 text-white'
                                    }`}>
                                      {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                                    </div>
                                    <div className="p-1 bg-white text-[10px] truncate text-slate-600 font-medium text-center border-t border-slate-100">
                                      {photo.title || `Fotografía ${idx + 1}`}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 7: Condiciones Económicas */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">7</span>
                  Condiciones Económicas (Arras Penitenciales)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-800">Precio Total Venta (€) *</Label>
                    <Input
                      type="number"
                      value={formData.totalPriceNum !== undefined ? formData.totalPriceNum : (extractNumericPrice(formData.totalPrice) || '')}
                      onChange={(e) => handleTotalPriceNumChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej: 250000"
                      className="font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-800">Importe de Arras (€) *</Label>
                    <Input
                      type="number"
                      value={formData.arrasAmountNum !== undefined ? formData.arrasAmountNum : (extractNumericPrice(formData.arrasAmount) || '')}
                      onChange={(e) => handleArrasAmountNumChange(parseFloat(e.target.value) || 0)}
                      placeholder="Ej: 25000"
                      className="font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-800">Importe Restante Escritura (€)</Label>
                    <Input
                      type="number"
                      readOnly
                      disabled
                      value={formData.remainingAmountNum !== undefined ? formData.remainingAmountNum : (extractNumericPrice(formData.remainingAmount) || 0)}
                      placeholder="Autoculculado"
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
                        className={`font-semibold transition-all ${
                          isFilled
                            ? ibanValidation.isValid
                              ? 'border-emerald-500 focus:ring-emerald-500/20 text-emerald-950 bg-emerald-50/10'
                              : 'border-red-500 focus:ring-red-500/20 text-red-950 bg-red-50/20'
                            : 'border-slate-200'
                        }`}
                      />
                      {isFilled ? (
                        <p className={`text-[11px] font-medium flex items-center gap-1 ${
                          ibanValidation.isValid ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {ibanValidation.isValid ? (
                            <span>✓ {ibanValidation.message} ({ibanValidation.formatted})</span>
                          ) : (
                            <span>⚠️ {ibanValidation.message}</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400">
                          Introduce el número de cuenta formato IBAN (ej: ES21 1234 5678 9012 3456 7890)
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Sección 8: Notaría y Fuero */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">8</span>
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
                  className={`gap-2 text-xs font-medium transition-all ${
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
                  onClick={() => setActiveTab('preview')}
                  className="bg-primary hover:bg-primary/95 text-white gap-2 font-medium px-6 py-2 text-xs"
                >
                  Ver Documento Generado &rarr;
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
