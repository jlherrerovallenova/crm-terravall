import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { PropertyDocument, DocumentCategory, DocumentationEmail } from '@/schema/property.schema';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  Trash2, 
  Eye, 
  Download, 
  Plus, 
  FileCheck, 
  ShieldCheck, 
  Users, 
  File, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Loader2,
  FolderOpen,
  Ban,
  RotateCcw,
  Send,
  History,
  Mail,
  Calendar,
  Building2,
  Landmark,
  Briefcase,
  User,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SendDocumentationModal } from './SendDocumentationModal';
import { fetchDocumentationEmailHistory } from '@/services/emailDocumentationService';

interface PropertyDocumentsManagerProps {
  propertyId: string;
  propertyTitle?: string;
  propertyData?: any;
  onDocumentsUpdated?: (count: number) => void;
}

interface StandardDocDefinition {
  type: string;
  title: string;
  description: string;
  requiredForSale?: boolean;
}

const SELLER_DOCUMENTS: StandardDocDefinition[] = [
  {
    type: 'vendedor_dni',
    title: 'DNI / NIE / Pasaporte de los vendedores',
    description: 'Documento Nacional de Identidad, NIE o Pasaporte en vigor de todos los propietarios o titulares registrales de la vivienda.',
    requiredForSale: true
  },
  {
    type: 'vendedor_escritura',
    title: 'Título de propiedad (Escritura pública)',
    description: 'Documento notarial que acredita fehacientemente que el vendedor es el legítimo propietario de la vivienda.',
    requiredForSale: true
  },
  {
    type: 'vendedor_nota_simple',
    title: 'Nota simple informativa del Registro de la Propiedad',
    description: 'Permite comprobar quién es el titular actual, si la vivienda está libre de cargas, hipotecas, embargos o afecciones fiscales.',
    requiredForSale: true
  },
  {
    type: 'vendedor_cee',
    title: 'Certificado de eficiencia energética (CEE)',
    description: 'Etiqueta y registro oficial obligatorio en vigor que acredita la calificación energética del inmueble.',
    requiredForSale: true
  },
  {
    type: 'vendedor_ibi',
    title: 'Último recibo del Impuesto sobre Bienes Inmuebles (IBI)',
    description: 'Justificante acreditativo del pago del impuesto municipal del año en curso o último ejercicio liquidado y su referencia catastral.',
    requiredForSale: true
  },
  {
    type: 'vendedor_rsu',
    title: 'Último recibo de la Tasa de RSU',
    description: 'Justificante de pago de la Tasa por Recogida de Residuos Sólidos Urbanos (basuras).',
    requiredForSale: true
  },
  {
    type: 'vendedor_comunidad',
    title: 'Certificado de estar al corriente con la comunidad de propietarios',
    description: 'Certificación oficial emitida y firmada por el administrador/secretario con el visto bueno del presidente de la comunidad de propietarios.',
    requiredForSale: true
  },
  {
    type: 'vendedor_deuda_hipoteca',
    title: 'Certificado de deuda pendiente (si hay hipoteca)',
    description: 'Certificado bancario de saldo cero o pendiente emitido por la entidad financiera para su cancelación económica y notarial.',
    requiredForSale: false
  },
  {
    type: 'vendedor_suministros',
    title: 'Últimos recibos de suministros (agua, luz, gas)',
    description: 'Sirven para comprobar que los pagos están al día y facilitan los posteriores trámites de cambio de titularidad.',
    requiredForSale: true
  }
];

const BUYER_DOCUMENTS: StandardDocDefinition[] = [
  {
    type: 'comprador_identidad',
    title: 'Documento de identidad en vigor',
    description: 'DNI, NIE o Pasaporte en vigor de todos los compradores intervinientes.',
    requiredForSale: true
  },
  {
    type: 'comprador_medios_pago',
    title: 'Justificantes de medios de pago',
    description: 'Copia de transferencias bancarias, cheques bancarios nominativos o justificantes acreditativos de la procedencia de los fondos y pagos efectuados.',
    requiredForSale: true
  }
];

const PROCESS_DOCUMENTS: StandardDocDefinition[] = [
  {
    type: 'proceso_contrato_arras',
    title: 'Contrato de arras (opcional pero muy recomendable)',
    description: 'Documento privado suscrito y rubricado por ambas partes que formaliza la reserva, plazos, precio acordado y condiciones de la compraventa.',
    requiredForSale: false
  }
];

const sanitizeFilename = (filename: string): string => {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
};

const generateDocumentPath = (propertyId: string, docType: string, fileName: string): string => {
  const clean = sanitizeFilename(fileName);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${propertyId}/${docType}_${suffix}_${clean}`;
};

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const PropertyDocumentsManager: React.FC<PropertyDocumentsManagerProps> = ({
  propertyId,
  propertyTitle,
  propertyData,
  onDocumentsUpdated
}) => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | DocumentCategory | 'historial'>('all');

  // Estado para envío de documentación a Notaría / Bancos
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [emailHistory, setEmailHistory] = useState<DocumentationEmail[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Parseo de datos del inmueble para el correo
  const sellers = useMemo(() => {
    const list: Array<{ name: string; dni?: string }> = [];
    if (propertyData?.owner_name) {
      list.push({ name: propertyData.owner_name, dni: propertyData.owner_dni || undefined });
    }
    if (propertyData?.has_owner2 && propertyData?.owner2_name) {
      list.push({ name: propertyData.owner2_name, dni: propertyData.owner2_dni || undefined });
    }
    return list;
  }, [propertyData]);

  const buyers = useMemo(() => {
    const list: Array<{ name: string; dni?: string }> = [];
    if (propertyData?.buyer_name) {
      list.push({ name: propertyData.buyer_name, dni: propertyData.buyer_dni || undefined });
    }
    if (propertyData?.has_buyer2 && propertyData?.buyer2_name) {
      list.push({ name: propertyData.buyer2_name, dni: propertyData.buyer2_dni || undefined });
    }
    return list;
  }, [propertyData]);

  const propertyAddress = useMemo(() => {
    if (!propertyData) return '';
    const parts = [
      propertyData.owner_street || propertyData.address_hidden || propertyData.address_public,
      propertyData.owner_number,
      propertyData.city,
      propertyData.province
    ].filter(Boolean);
    return parts.join(', ');
  }, [propertyData]);

  // Estado para subida de documentos personalizados ("Otros")
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar documentos:', error);
      } else if (data) {
        setDocuments(data as PropertyDocument[]);
        if (onDocumentsUpdated) {
          const realDocsCount = data.filter((d: any) => d.file_url !== 'NOT_REQUIRED').length;
          onDocumentsUpdated(realDocsCount);
        }
      }
    } catch (err) {
      console.error('Excepción al cargar documentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailHistory = async () => {
    if (!propertyId) return;
    setLoadingHistory(true);
    try {
      const data = await fetchDocumentationEmailHistory(propertyId);
      setEmailHistory(data);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadEmailHistory();
  }, [propertyId]);

  useEffect(() => {
    let isMounted = true;
    if (propertyId) {
      supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (error) {
            console.error('Error al cargar documentos:', error);
          } else if (data) {
            setDocuments(data as PropertyDocument[]);
            if (onDocumentsUpdated) {
              const realDocsCount = data.filter((d: any) => d.file_url !== 'NOT_REQUIRED').length;
              onDocumentsUpdated(realDocsCount);
            }
          }
          setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [propertyId, onDocumentsUpdated]);

  const handleToggleRequired = async (category: DocumentCategory, def: StandardDocDefinition) => {
    const existingNotReq = documents.find(
      d => d.document_type === def.type && d.file_url === 'NOT_REQUIRED'
    );

    try {
      if (existingNotReq) {
        // Quitar marca de no necesario -> vuelve a ser requerido
        const { error } = await supabase
          .from('property_documents')
          .delete()
          .eq('id', existingNotReq.id);
        if (error) throw error;
      } else {
        // Marcar como no necesario
        const hasFiles = documents.some(
          d => d.document_type === def.type && d.file_url !== 'NOT_REQUIRED'
        );
        if (hasFiles) {
          const confirm = window.confirm(
            'Este apartado ya contiene archivos aportados. ¿Deseas marcarlo como "No necesario / No aplica" igualmente?'
          );
          if (!confirm) return;
        }

        const { error } = await supabase
          .from('property_documents')
          .insert({
            property_id: propertyId,
            category,
            document_type: def.type,
            title: def.title,
            description: def.description || null,
            file_url: 'NOT_REQUIRED',
            file_name: 'No necesario / No aplica',
            file_size: 0,
            mime_type: 'application/not-required'
          });
        if (error) throw error;
      }

      await loadDocuments();
    } catch (err: unknown) {
      console.error('Error al cambiar necesidad del trámite:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error al actualizar estado: ${msg}`);
    }
  };

  const getFileIcon = (mimeType?: string | null, fileName?: string) => {
    const fn = (fileName || '').toLowerCase();
    const mt = (mimeType || '').toLowerCase();

    if (mt.includes('pdf') || fn.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-600 shrink-0" />;
    }
    if (mt.includes('image') || fn.endsWith('.jpg') || fn.endsWith('.jpeg') || fn.endsWith('.png')) {
      return <ImageIcon className="w-5 h-5 text-blue-600 shrink-0" />;
    }
    if (mt.includes('sheet') || mt.includes('excel') || fn.endsWith('.xlsx') || fn.endsWith('.xls') || fn.endsWith('.csv')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    return <File className="w-5 h-5 text-slate-600 shrink-0" />;
  };

  const handleFileUpload = async (
    file: File, 
    category: DocumentCategory, 
    docType: string, 
    defaultTitle: string, 
    description?: string
  ) => {
    if (!file) return;

    if (file.size > 26214400) {
      alert('El archivo supera el límite de 25 MB. Por favor comprime el documento.');
      return;
    }

    setUploadingType(docType);

    try {
      // Limpiar marca de "NOT_REQUIRED" si existía previamente para este trámite
      await supabase
        .from('property_documents')
        .delete()
        .eq('property_id', propertyId)
        .eq('document_type', docType)
        .eq('file_url', 'NOT_REQUIRED');

      const filePath = generateDocumentPath(propertyId, docType, file.name);

      // 1. Subir a Supabase Storage bucket 'property_documents'
      const { error: uploadError } = await supabase.storage
        .from('property_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`[Storage]: ${uploadError.message}`);
      }

      // 2. Obtener URL pública o accesible
      const { data: publicUrlData } = supabase.storage
        .from('property_documents')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData?.publicUrl || '';

      // 3. Registrar en la tabla 'property_documents'
      const { error: dbError } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          category,
          document_type: docType,
          title: defaultTitle,
          description: description || null,
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream'
        });

      if (dbError) {
        throw new Error(`[Base de Datos]: ${dbError.message}`);
      }

      await loadDocuments();
    } catch (error: unknown) {
      console.error('Error al subir documento:', error);
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      if (msg.toLowerCase().includes('bucket not found')) {
        alert(
          "El bucket de almacenamiento 'property_documents' aún no existe en Supabase.\n\n" +
          "Para crearlo en 10 segundos:\n" +
          "1. Ve a tu Dashboard de Supabase -> sección 'Storage' (menú lateral izquierdo).\n" +
          "2. Haz clic en el botón 'New bucket'.\n" +
          "3. Escribe como nombre exactamente: property_documents\n" +
          "4. Activa el interruptor 'Public bucket' (público) ✅.\n" +
          "5. Haz clic en 'Save bucket'."
        );
      } else if (msg.includes('[Storage]') && msg.toLowerCase().includes('row-level security')) {
        alert(
          "Faltan las políticas de subida en Supabase Storage para el bucket 'property_documents'.\n\n" +
          "Para activarlo:\n" +
          "Ejecuta en el SQL Editor de Supabase las políticas de storage para 'property_documents' o añade una política en Storage > Policies."
        );
      } else {
        alert(`Error al subir el documento: ${msg}`);
      }
    } finally {
      setUploadingType(null);
    }
  };

  const handleCustomUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFile) {
      alert('Por favor selecciona un archivo para subir.');
      return;
    }
    if (!customTitle.trim()) {
      alert('Por favor introduce un título para el documento.');
      return;
    }

    setIsUploadingCustom(true);
    try {
      await handleFileUpload(
        customFile, 
        'otros', 
        'otros', 
        customTitle.trim(), 
        customDesc.trim() || undefined
      );

      // Limpiar formulario
      setCustomTitle('');
      setCustomDesc('');
      setCustomFile(null);
      if (customFileInputRef.current) {
        customFileInputRef.current.value = '';
      }
    } finally {
      setIsUploadingCustom(false);
    }
  };

  const handleDeleteDocument = async (doc: PropertyDocument) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el documento "${doc.file_name}"?`);
    if (!confirmDelete) return;

    try {
      // 1. Extraer ruta relativa de storage si es posible
      const urlParts = doc.file_url.split('/property_documents/');
      if (urlParts.length > 1) {
        const storagePath = decodeURIComponent(urlParts[1].split('?')[0]);
        await supabase.storage.from('property_documents').remove([storagePath]);
      }

      // 2. Eliminar registro de la base de datos
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      await loadDocuments();
    } catch (error: unknown) {
      console.error('Error al eliminar documento:', error);
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar: ${msg}`);
    }
  };

  // Métricas y progreso (excluyendo registros "NOT_REQUIRED" de la lista de archivos reales)
  const realDocuments = documents.filter(d => d.file_url !== 'NOT_REQUIRED');
  const sellerDocsCount = realDocuments.filter(d => d.category === 'vendedor').length;
  const buyerDocsCount = realDocuments.filter(d => d.category === 'comprador').length;
  const processDocsCount = realDocuments.filter(d => d.category === 'proceso').length;
  const otherDocsCount = realDocuments.filter(d => d.category === 'otros').length;
  const totalUploaded = realDocuments.length;

  // Trámites del Vendedor
  const sellerSlotsFilled = SELLER_DOCUMENTS.filter(def => 
    realDocuments.some(d => d.document_type === def.type)
  ).length;
  const sellerSlotsNotRequired = SELLER_DOCUMENTS.filter(def => 
    documents.some(d => d.document_type === def.type && d.file_url === 'NOT_REQUIRED')
  ).length;
  const sellerRequiredTotal = SELLER_DOCUMENTS.length - sellerSlotsNotRequired;

  // Trámites del Comprador
  const buyerSlotsFilled = BUYER_DOCUMENTS.filter(def => 
    realDocuments.some(d => d.document_type === def.type)
  ).length;
  const buyerSlotsNotRequired = BUYER_DOCUMENTS.filter(def => 
    documents.some(d => d.document_type === def.type && d.file_url === 'NOT_REQUIRED')
  ).length;
  const buyerRequiredTotal = BUYER_DOCUMENTS.length - buyerSlotsNotRequired;

  // Trámites de Proceso
  const processSlotsFilled = PROCESS_DOCUMENTS.filter(def => 
    realDocuments.some(d => d.document_type === def.type)
  ).length;
  const processSlotsNotRequired = PROCESS_DOCUMENTS.filter(def => 
    documents.some(d => d.document_type === def.type && d.file_url === 'NOT_REQUIRED')
  ).length;

  // Total estándar y porcentaje de completitud respecto a los que realmente son necesarios
  const totalRequiredSlots = sellerRequiredTotal + buyerRequiredTotal;
  const totalStandardFilled = sellerSlotsFilled + buyerSlotsFilled;
  const completionPercentage = totalRequiredSlots === 0 
    ? 100 
    : Math.round((totalStandardFilled / totalRequiredSlots) * 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-slate-500 font-medium text-sm">Cargando documentación de la compraventa...</p>
      </div>
    );
  }

  // Renderizar un slot para un tipo de documento estándar
  const renderDocSlot = (category: DocumentCategory, def: StandardDocDefinition) => {
    const slotDocs = documents.filter(d => d.document_type === def.type && d.file_url !== 'NOT_REQUIRED');
    const isNotRequired = documents.some(d => d.document_type === def.type && d.file_url === 'NOT_REQUIRED');
    const isUploaded = slotDocs.length > 0;
    const isUploading = uploadingType === def.type;

    return (
      <div 
        key={def.type}
        className={`border rounded-xl p-4 transition-all duration-200 ${
          isUploaded 
            ? 'bg-white border-emerald-200/80 shadow-xs' 
            : isNotRequired
              ? 'bg-slate-50/70 border-slate-200 opacity-90'
              : 'bg-slate-50/40 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* Cabecera del Documento */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isUploaded 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : isNotRequired
                    ? 'bg-slate-200/80 text-slate-700 border border-slate-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isUploaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aportado ({slotDocs.length})</span>
                  </>
                ) : isNotRequired ? (
                  <>
                    <Ban className="w-3.5 h-3.5 text-slate-500" />
                    <span>No necesario / No aplica</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendiente</span>
                  </>
                )}
              </span>

              {isNotRequired ? (
                <span className="text-[11px] font-medium text-slate-400 italic">
                  Exento
                </span>
              ) : def.requiredForSale ? (
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Requerido
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Opcional
                </span>
              )}

              <h4 className={`text-sm font-bold leading-snug ${isNotRequired ? 'text-slate-600' : 'text-slate-900'}`}>
                {def.title}
              </h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed pr-2">
              {def.description}
            </p>
          </div>

          {/* Botones de Acción: Toggle No Necesario + Subida Directa */}
          <div className="shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
            {/* Botón para alternar si es necesario o no */}
            <button
              type="button"
              onClick={() => handleToggleRequired(category, def)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs cursor-pointer whitespace-nowrap ${
                isNotRequired
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title={isNotRequired ? "Volver a marcar este trámite como necesario" : "Marcar como no necesario o no aplicable"}
            >
              {isNotRequired ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Marcar necesario</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5 text-slate-400" />
                  <span>No necesario</span>
                </>
              )}
            </button>

            {/* Botón de Subida Directa */}
            <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-xs whitespace-nowrap ${
              isUploading 
                ? 'bg-slate-100 text-slate-400 border-slate-200 pointer-events-none'
                : isUploaded
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  : isNotRequired
                    ? 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                    : 'bg-primary hover:bg-primary/95 text-white border-primary'
            }`}>
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isUploaded ? 'Añadir otro' : isNotRequired ? 'Subir archivo' : 'Subir archivo'}</span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                disabled={isUploading}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.tif,.tiff"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, category, def.type, def.title, def.description);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Lista de archivos ya subidos para este slot */}
        {slotDocs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            {slotDocs.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {getFileIcon(doc.mime_type, doc.file_name)}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>Subido el {formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-600 hover:text-primary hover:bg-white rounded-md transition-colors"
                    title="Ver online en pestaña nueva"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <a
                    href={doc.file_url}
                    download={doc.file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-md transition-colors"
                    title="Descargar archivo"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                    title="Eliminar documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* BANNER DE CABECERA Y RESUMEN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-primary mb-1">
              <FolderOpen className="w-6 h-6" />
              <h2 className="text-xl font-bold font-serif text-slate-900">
                Documentación de la Compraventa
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Gestión y custodia documental de los intervinientes (Vendedor, Comprador) y del expediente de venta.
              {propertyTitle && <span className="font-semibold text-slate-700"> • {propertyTitle}</span>}
            </p>
          </div>

          {/* Acciones de Cabecera: Botón Enviar a Notaría / Banco + Progreso */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <Button
              type="button"
              onClick={() => setIsSendEmailModalOpen(true)}
              disabled={totalUploaded === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-xs cursor-pointer text-xs h-10 px-4 whitespace-nowrap"
              title={totalUploaded === 0 ? "Sube al menos un documento para poder realizar envíos" : "Enviar dossier formal por correo a Notaría, Banco o Gestoría"}
            >
              <Send size={15} />
              <span>Enviar a Notaría / Banco</span>
            </Button>

            {/* Progreso General */}
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
              <div className="text-right">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Completitud
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {completionPercentage}%
                </div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">
                  {totalStandardFilled} de {totalRequiredSlots} requeridos
                  {totalRequiredSlots < (SELLER_DOCUMENTS.length + BUYER_DOCUMENTS.length) && (
                    <span className="text-slate-400"> ({ (SELLER_DOCUMENTS.length + BUYER_DOCUMENTS.length) - totalRequiredSlots } exentos)</span>
                  )}
                </div>
              </div>

              <div className="w-20 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    completionPercentage === 100 
                      ? 'bg-emerald-500' 
                      : completionPercentage > 50 
                        ? 'bg-primary' 
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fila de Filtros / Pestañas de Navegación por Categoría */}
        <div className="flex gap-2 mt-6 pt-6 border-t border-slate-100 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategoryTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Ver Todos</span>
            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {totalUploaded}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('vendedor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryTab === 'vendedor'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. Vendedor</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeCategoryTab === 'vendedor' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
            }`}>
              {sellerDocsCount} ({sellerSlotsFilled}/{sellerRequiredTotal})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('comprador')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryTab === 'comprador'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Comprador</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeCategoryTab === 'comprador' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
            }`}>
              {buyerDocsCount} ({buyerSlotsFilled}/{buyerRequiredTotal})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('proceso')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryTab === 'proceso'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>3. Proceso (Arras)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeCategoryTab === 'proceso' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
            }`}>
              {processDocsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('otros')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryTab === 'otros'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>4. Otros</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeCategoryTab === 'otros' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
            }`}>
              {otherDocsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategoryTab('historial')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryTab === 'historial'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>5. Historial de Envíos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeCategoryTab === 'historial' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'
            }`}>
              {emailHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: DOCUMENTACIÓN DEL VENDEDOR */}
      {(activeCategoryTab === 'all' || activeCategoryTab === 'vendedor') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Documentación aportada por el Vendedor
                </h3>
                <p className="text-xs text-slate-500">
                  Documentos legales del propietario y del inmueble necesarios para la comercialización y firma notarial.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              {sellerSlotsFilled} de {sellerRequiredTotal} requeridos
              {sellerSlotsNotRequired > 0 && <span className="text-slate-400 font-normal"> ({sellerSlotsNotRequired} exentos)</span>}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {SELLER_DOCUMENTS.map((def) => renderDocSlot('vendedor', def))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: DOCUMENTACIÓN DEL COMPRADOR */}
      {(activeCategoryTab === 'all' || activeCategoryTab === 'comprador') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Documentación aportada por el Comprador
                </h3>
                <p className="text-xs text-slate-500">
                  Identificación fehaciente de la parte compradora y justificación bancaria de fondos/pagos.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              {buyerSlotsFilled} de {buyerRequiredTotal} requeridos
              {buyerSlotsNotRequired > 0 && <span className="text-slate-400 font-normal"> ({buyerSlotsNotRequired} exentos)</span>}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {BUYER_DOCUMENTS.map((def) => renderDocSlot('comprador', def))}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: DOCUMENTOS GENERADOS DURANTE EL PROCESO */}
      {(activeCategoryTab === 'all' || activeCategoryTab === 'proceso') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Documentos generados durante el Proceso
                </h3>
                <p className="text-xs text-slate-500">
                  Acuerdos y contratos privados suscritos en las diferentes fases de la compraventa.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              {processDocsCount} {processDocsCount === 1 ? 'documento' : 'documentos'}
              {processSlotsNotRequired > 0 && <span className="text-slate-400 font-normal"> (1 exento)</span>}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {PROCESS_DOCUMENTS.map((def) => renderDocSlot('proceso', def))}
          </div>
        </div>
      )}

      {/* SECCIÓN 4: OTROS DOCUMENTOS */}
      {(activeCategoryTab === 'all' || activeCategoryTab === 'otros') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Otros Documentos
                </h3>
                <p className="text-xs text-slate-500">
                  Adjunta cualquier otra documentación de interés (planos, tasación, poderes notariales, estatutos de comunidad, etc.).
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {otherDocsCount} {otherDocsCount === 1 ? 'documento' : 'documentos'}
            </span>
          </div>

          {/* Formulario de subida para Otros Documentos */}
          <form onSubmit={handleCustomUploadSubmit} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Subir Nuevo Documento Adicional</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <Label htmlFor="custom_title" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  Nombre o Título del Documento *
                </Label>
                <Input
                  id="custom_title"
                  type="text"
                  placeholder="Ej: Plano acotado de la vivienda, Poder notarial..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="mt-1 bg-white text-xs"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <Label htmlFor="custom_desc" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  Notas o Descripción (Opcional)
                </Label>
                <Input
                  id="custom_desc"
                  type="text"
                  placeholder="Ej: Aportado por el arquitecto técnico..."
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="mt-1 bg-white text-xs"
                />
              </div>

              <div className="md:col-span-4">
                <Label htmlFor="custom_file" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  Archivo a adjuntar *
                </Label>
                <input
                  id="custom_file"
                  type="file"
                  ref={customFileInputRef}
                  onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={isUploadingCustom}
                className="bg-primary hover:bg-primary/95 text-white text-xs h-8 px-4 gap-1.5 shadow-xs"
              >
                {isUploadingCustom ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Subiendo documento...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Guardar y Subir a Otros</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Listado de Otros Documentos Subidos */}
          {documents.filter(d => d.category === 'otros').length > 0 ? (
            <div className="space-y-2">
              {documents.filter(d => d.category === 'otros').map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getFileIcon(doc.mime_type, doc.file_name)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {doc.title}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate" title={doc.file_name}>
                          ({doc.file_name})
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {doc.description}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>Subido el {formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                      title="Ver online en pestaña nueva"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a
                      href={doc.file_url}
                      download={doc.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Descargar archivo"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
              No se han subido documentos adicionales todavía.
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 5: HISTORIAL DE ENVÍOS A NOTARÍAS Y BANCOS */}
      {(activeCategoryTab === 'historial') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                <History size={17} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Historial de Envíos de Documentación
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de auditoría y trazabilidad de todos los correos remitidos a Notarías, Bancos o Gestorías.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsSendEmailModalOpen(true)}
              disabled={totalUploaded === 0}
              className="bg-primary hover:bg-primary/95 text-white gap-2 font-bold shadow-xs cursor-pointer text-xs h-9 px-3"
            >
              <Send size={13} />
              <span>Nuevo Envío</span>
            </Button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-10 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
              <span>Cargando historial de envíos...</span>
            </div>
          ) : emailHistory.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Mail size={20} />
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Aún no se ha realizado ningún envío para este inmueble
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Cuando envíes la documentación a una notaría o entidad financiera para la hipoteca, quedará aquí registrado con fecha, hora y acuse.
              </p>
              {totalUploaded > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSendEmailModalOpen(true)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Send size={13} />
                  <span>Realizar primer envío</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {emailHistory.map((item) => {
                const badgeRecipient = 
                  item.recipient_type === 'notaria' ? 'bg-primary/10 text-primary border-primary/20' :
                  item.recipient_type === 'banco' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  item.recipient_type === 'gestoria' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-amber-50 text-amber-800 border-amber-200';

                const recipientIcon = 
                  item.recipient_type === 'notaria' ? <Building2 size={13} /> :
                  item.recipient_type === 'banco' ? <Landmark size={13} /> :
                  item.recipient_type === 'gestoria' ? <Briefcase size={13} /> :
                  <User size={13} />;

                const statusBadge = 
                  item.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  item.status === 'simulated' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  'bg-red-50 text-red-700 border-red-200';

                const docsCount = Array.isArray(item.selected_documents) ? item.selected_documents.length : 0;

                return (
                  <div 
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeRecipient}`}>
                          {recipientIcon}
                          <span className="capitalize">{item.recipient_type}</span>
                        </span>

                        <span className="text-xs font-bold text-slate-800">
                          {item.recipient_name ? `${item.recipient_name} (${item.recipient_email})` : item.recipient_email}
                        </span>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {item.status === 'sent' ? 'Enviado' : item.status === 'simulated' ? 'Registrado (Simulado)' : 'Error'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0">
                        <Calendar size={13} />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-0.5">
                        {item.subject}
                      </div>
                      {item.message_body && (
                        <p className="text-xs text-slate-500 line-clamp-2 italic">
                          "{item.message_body}"
                        </p>
                      )}
                    </div>

                    {docsCount > 0 && (
                      <div className="pt-2 border-t border-slate-50 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1">
                          Documentos ({docsCount}):
                        </span>
                        {item.selected_documents.map((d, i) => (
                          <a
                            key={d.id || i}
                            href={d.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                            title={d.file_name}
                          >
                            <FileText size={11} className="text-slate-400" />
                            <span className="truncate max-w-[150px]">{d.title}</span>
                            <ExternalLink size={10} className="text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ENVÍO DE DOCUMENTACIÓN */}
      <SendDocumentationModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        propertyAddress={propertyAddress}
        propertyCadastralRef={propertyData?.cadastral_reference}
        propertyRegistryCity={propertyData?.registry_city}
        propertyRegistryNumber={propertyData?.registry_number}
        propertyRegistryEstate={propertyData?.registry_estate}
        sellers={sellers}
        buyers={buyers}
        documents={documents}
        onEmailSent={() => {
          loadEmailHistory();
        }}
      />
    </div>
  );
};
