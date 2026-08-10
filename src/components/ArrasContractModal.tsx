import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrasContractDocument, toTitleCase, type ArrasData, type CivilStatus, type MatrimonialRegime, type RelationshipType, type FincaItem } from './ArrasContractDocument';
import { X, Printer, Copy, Check, FileText, UserPlus, Trash2, CheckSquare, Square, Image, Plus, AlertTriangle, CheckCircle2, Calculator, FileDown, Save, RotateCcw, BookmarkCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  property: any;
}

export const ArrasContractModal: React.FC<Props> = ({ isOpen, onClose, property }) => {
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

  const validateDNI_NIE = (docStr: string): { isValid: boolean; message: string; formatted: string } => {
    if (!docStr || !docStr.trim()) {
      return { isValid: false, message: 'El documento de identidad es requerido', formatted: '' };
    }

    const clean = docStr.replace(/[\s-]/g, '').toUpperCase();
    const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';

    const dniRegex = /^(\d{8})([A-Z])$/;
    const nieRegex = /^([XYZ])(\d{7})([A-Z])$/;
    const cifRegex = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/;

    if (dniRegex.test(clean)) {
      const num = parseInt(clean.substring(0, 8), 10);
      const letter = clean.charAt(8);
      const expectedLetter = validLetters[num % 23];

      if (letter !== expectedLetter) {
        return {
          isValid: false,
          message: `Letra de DNI incorrecta (${letter}). Para el nº ${num} corresponde la letra ${expectedLetter}.`,
          formatted: `${clean.substring(0, 8)}-${letter}`,
        };
      }
      return {
        isValid: true,
        message: 'DNI válido y verificado',
        formatted: `${clean.substring(0, 8)}-${letter}`,
      };
    }

    if (nieRegex.test(clean)) {
      const prefix = clean.charAt(0);
      let numericPrefix = '0';
      if (prefix === 'Y') numericPrefix = '1';
      if (prefix === 'Z') numericPrefix = '2';

      const numStr = numericPrefix + clean.substring(1, 8);
      const num = parseInt(numStr, 10);
      const letter = clean.charAt(8);
      const expectedLetter = validLetters[num % 23];

      if (letter !== expectedLetter) {
        return {
          isValid: false,
          message: `Letra de NIE incorrecta (${letter}). Corresponde la letra ${expectedLetter}.`,
          formatted: clean,
        };
      }
      return {
        isValid: true,
        message: 'NIE válido y verificado',
        formatted: clean,
      };
    }

    if (cifRegex.test(clean)) {
      return {
        isValid: true,
        message: 'CIF válido y verificado',
        formatted: clean,
      };
    }

    if (/^\d{1,8}$/.test(clean)) {
      return {
        isValid: false,
        message: `Falta la letra final (${clean.length}/8 dígitos).`,
        formatted: clean,
      };
    }

    return {
      isValid: false,
      message: 'Formato no válido (esperado: 8 dígitos + letra final. Ej: 12345678Z o NIE X1234567Z)',
      formatted: clean,
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
    hasSeller2: property?.has_owner2 || false,
    seller2Name: property?.owner2_name || '',
    seller2Dni: property?.owner2_dni || '',
    seller2CivilStatus: (property?.owner2_civil_status as CivilStatus) || 'soltero',
    seller2MatrimonialRegime: 'gananciales',
    sellersRelationship: (property?.owners_relationship as RelationshipType) || 'ninguna',

    // Comprador
    buyer1Name: '',
    buyer1Dni: '',
    buyer1CivilStatus: 'soltero',
    buyer1MatrimonialRegime: 'gananciales',
    buyer1Address: '',
    hasBuyer2: false,
    buyer2Name: '',
    buyer2Dni: '',
    buyer2CivilStatus: 'soltero',
    buyer2MatrimonialRegime: 'gananciales',
    buyersRelationship: 'ninguna',

    // Fincas (1 o varias)
    fincas: [
      {
        id: 'finca-1',
        title: property ? `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} principal` : 'Vivienda principal',
        registryNumber: '',
        registryCity: property?.city || 'Valladolid',
        propertyAddress: property?.address_hidden ? `${property.address_hidden}, ${property.city} (${property.province})` : '',
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

  const handleRemainingAmountNumChange = (newVal: number) => {
    setFormData((prev) => ({
      ...prev,
      remainingAmountNum: newVal,
      remainingAmount: formatCurrency(newVal),
    }));
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

  // Cargar borrador si existe al abrir el modal
  useEffect(() => {
    if (isOpen && property?.id) {
      const draftKey = `arras_draft_${property.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setFormData(parsed);
            setHasRestoredDraft(true);
            return;
          }
        } catch (e) {
          console.error("Error al restaurar borrador:", e);
        }
      }
    }
  }, [isOpen, property?.id]);

  const handleSaveDraft = () => {
    if (!property?.id) return;
    const draftKey = `arras_draft_${property.id}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));
    setDraftSaved(true);
    setHasRestoredDraft(true);
    setTimeout(() => setDraftSaved(false), 3500);
  };

  const handleClearDraft = () => {
    if (!property?.id) return;
    const draftKey = `arras_draft_${property.id}`;
    localStorage.removeItem(draftKey);
    setHasRestoredDraft(false);

    if (property) {
      const price = property.price || 0;
      const arras = Math.round(price * 0.1);
      const rest = price - arras;

      const mainFinca: FincaItem = {
        id: 'finca-1',
        title: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} principal`,
        registryNumber: '',
        registryCity: property.city || 'Valladolid',
        propertyAddress: `${property.address_hidden}, ${property.city} (${property.province})`,
        propertyDescription: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.internal_reference || '[Pendiente]'}.`,
      };

      setFormData({
        city: property.city || 'Valladolid',
        dateStr: formattedTodayDate,
        seller1Name: property.owner_name || '',
        seller1Dni: property.owner_dni || '',
        seller1CivilStatus: (property.owner_civil_status as CivilStatus) || 'soltero',
        seller1MatrimonialRegime: (property.owner_matrimonial_regime as MatrimonialRegime) || 'gananciales',
        seller1Address: property.owner_address ? `${property.owner_address}, ${property.owner_city || property.city || ''}` : '',
        hasSeller2: property.has_owner2 || false,
        seller2Name: property.owner2_name || '',
        seller2Dni: property.owner2_dni || '',
        seller2CivilStatus: (property.owner2_civil_status as CivilStatus) || 'soltero',
        seller2MatrimonialRegime: 'gananciales',
        sellersRelationship: (property.owners_relationship as RelationshipType) || 'ninguna',
        buyer1Name: '',
        buyer1Dni: '',
        buyer1CivilStatus: 'soltero',
        buyer1MatrimonialRegime: 'gananciales',
        buyer1Address: '',
        hasBuyer2: false,
        buyer2Name: '',
        buyer2Dni: '',
        buyer2CivilStatus: 'soltero',
        buyer2MatrimonialRegime: 'gananciales',
        buyersRelationship: 'ninguna',
        fincas: [mainFinca],
        registryNumber: '',
        registryCity: property.city || 'Valladolid',
        propertyAddress: `${property.address_hidden}, ${property.city} (${property.province})`,
        propertyDescription: `${property.title || 'Vivienda'}. ${property.area_built || 0} m² construidos, ${property.area_useful || 0} m² útiles. Ref. Catastral: ${property.internal_reference || '[Pendiente]'}.`,
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
        jurisdictionCity: property.city || 'Valladolid',
      });
    }
  };

  // Re-sync when property changes
  useEffect(() => {
    if (property && !hasRestoredDraft) {
      const price = property.price || 0;
      const arras = Math.round(price * 0.1);
      const rest = price - arras;

      const mainFinca: FincaItem = {
        id: 'finca-1',
        title: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} principal`,
        registryNumber: '',
        registryCity: property.city || 'Valladolid',
        propertyAddress: `${property.address_hidden}, ${property.city} (${property.province})`,
        propertyDescription: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.internal_reference || '[Pendiente]'}.`,
      };

      setFormData((prev) => ({
        ...prev,
        city: property.city || 'Valladolid',
        seller1Name: property.owner_name || prev.seller1Name,
        seller1Dni: property.owner_dni || prev.seller1Dni,
        seller1CivilStatus: (property.owner_civil_status as CivilStatus) || prev.seller1CivilStatus,
        seller1MatrimonialRegime: (property.owner_matrimonial_regime as MatrimonialRegime) || prev.seller1MatrimonialRegime,
        seller1Address: property.owner_address ? `${property.owner_address}, ${property.owner_city || property.city || ''}` : prev.seller1Address,
        hasSeller2: property.has_owner2 !== undefined ? property.has_owner2 : prev.hasSeller2,
        seller2Name: property.owner2_name || prev.seller2Name,
        seller2Dni: property.owner2_dni || prev.seller2Dni,
        seller2CivilStatus: (property.owner2_civil_status as CivilStatus) || prev.seller2CivilStatus,
        sellersRelationship: (property.owners_relationship as RelationshipType) || prev.sellersRelationship,
        fincas: prev.fincas && prev.fincas.length > 0 ? [ { ...mainFinca, ...prev.fincas[0] }, ...prev.fincas.slice(1) ] : [mainFinca],
        registryCity: property.city || 'Valladolid',
        propertyAddress: `${property.address_hidden}, ${property.city} (${property.province})`,
        propertyDescription: `${property.type ? property.type.toUpperCase() : 'VIVIENDA'} sita en ${property.address_hidden}. Consta de ${property.area_built || 0} m² construidos (${property.area_useful || 0} m² útiles). Ref. Catastral: ${property.internal_reference || '[Pendiente]'}.`,
        totalPrice: price ? formatCurrency(price) : prev.totalPrice,
        arrasAmount: price ? formatCurrency(arras) : prev.arrasAmount,
        remainingAmount: price ? formatCurrency(rest) : prev.remainingAmount,
        jurisdictionCity: property.city || 'Valladolid',
      }));
    }
  }, [property]);

  const handlePriceChange = (newPriceNum: number) => {
    const arras = Math.round(newPriceNum * 0.1);
    const rest = newPriceNum - arras;
    setFormData((prev) => ({
      ...prev,
      totalPrice: formatCurrency(newPriceNum),
      arrasAmount: formatCurrency(arras),
      remainingAmount: formatCurrency(rest),
    }));
  };

  const handleArrasChange = (newArrasNum: number) => {
    const rawPrice = property?.price || 0;
    const rest = Math.max(0, rawPrice - newArrasNum);
    setFormData((prev) => ({
      ...prev,
      arrasAmount: formatCurrency(newArrasNum),
      remainingAmount: formatCurrency(rest),
    }));
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Nombre Vendedor 1 *</Label>
                    <Input
                      value={formData.seller1Name}
                      onChange={(e) => setFormData({ ...formData, seller1Name: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, seller1Name: toTitleCase(e.target.value) })}
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  {(() => {
                    const dniVal = validateDNI_NIE(formData.seller1Dni);
                    const isFilled = !!formData.seller1Dni?.trim();
                    return (
                      <div>
                        <Label className="text-xs font-semibold text-slate-800">DNI / NIF Vendedor 1 *</Label>
                        <Input
                          value={formData.seller1Dni}
                          onChange={(e) => setFormData({ ...formData, seller1Dni: e.target.value })}
                          placeholder="12345678X"
                          className={`font-semibold uppercase ${
                            isFilled
                              ? dniVal.isValid
                                ? 'border-emerald-500 text-emerald-950 bg-emerald-50/10'
                                : 'border-red-500 text-red-950 bg-red-50/20'
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
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Estado Civil Vendedor 1</Label>
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
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Régimen Matrimonial</Label>
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

                <div>
                  <Label className="text-xs font-medium text-slate-700">Domicilio Vendedor(es)</Label>
                  <Input
                    value={formData.seller1Address}
                    onChange={(e) => setFormData({ ...formData, seller1Address: e.target.value })}
                    onBlur={(e) => setFormData({ ...formData, seller1Address: toTitleCase(e.target.value) })}
                    placeholder="Calle, Número, Ciudad"
                  />
                </div>

                {/* Vendedor 2 opcional */}
                {formData.hasSeller2 && (
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Nombre Vendedor 2</Label>
                        <Input
                          value={formData.seller2Name}
                          onChange={(e) => setFormData({ ...formData, seller2Name: e.target.value })}
                          onBlur={(e) => setFormData({ ...formData, seller2Name: toTitleCase(e.target.value) })}
                          placeholder="Nombre y Apellidos del 2º Vendedor"
                        />
                      </div>
                      {(() => {
                        const dniVal = validateDNI_NIE(formData.seller2Dni);
                        const isFilled = !!formData.seller2Dni?.trim();
                        return (
                          <div>
                            <Label className="text-xs font-semibold text-slate-800">DNI / NIF Vendedor 2</Label>
                            <Input
                              value={formData.seller2Dni}
                              onChange={(e) => setFormData({ ...formData, seller2Dni: e.target.value })}
                              placeholder="87654321Y"
                              className={`font-semibold uppercase ${
                                isFilled
                                  ? dniVal.isValid
                                    ? 'border-emerald-500 text-emerald-950 bg-emerald-50/10'
                                    : 'border-red-500 text-red-950 bg-red-50/20'
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
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Estado Civil Vendedor 2</Label>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Nombre Comprador 1 *</Label>
                    <Input
                      value={formData.buyer1Name}
                      onChange={(e) => setFormData({ ...formData, buyer1Name: e.target.value })}
                      onBlur={(e) => setFormData({ ...formData, buyer1Name: toTitleCase(e.target.value) })}
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  {(() => {
                    const dniVal = validateDNI_NIE(formData.buyer1Dni);
                    const isFilled = !!formData.buyer1Dni?.trim();
                    return (
                      <div>
                        <Label className="text-xs font-semibold text-slate-800">DNI / NIF Comprador 1 *</Label>
                        <Input
                          value={formData.buyer1Dni}
                          onChange={(e) => setFormData({ ...formData, buyer1Dni: e.target.value })}
                          placeholder="12345678Z"
                          className={`font-semibold uppercase ${
                            isFilled
                              ? dniVal.isValid
                                ? 'border-emerald-500 text-emerald-950 bg-emerald-50/10'
                                : 'border-red-500 text-red-950 bg-red-50/20'
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
                  <div>
                    <Label className="text-xs font-medium text-slate-700">Estado Civil Comprador 1</Label>
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
                    <div>
                      <Label className="text-xs font-medium text-slate-700">Régimen Matrimonial</Label>
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

                <div>
                  <Label className="text-xs font-medium text-slate-700">Domicilio Comprador(es)</Label>
                  <Input
                    value={formData.buyer1Address}
                    onChange={(e) => setFormData({ ...formData, buyer1Address: e.target.value })}
                    onBlur={(e) => setFormData({ ...formData, buyer1Address: toTitleCase(e.target.value) })}
                    placeholder="Calle, Número, Municipio, Código Postal"
                  />
                </div>

                {/* Comprador 2 */}
                {formData.hasBuyer2 && (
                  <div className="pt-3 border-t border-dashed border-slate-200 space-y-4 bg-slate-50/70 p-4 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Nombre Comprador 2</Label>
                        <Input
                          value={formData.buyer2Name}
                          onChange={(e) => setFormData({ ...formData, buyer2Name: e.target.value })}
                          onBlur={(e) => setFormData({ ...formData, buyer2Name: toTitleCase(e.target.value) })}
                          placeholder="Nombre y Apellidos del 2º Comprador"
                        />
                      </div>
                      {(() => {
                        const dniVal = validateDNI_NIE(formData.buyer2Dni);
                        const isFilled = !!formData.buyer2Dni?.trim();
                        return (
                          <div>
                            <Label className="text-xs font-semibold text-slate-800">DNI / NIF Comprador 2</Label>
                            <Input
                              value={formData.buyer2Dni}
                              onChange={(e) => setFormData({ ...formData, buyer2Dni: e.target.value })}
                              placeholder="98765432W"
                              className={`font-semibold uppercase ${
                                isFilled
                                  ? dniVal.isValid
                                    ? 'border-emerald-500 text-emerald-950 bg-emerald-50/10'
                                    : 'border-red-500 text-red-950 bg-red-50/20'
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
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Estado Civil Comprador 2</Label>
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Denominación / Elemento</Label>
                          <Input
                            value={finca.title}
                            onChange={(e) => updateFinca(finca.id, 'title', e.target.value)}
                            onBlur={(e) => updateFinca(finca.id, 'title', toTitleCase(e.target.value))}
                            placeholder="Ej: Vivienda, Garaje nº 12, Trastero..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Nº Finca Registral *</Label>
                          <Input
                            value={finca.registryNumber}
                            onChange={(e) => updateFinca(finca.id, 'registryNumber', e.target.value)}
                            placeholder="Ej: 14.520"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-700">Registro de la Propiedad</Label>
                          <Input
                            value={finca.registryCity}
                            onChange={(e) => updateFinca(finca.id, 'registryCity', e.target.value)}
                            onBlur={(e) => updateFinca(finca.id, 'registryCity', toTitleCase(e.target.value))}
                            placeholder="Ej: Valladolid Nº 3"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-primary">Precio Finca en Número (€) *</Label>
                          <Input
                            type="number"
                            value={finca.priceAmount || ''}
                            onChange={(e) => updateFincaPrice(finca.id, parseFloat(e.target.value) || 0)}
                            placeholder="Ej: 220000"
                            className="font-semibold text-slate-900 border-primary/40 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-slate-700">Dirección Completa de la Finca</Label>
                        <Input
                          value={finca.propertyAddress}
                          onChange={(e) => updateFinca(finca.id, 'propertyAddress', e.target.value)}
                          onBlur={(e) => updateFinca(finca.id, 'propertyAddress', toTitleCase(e.target.value))}
                          placeholder="Calle, Número, Planta, Municipio"
                        />
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
