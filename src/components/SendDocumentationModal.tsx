import React, { useState, useEffect, useMemo } from 'react';
import type { PropertyDocument, EmailRecipientType } from '@/schema/property.schema';
import { 
  sendDocumentationEmail, 
  generateDocumentationEmailHtml, 
  type SendEmailResult 
} from '@/services/emailDocumentationService';
import { 
  X, 
  Send, 
  Eye, 
  Settings, 
  CheckSquare, 
  Square, 
  FileText, 
  Building2, 
  Landmark, 
  Briefcase, 
  User, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface SendDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCadastralRef?: string;
  propertyRegistryCity?: string;
  propertyRegistryNumber?: string;
  propertyRegistryEstate?: string;
  sellers?: Array<{ name: string; dni?: string }>;
  buyers?: Array<{ name: string; dni?: string }>;
  defaultAgentName?: string;
  documents: PropertyDocument[];
  onEmailSent?: () => void;
}

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const SendDocumentationModal: React.FC<SendDocumentationModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle = 'Inmueble',
  propertyAddress = '',
  propertyCadastralRef = '',
  propertyRegistryCity = '',
  propertyRegistryNumber = '',
  propertyRegistryEstate = '',
  sellers = [],
  buyers = [],
  defaultAgentName = '',
  documents,
  onEmailSent
}) => {
  // Filtrar únicamente los documentos reales (excluyendo marcas NOT_REQUIRED)
  const realDocs = useMemo(() => {
    return documents.filter(d => d.file_url && d.file_url !== 'NOT_REQUIRED');
  }, [documents]);

  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [recipientType, setRecipientType] = useState<EmailRecipientType>('notaria');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [agentName, setAgentName] = useState(defaultAgentName);
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendEmailResult | null>(null);
  const [copiedAlert, setCopiedAlert] = useState(false);

  // Inicializar selección y plantillas por tipo de destinatario
  useEffect(() => {
    if (!isOpen) return;

    // Inicialmente seleccionar todos los documentos disponibles
    const allIds = new Set(realDocs.map(d => d.id));
    setSelectedDocIds(allIds);
    setAgentName(defaultAgentName || '');

    applyRecipientPreset('notaria');
    setSendResult(null);
    setActiveTab('config');
  }, [isOpen, realDocs, propertyAddress, propertyTitle, defaultAgentName]);

  const applyRecipientPreset = (type: EmailRecipientType) => {
    setRecipientType(type);
    const identifier = propertyAddress || propertyTitle || 'Inmueble';

    if (type === 'notaria') {
      setSubject(`Documentación para preparación de escritura de compraventa - ${identifier}`);
      setMessageBody(
        `Adjuntamos la documentación y títulos de propiedad relativos a la compraventa del inmueble indicado para la preparación de la correspondiente escritura pública de compraventa.\n\nRogamos confirmen la recepción y nos indiquen si precisan cualquier aclaración adicional para la elaboración de la minuta.`
      );
    } else if (type === 'banco') {
      setSubject(`Documentación para estudio y tasación de hipoteca - ${identifier}`);
      setMessageBody(
        `Remitimos la documentación jurídica, registral y catastral del inmueble para el estudio de la operación hipotecaria y la emisión del oportuno informe de tasación.\n\nQuedamos a la espera de sus noticias.`
      );
    } else if (type === 'gestoria') {
      setSubject(`Expediente de compraventa para tramitación - ${identifier}`);
      setMessageBody(
        `Remitimos la documentación completa de la operación de compraventa para su revisión previa y tramitación registral y fiscal.`
      );
    } else {
      setSubject(`Documentación de la compraventa - ${identifier}`);
      setMessageBody(`Adjuntamos la documentación requerida relativa a la operación de compraventa.`);
    }
  };

  const handleSelectAll = () => {
    setSelectedDocIds(new Set(realDocs.map(d => d.id)));
  };

  const handleSelectSellersOnly = () => {
    const sellerIds = realDocs.filter(d => d.category === 'vendedor').map(d => d.id);
    setSelectedDocIds(new Set(sellerIds));
  };

  const handleSelectBuyersOnly = () => {
    const buyerIds = realDocs.filter(d => d.category === 'comprador').map(d => d.id);
    setSelectedDocIds(new Set(buyerIds));
  };

  const handleDeselectAll = () => {
    setSelectedDocIds(new Set());
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedDocsList = useMemo(() => {
    return realDocs.filter(d => selectedDocIds.has(d.id));
  }, [realDocs, selectedDocIds]);

  const previewParams = useMemo(() => {
    return {
      propertyId,
      propertyTitle,
      propertyAddress,
      propertyCadastralRef,
      propertyRegistryCity,
      propertyRegistryNumber,
      propertyRegistryEstate,
      sellers,
      buyers,
      recipientType,
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim(),
      ccEmails: ccEmails.trim(),
      agentName: agentName.trim(),
      subject: subject.trim(),
      messageBody: messageBody.trim(),
      selectedDocuments: selectedDocsList
    };
  }, [
    propertyId,
    propertyTitle,
    propertyAddress,
    propertyCadastralRef,
    propertyRegistryCity,
    propertyRegistryNumber,
    propertyRegistryEstate,
    sellers,
    buyers,
    recipientType,
    recipientName,
    recipientEmail,
    ccEmails,
    agentName,
    subject,
    messageBody,
    selectedDocsList
  ]);

  const previewHtml = useMemo(() => {
    return generateDocumentationEmailHtml(previewParams);
  }, [previewParams]);

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(previewHtml);
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 2500);
    } catch (err) {
      console.error('Error al copiar HTML:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      alert('Por favor introduce una dirección de correo electrónico válida para el destinatario.');
      return;
    }

    if (!subject.trim()) {
      alert('Por favor introduce un asunto para el correo.');
      return;
    }

    if (selectedDocsList.length === 0) {
      alert('Debes seleccionar al menos un documento para enviar.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await sendDocumentationEmail(previewParams);
      setSendResult(result);

      if (result.success) {
        if (onEmailSent) {
          onEmailSent();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al enviar correo';
      setSendResult({
        success: false,
        mode: 'api',
        status: 'failed',
        message: msg
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* CABECERA DEL MODAL */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Enviar Documentación a Notaría o Banco
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {propertyAddress || propertyTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* SELECTOR DE PESTAÑAS: CONFIGURACIÓN vs VISTA PREVIA */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'config'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Settings size={15} />
              <span>Configuración del Envío</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye size={15} />
              <span>Vista Previa del Correo</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {selectedDocsList.length} docs
              </span>
            </button>
          </div>

          {activeTab === 'preview' && (
            <button
              type="button"
              onClick={handleCopyHtml}
              className="text-xs font-semibold text-slate-600 hover:text-primary flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copiar código HTML al portapapeles"
            >
              <Copy size={13} />
              <span>{copiedAlert ? '¡Copiado!' : 'Copiar HTML'}</span>
            </button>
          )}
        </div>

        {/* RESULTADO DE ENVÍO PREVIO (SI EXISTE) */}
        {sendResult && (
          <div className={`px-6 py-3 border-b flex items-start gap-3 shrink-0 ${
            sendResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            {sendResult.success ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs leading-relaxed">
              <div className="font-bold">
                {sendResult.success ? 'Envío procesado con éxito' : 'Error en el envío'}
              </div>
              <div>{sendResult.message}</div>
            </div>
            {sendResult.success && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                onClick={onClose}
              >
                Cerrar
              </Button>
            )}
          </div>
        )}

        {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'config' ? (
            <form id="send-doc-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* AVISO DE API KEY DE RESEND SI NO ESTÁ CONFIGURADA */}
              {!import.meta.env.VITE_RESEND_API_KEY && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Resend no está configurado todavía</div>
                    <div className="text-amber-800 leading-relaxed">
                      Para que los correos salgan a los destinatarios reales, añade tu clave de Resend en el archivo <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">.env.local</code>:
                      <div className="font-mono bg-white border border-amber-200 px-2 py-1 rounded text-[11px] mt-1 text-slate-700 select-all">
                        VITE_RESEND_API_KEY=re_tu_api_key_aqui
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 1. SELECCIÓN DE TIPO DE DESTINATARIO */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tipo de Destinatario
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => applyRecipientPreset('notaria')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      recipientType === 'notaria'
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Building2 size={18} className={recipientType === 'notaria' ? 'text-primary' : 'text-slate-500'} />
                    <div>
                      <div className="text-xs font-bold">Notaría</div>
                      <div className="text-[11px] text-slate-500">Escritura de compraventa</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRecipientPreset('banco')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      recipientType === 'banco'
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Landmark size={18} className={recipientType === 'banco' ? 'text-blue-600' : 'text-slate-500'} />
                    <div>
                      <div className="text-xs font-bold">Banco / Hipoteca</div>
                      <div className="text-[11px] text-slate-500">Estudio y tasación</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRecipientPreset('gestoria')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      recipientType === 'gestoria'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Briefcase size={18} className={recipientType === 'gestoria' ? 'text-emerald-700' : 'text-slate-500'} />
                    <div>
                      <div className="text-xs font-bold">Gestoría</div>
                      <div className="text-[11px] text-slate-500">Tramitación y liquidación</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyRecipientPreset('personalizado')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                      recipientType === 'personalizado'
                        ? 'border-amber-600 bg-amber-50/60 text-amber-800 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <User size={18} className={recipientType === 'personalizado' ? 'text-amber-600' : 'text-slate-500'} />
                    <div>
                      <div className="text-xs font-bold">Personalizado</div>
                      <div className="text-[11px] text-slate-500">Otro destinatario</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. DATOS DEL DESTINATARIO Y ASUNTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Nombre del Destinatario / Notaría / Entidad
                  </Label>
                  <Input
                    placeholder="Ej: Notaría Dña. María López / Banco Santander"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Correo Electrónico Principal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="ejemplo@notariado.org o contacto@banco.es"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="bg-white text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Comercial que lo envía (Firma del correo)
                  </Label>
                  <Input
                    placeholder="Nombre del comercial (ej: Celia, José Luis...)"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="bg-white text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="whitespace-nowrap">Copia (CC) opcional</span>
                    <span className="text-[11px] font-normal text-slate-400">Separar por comas</span>
                  </Label>
                  <Input
                    placeholder="agente@terravall.com, comprador@email.com"
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    className="bg-white text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Asunto del Correo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-white text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Mensaje u Observaciones para el Destinatario
                  </Label>
                  <textarea
                    rows={3}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 leading-relaxed resize-y"
                    placeholder="Escribe aquí cualquier indicación especial, fecha prevista de firma, oficial asignado, etc."
                  />
                </div>
              </div>

              {/* 3. SELECTOR DE DOCUMENTOS DISPONIBLES */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Documentación a Incluir ({selectedDocsList.length} de {realDocs.length} seleccionados)
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Selecciona qué documentos se enlazarán en el dossier de compraventa.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-bold text-slate-600 hover:text-primary px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectSellersOnly}
                      className="text-[11px] font-bold text-slate-600 hover:text-primary px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Solo Vendedor
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectBuyersOnly}
                      className="text-[11px] font-bold text-slate-600 hover:text-primary px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Solo Comprador
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                {realDocs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No hay archivos subidos en este inmueble todavía. Primero sube los documentos en la sección de Documentación.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                    {realDocs.map((doc) => {
                      const isSelected = selectedDocIds.has(doc.id);
                      const catBadge = 
                        doc.category === 'vendedor' ? 'bg-primary/10 text-primary' :
                        doc.category === 'comprador' ? 'bg-blue-50 text-blue-700' :
                        doc.category === 'proceso' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';

                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleDocSelection(doc.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-white border-primary/60 shadow-2xs' 
                              : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-primary" />
                            ) : (
                              <Square size={16} className="text-slate-300" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-sm ${catBadge}`}>
                                {doc.category}
                              </span>
                              <span className={`font-semibold truncate ${isSelected ? 'text-slate-800' : 'text-slate-500'}`} title={doc.title}>
                                {doc.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                              <span className="truncate">{doc.file_name}</span>
                              <span>&bull;</span>
                              <span className="font-mono shrink-0">{formatFileSize(doc.file_size)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AVISO DE CUSTODIA Y SEGURIDAD */}
              <div className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <strong>Entrega garantizada sin rebotes:</strong> Los documentos se entregan con enlaces seguros de descarga directa de alta velocidad (Supabase Storage), asegurando que el servidor de correo de la notaría o banco no bloquee la entrega por sobrepeso de archivos.
                </div>
              </div>

            </form>
          ) : (
            /* VISTA PREVIA DEL CORREO */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <strong>Para:</strong> {recipientEmail || '(introduce un email)'} &bull; <strong>Asunto:</strong> {subject}
                </div>
                <div className="font-mono text-slate-400">
                  {selectedDocsList.length} documentos incluidos
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div 
                  className="p-4 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL CON BOTONES DE ACCIÓN */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div>
            {activeTab === 'config' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('preview')}
                disabled={selectedDocsList.length === 0}
                className="text-xs font-semibold gap-1.5 text-slate-700 hover:bg-slate-100"
              >
                <Eye size={14} />
                <span>Ver Vista Previa</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('config')}
                className="text-xs font-semibold gap-1.5 text-slate-700 hover:bg-slate-100"
              >
                <Settings size={14} />
                <span>Volver a Configuración</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-medium"
            >
              Cerrar
            </Button>

            <Button
              type="submit"
              form="send-doc-form"
              disabled={isSending || selectedDocsList.length === 0}
              className="bg-primary hover:bg-primary/95 text-white gap-2 font-bold text-xs shadow-xs"
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Enviando Correo...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Enviar Documentación</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
