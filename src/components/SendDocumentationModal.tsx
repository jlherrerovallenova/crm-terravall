import React, { useState, useMemo } from 'react';
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
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy
} from 'lucide-react';
import { Button } from './ui/button';
import { SendDocConfigTab } from './documentation/SendDocConfigTab';
import { SendDocPreviewTab } from './documentation/SendDocPreviewTab';

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

const DEFAULT_EMPTY_ARRAY: any[] = [];

const getRecipientPresetText = (type: EmailRecipientType, identifier: string) => {
  if (type === 'notaria') {
    return {
      subject: `Documentación para preparación de escritura de compraventa - ${identifier}`,
      messageBody: `Adjuntamos la documentación y títulos de propiedad relativos a la compraventa del inmueble indicado para la preparación de la correspondiente escritura pública de compraventa.\n\nRogamos confirmen la recepción y nos indiquen si precisan cualquier aclaración adicional para la elaboración de la minuta.`
    };
  }
  if (type === 'banco') {
    return {
      subject: `Documentación para estudio y tasación de hipoteca - ${identifier}`,
      messageBody: `Remitimos la documentación jurídica, registral y catastral del inmueble para el estudio de la operación hipotecaria y la emisión del oportuno informe de tasación.\n\nQuedamos a la espera de sus noticias.`
    };
  }
  if (type === 'gestoria') {
    return {
      subject: `Expediente de compraventa para tramitación - ${identifier}`,
      messageBody: `Remitimos la documentación completa de la operación de compraventa para su revisión previa y tramitación registral y fiscal.`
    };
  }
  return {
    subject: `Documentación de la compraventa - ${identifier}`,
    messageBody: `Adjuntamos la documentación requerida relativa a la operación de compraventa.`
  };
};

const SendDocumentationModalContent: React.FC<SendDocumentationModalProps> = ({
  isOpen: _isOpen,
  onClose,
  propertyId,
  propertyTitle = 'Inmueble',
  propertyAddress = '',
  propertyCadastralRef = '',
  propertyRegistryCity = '',
  propertyRegistryNumber = '',
  propertyRegistryEstate = '',
  sellers = DEFAULT_EMPTY_ARRAY,
  buyers = DEFAULT_EMPTY_ARRAY,
  defaultAgentName = '',
  documents,
  onEmailSent
}) => {
  // Filtrar únicamente los documentos reales (excluyendo marcas NOT_REQUIRED)
  const realDocs = useMemo(() => {
    return documents.filter(d => d.file_url && d.file_url !== 'NOT_REQUIRED');
  }, [documents]);

  const identifier = propertyAddress || propertyTitle || 'Inmueble';
  const initialPreset = useMemo(() => getRecipientPresetText('notaria', identifier), [identifier]);

  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [recipientType, setRecipientType] = useState<EmailRecipientType>('notaria');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [agentName, setAgentName] = useState(defaultAgentName || '');
  const [subject, setSubject] = useState(initialPreset.subject);
  const [messageBody, setMessageBody] = useState(initialPreset.messageBody);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const d of documents) {
      if (d.file_url && d.file_url !== 'NOT_REQUIRED') {
        ids.add(d.id);
      }
    }
    return ids;
  });

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendEmailResult | null>(null);
  const [copiedAlert, setCopiedAlert] = useState(false);

  const applyRecipientPreset = (type: EmailRecipientType) => {
    setRecipientType(type);
    const idf = propertyAddress || propertyTitle || 'Inmueble';
    const preset = getRecipientPresetText(type, idf);
    setSubject(preset.subject);
    setMessageBody(preset.messageBody);
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    for (const d of realDocs) allIds.add(d.id);
    setSelectedDocIds(allIds);
  };

  const handleSelectSellersOnly = () => {
    const sellerIds = new Set<string>();
    for (const d of realDocs) {
      if (d.category === 'vendedor') sellerIds.add(d.id);
    }
    setSelectedDocIds(sellerIds);
  };

  const handleSelectBuyersOnly = () => {
    const buyerIds = new Set<string>();
    for (const d of realDocs) {
      if (d.category === 'comprador') buyerIds.add(d.id);
    }
    setSelectedDocIds(buyerIds);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto transition-opacity duration-200">
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
            aria-label="Cerrar ventana de envío de documentación"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
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
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
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
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
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
            <SendDocConfigTab
              recipientType={recipientType}
              onApplyRecipientPreset={applyRecipientPreset}
              recipientName={recipientName}
              setRecipientName={setRecipientName}
              recipientEmail={recipientEmail}
              setRecipientEmail={setRecipientEmail}
              agentName={agentName}
              setAgentName={setAgentName}
              ccEmails={ccEmails}
              setCcEmails={setCcEmails}
              subject={subject}
              setSubject={setSubject}
              messageBody={messageBody}
              setMessageBody={setMessageBody}
              realDocs={realDocs}
              selectedDocIds={selectedDocIds}
              onToggleDocSelection={toggleDocSelection}
              onSelectAll={handleSelectAll}
              onSelectSellersOnly={handleSelectSellersOnly}
              onSelectBuyersOnly={handleSelectBuyersOnly}
              onDeselectAll={handleDeselectAll}
              onSubmit={handleSubmit}
            />
          ) : (
            <SendDocPreviewTab
              recipientEmail={recipientEmail}
              subject={subject}
              selectedDocsCount={selectedDocsList.length}
              previewHtml={previewHtml}
            />
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

export const SendDocumentationModal: React.FC<SendDocumentationModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <SendDocumentationModalContent key={props.propertyId || 'send-doc-modal'} {...props} />;
};
