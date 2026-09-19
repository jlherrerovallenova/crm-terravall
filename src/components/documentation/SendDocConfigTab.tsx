import React from 'react';
import type { PropertyDocument, EmailRecipientType } from '@/schema/property.schema';
import { 
  Building2, 
  Landmark, 
  Briefcase, 
  User, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SendDocFilesList } from './SendDocFilesList';

interface SendDocConfigTabProps {
  recipientType: EmailRecipientType;
  onApplyRecipientPreset: (type: EmailRecipientType) => void;
  recipientName: string;
  setRecipientName: (v: string) => void;
  recipientEmail: string;
  setRecipientEmail: (v: string) => void;
  agentName: string;
  setAgentName: (v: string) => void;
  ccEmails: string;
  setCcEmails: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  messageBody: string;
  setMessageBody: (v: string) => void;
  realDocs: PropertyDocument[];
  selectedDocIds: Set<string>;
  onToggleDocSelection: (id: string) => void;
  onSelectAll: () => void;
  onSelectSellersOnly: () => void;
  onSelectBuyersOnly: () => void;
  onDeselectAll: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SendDocConfigTab: React.FC<SendDocConfigTabProps> = ({
  recipientType,
  onApplyRecipientPreset,
  recipientName,
  setRecipientName,
  recipientEmail,
  setRecipientEmail,
  agentName,
  setAgentName,
  ccEmails,
  setCcEmails,
  subject,
  setSubject,
  messageBody,
  setMessageBody,
  realDocs,
  selectedDocIds,
  onToggleDocSelection,
  onSelectAll,
  onSelectSellersOnly,
  onSelectBuyersOnly,
  onDeselectAll,
  onSubmit
}) => {
  return (
    <form id="send-doc-form" onSubmit={onSubmit} className="space-y-6">
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
            onClick={() => onApplyRecipientPreset('notaria')}
            className={`p-3 rounded-xl border text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
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
            onClick={() => onApplyRecipientPreset('banco')}
            className={`p-3 rounded-xl border text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
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
            onClick={() => onApplyRecipientPreset('gestoria')}
            className={`p-3 rounded-xl border text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
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
            onClick={() => onApplyRecipientPreset('personalizado')}
            className={`p-3 rounded-xl border text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
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
          <Label htmlFor="send-docs-message-body" className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Mensaje u Observaciones para el Destinatario
          </Label>
          <textarea
            id="send-docs-message-body"
            aria-label="Mensaje u Observaciones para el Destinatario"
            rows={3}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20 leading-relaxed resize-y"
            placeholder="Escribe aquí cualquier indicación especial, fecha prevista de firma, oficial asignado, etc."
          />
        </div>
      </div>

      {/* 3. SELECTOR DE DOCUMENTOS DISPONIBLES */}
      <SendDocFilesList
        realDocs={realDocs}
        selectedDocIds={selectedDocIds}
        onToggleDocSelection={onToggleDocSelection}
        onSelectAll={onSelectAll}
        onSelectSellersOnly={onSelectSellersOnly}
        onSelectBuyersOnly={onSelectBuyersOnly}
        onDeselectAll={onDeselectAll}
      />

      {/* AVISO DE CUSTODIA Y SEGURIDAD */}
      <div className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <div>
          <strong>Entrega garantizada sin rebotes:</strong> Los documentos se entregan con enlaces seguros de descarga directa de alta velocidad (Supabase Storage), asegurando que el servidor de correo de la notaría o banco no bloquee la entrega por sobrepeso de archivos.
        </div>
      </div>
    </form>
  );
};
