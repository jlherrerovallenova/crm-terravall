import React, { useState, useId } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Edit3, 
  Eye, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  Building2, 
  Euro, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { 
  NotaryOperationSummaryDocument, 
  formatCurrencyWithCents 
} from './NotaryOperationSummaryDocument';
import type { NotarySummaryData, NotarySummaryFinca } from '@/types/notarySummary.types';
import { 
  buildInitialNotarySummaryData, 
  generateNotarySummaryPrintHtml 
} from '@/utils/notarySummaryHelpers';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';

interface SigningSectionProps {
  formData: NotarySummaryData;
  onChange: <K extends keyof NotarySummaryData>(field: K, value: NotarySummaryData[K]) => void;
}

const NotarySigningFormSection: React.FC<SigningSectionProps> = ({ formData, onChange }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
    <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
      <Building2 className="w-5 h-5 text-[#8B1D2C]" />
      <h3 className="font-bold text-sm">1. Datos de Firma y Notaría</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
      <div className="md:col-span-6 space-y-1">
        <Label htmlFor="signing_date" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Fecha de Firma
        </Label>
        <Input
          id="signing_date"
          type="text"
          value={formData.signingDate}
          onChange={e => onChange('signingDate', e.target.value)}
          placeholder="ej: Día 7 de septiembre de 2026"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-6 space-y-1">
        <Label htmlFor="signing_time" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Hora de Firma
        </Label>
        <Input
          id="signing_time"
          type="text"
          value={formData.signingTime}
          onChange={e => onChange('signingTime', e.target.value)}
          placeholder="ej: 9:30 am ó 10:00 h"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-5 space-y-1">
        <Label htmlFor="notary_name" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Notaría (Notario/a)
        </Label>
        <Input
          id="notary_name"
          type="text"
          value={formData.notaryName}
          onChange={e => onChange('notaryName', e.target.value)}
          placeholder="ej: D. Javier Gómez"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="notary_address" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Dirección Notaría
        </Label>
        <Input
          id="notary_address"
          type="text"
          value={formData.notaryAddress}
          onChange={e => onChange('notaryAddress', e.target.value)}
          placeholder="ej: Calle Miguel Íscar 21, Valladolid"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-3 space-y-1">
        <Label htmlFor="notary_officer" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Oficial Asignado
        </Label>
        <Input
          id="notary_officer"
          type="text"
          value={formData.notaryOfficer}
          onChange={e => onChange('notaryOfficer', e.target.value)}
          placeholder="ej: Olga Salas"
          className="text-xs h-9 bg-white"
        />
      </div>
    </div>
  </div>
);

interface FincasSectionProps {
  formData: NotarySummaryData;
  onTitleChange: (title: string) => void;
  onFincaChange: (id: string, field: keyof NotarySummaryFinca, value: any) => void;
  onAddFinca: () => void;
  onRemoveFinca: (id: string) => void;
}

const NotaryFincasFormSection: React.FC<FincasSectionProps> = ({
  formData,
  onTitleChange,
  onFincaChange,
  onAddFinca,
  onRemoveFinca,
}) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
      <div className="flex items-center gap-2 text-slate-900">
        <FileText className="w-5 h-5 text-[#8B1D2C]" />
        <h3 className="font-bold text-sm">2. Título de la Operación y Fincas Registrales</h3>
      </div>

      <Button
        type="button"
        onClick={onAddFinca}
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 border-dashed border-rose-300 text-rose-800 hover:bg-rose-50"
      >
        <Plus size={13} />
        <span>Añadir Finca</span>
      </Button>
    </div>

    <div className="space-y-1">
      <Label htmlFor="operation_title" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
        Título Legal de la Operación (Subtítulo en documento)
      </Label>
      <Input
        id="operation_title"
        type="text"
        value={formData.operationTitle}
        onChange={e => onTitleChange(e.target.value)}
        placeholder="ej: COMPRAVENTA DE LA VIVIENDA Y TRASTERO EN CALLE MANZANA Nº 4, 3º B (VALLADOLID)"
        className="text-xs h-9 bg-white font-semibold uppercase"
      />
    </div>

    <div className="space-y-3 pt-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
        Desglose de Fincas ({formData.fincas.length})
      </div>

      {formData.fincas.map((finca, idx) => (
        <div
          key={finca.id}
          className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 relative group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              Finca #{idx + 1}
            </span>

            {formData.fincas.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveFinca(finca.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                title="Eliminar esta finca"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4 space-y-1">
              <Label htmlFor={`finca_label_${finca.id}`} className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                Denominación / Elemento
              </Label>
              <Input
                id={`finca_label_${finca.id}`}
                type="text"
                value={finca.label}
                onChange={e => onFincaChange(finca.id, 'label', e.target.value)}
                placeholder="ej: Vivienda, Trastero, Garaje..."
                className="text-xs h-8 bg-white"
              />
            </div>

            <div className="sm:col-span-5 space-y-1">
              <Label htmlFor={`finca_reg_${finca.id}`} className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                Inscripción Registral
              </Label>
              <Input
                id={`finca_reg_${finca.id}`}
                type="text"
                value={finca.registryDescription}
                onChange={e => onFincaChange(finca.id, 'registryDescription', e.target.value)}
                placeholder="ej: Inscrita en el Registro de la Propiedad TRES de Valladolid. Finca 44106."
                className="text-xs h-8 bg-white"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <Label htmlFor={`finca_price_${finca.id}`} className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                Precio Asignado (€)
              </Label>
              <Input
                id={`finca_price_${finca.id}`}
                type="number"
                value={finca.price || ''}
                onChange={e => onFincaChange(finca.id, 'price', Number(e.target.value) || 0)}
                placeholder="295000"
                className="text-xs h-8 bg-white font-mono"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface PaymentsSectionProps {
  formData: NotarySummaryData;
  onChange: <K extends keyof NotarySummaryData>(field: K, value: NotarySummaryData[K]) => void;
}

const NotaryPaymentsFormSection: React.FC<PaymentsSectionProps> = ({ formData, onChange }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
    <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
      <Euro className="w-5 h-5 text-[#8B1D2C]" />
      <h3 className="font-bold text-sm">3. Resumen de Pagos y Medios de Otorgamiento</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="total_price" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Precio Total Compraventa (€)
        </Label>
        <Input
          id="total_price"
          type="number"
          value={formData.totalPrice || ''}
          onChange={e => {
            const val = Number(e.target.value) || 0;
            onChange('totalPrice', val);
            onChange('remainingAmount', Math.max(0, val - (formData.arrasAmount || 0)));
          }}
          className="text-xs h-9 bg-white font-bold font-mono text-blue-900"
        />
      </div>

      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="arras_amount" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Importe Arras / Señal (€)
        </Label>
        <Input
          id="arras_amount"
          type="number"
          value={formData.arrasAmount || ''}
          onChange={e => {
            const val = Number(e.target.value) || 0;
            onChange('arrasAmount', val);
            onChange('remainingAmount', Math.max(0, (formData.totalPrice || 0) - val));
          }}
          className="text-xs h-9 bg-white font-mono"
        />
      </div>

      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="arras_method" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Medio Pago de Arras
        </Label>
        <Input
          id="arras_method"
          type="text"
          value={formData.arrasMethod}
          onChange={e => onChange('arrasMethod', e.target.value)}
          placeholder="Transferencia"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="remaining_amount" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Resto Pago a Otorgamiento (€)
        </Label>
        <Input
          id="remaining_amount"
          type="number"
          value={formData.remainingAmount || ''}
          onChange={e => onChange('remainingAmount', Number(e.target.value) || 0)}
          className="text-xs h-9 bg-white font-mono font-bold"
        />
      </div>

      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="remaining_method" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Medio del Resto
        </Label>
        <Input
          id="remaining_method"
          type="text"
          value={formData.remainingMethod}
          onChange={e => onChange('remainingMethod', e.target.value)}
          placeholder="Cheque bancario"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-4 space-y-1">
        <Label htmlFor="remaining_detail" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Titular Cheque / Comprador
        </Label>
        <Input
          id="remaining_detail"
          type="text"
          value={formData.remainingDetail}
          onChange={e => onChange('remainingDetail', e.target.value)}
          placeholder="Nombre del comprador emisor del cheque"
          className="text-xs h-9 bg-white"
        />
      </div>

      <div className="md:col-span-12 space-y-1 pt-1">
        <Label htmlFor="notary_notes" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Observaciones y Aclaraciones para la Notaría (opcional)
        </Label>
        <textarea
          id="notary_notes"
          value={formData.notes || ''}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Anotaciones relativas a certificados bancarios, llaves, retenciones de IBI o comunidad..."
          rows={2}
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  </div>
);

interface NotaryOperationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyData?: any;
  onSaved?: (data: NotarySummaryData) => void;
}

export const NotaryOperationSummaryModal: React.FC<NotaryOperationSummaryModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyData,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const uniquePrefix = useId();

  // Lazy initializer to avoid recomputing on each render
  const [formData, setFormData] = useState<NotarySummaryData>(() => buildInitialNotarySummaryData(propertyData));

  if (!isOpen) return null;

  const handleFieldChange = <K extends keyof NotarySummaryData>(field: K, value: NotarySummaryData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFincaChange = (id: string, field: keyof NotarySummaryFinca, value: any) => {
    setFormData(prev => {
      const updatedFincas = prev.fincas.map(f => {
        if (f.id === id) {
          return { ...f, [field]: value };
        }
        return f;
      });

      const newTotal = updatedFincas.reduce((acc, f) => acc + (Number(f.price) || 0), 0);
      const newResto = Math.max(0, newTotal - (Number(prev.arrasAmount) || 0));

      return {
        ...prev,
        fincas: updatedFincas,
        totalPrice: newTotal > 0 ? newTotal : prev.totalPrice,
        remainingAmount: newResto,
      };
    });
  };

  const handleAddFinca = () => {
    const newId = `${uniquePrefix}-finca-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      fincas: [
        ...prev.fincas,
        {
          id: newId,
          label: 'Elemento Anexo',
          registryDescription: 'Inscrita en el Registro de la Propiedad...',
          price: 0,
        },
      ],
    }));
  };

  const handleRemoveFinca = (id: string) => {
    setFormData(prev => {
      const updated = prev.fincas.filter(f => f.id !== id);
      const newTotal = updated.reduce((acc, f) => acc + (Number(f.price) || 0), 0);
      const newResto = Math.max(0, newTotal - (Number(prev.arrasAmount) || 0));
      return {
        ...prev,
        fincas: updated,
        totalPrice: newTotal > 0 ? newTotal : prev.totalPrice,
        remainingAmount: newResto,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave: NotarySummaryData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      const currentArras = propertyData?.arras_contract_data || {};
      const updatedArras = {
        ...currentArras,
        notary_summary_data: dataToSave,
      };

      const { error } = await supabase
        .from('properties')
        .update({
          notary_summary_data: dataToSave,
          arras_contract_data: updatedArras,
        })
        .eq('id', propertyId);

      if (error) {
        console.warn('Fallback al guardar notary_summary_data:', error.message);
        const fallbackRes = await supabase
          .from('properties')
          .update({
            arras_contract_data: updatedArras,
          })
          .eq('id', propertyId);

        if (fallbackRes.error) throw fallbackRes.error;
      }

      setSaveSuccess(true);
      if (onSaved) onSaved(dataToSave);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('preview');
      }, 1200);
    } catch (err: unknown) {
      console.error('Error al guardar el resumen de operación:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`No se pudo guardar: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyText = () => {
    const fincasText = formData.fincas
      .map(f => `${f.label}: ${f.registryDescription} (Precio: ${formatCurrencyWithCents(f.price)})`)
      .join('\n');

    const textToCopy = `RESUMEN DE OPERACIÓN - TERRAVALL
${formData.operationTitle}
--------------------------------------------------
DATOS DE FIRMA Y NOTARÍA:
- Fecha firma: ${formData.signingDate}
- Hora firma: ${formData.signingTime}
- Notaría: ${formData.notaryName}
- Dirección: ${formData.notaryAddress}
- Oficial: ${formData.notaryOfficer}

INMUEBLES / FINCAS REGISTRALES:
${fincasText}

RESUMEN DE PAGOS DE LA COMPRAVENTA:
- Precio Total: ${formatCurrencyWithCents(formData.totalPrice)}
- Arras: ${formatCurrencyWithCents(formData.arrasAmount)} (${formData.arrasMethod})
- Resto a Pagar: ${formatCurrencyWithCents(formData.remainingAmount)} (${formData.remainingMethod}${formData.remainingDetail ? ' - ' + formData.remainingDetail : ''})
${formData.notes ? '\nOBSERVACIONES:\n' + formData.notes : ''}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) {
      alert('Por favor, permite ventanas emergentes en tu navegador para generar el PDF.');
      return;
    }

    const htmlContent = generateNotarySummaryPrintHtml(formData, TERRAVALL_LOGO_BASE64);
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B1D2C]/30 text-rose-300 rounded-lg">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-snug">
                  Ficha Resumen de la Operación (Guía Notaría)
                </h2>
                <span className="text-[11px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded-full border border-rose-800/80 font-semibold uppercase tracking-wider">
                  Notaría & Firma
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Documento ejecutivo con datos de otorgamiento, fincas registrales y desglose de medios de pago.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-xl mr-2 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye size={14} />
                <span>Vista Previa & PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 size={14} />
                <span>Editar Datos</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Acciones Rápidas */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Inmueble: <strong className="text-slate-700">{propertyData?.title || propertyData?.city || 'Expediente'}</strong>
            </span>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full animate-in fade-in">
                <CheckCircle2 size={13} />
                <span>Guardado correctamente</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleCopyText}
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </Button>

            <Button
              type="button"
              onClick={handlePrint}
              size="sm"
              className="text-xs h-8 gap-1.5 bg-[#8B1D2C] hover:bg-[#721523] text-white font-bold shadow-xs cursor-pointer"
              title="Abre ventana lista para imprimir o descargar en PDF (A4)"
            >
              <Printer size={14} />
              <span>Imprimir / Descargar en PDF</span>
            </Button>

            {activeTab === 'edit' && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                <Save size={14} />
                <span>{isSaving ? 'Guardando...' : 'Guardar Ficha'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Contenido según Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          {activeTab === 'preview' ? (
            <div className="flex justify-center">
              <div className="bg-white rounded-xl shadow-md border border-slate-200/80 w-full max-w-[820px] transition-colors">
                <NotaryOperationSummaryDocument data={formData} />
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              <NotarySigningFormSection formData={formData} onChange={handleFieldChange} />
              <NotaryFincasFormSection
                formData={formData}
                onTitleChange={title => handleFieldChange('operationTitle', title)}
                onFincaChange={handleFincaChange}
                onAddFinca={handleAddFinca}
                onRemoveFinca={handleRemoveFinca}
              />
              <NotaryPaymentsFormSection formData={formData} onChange={handleFieldChange} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('preview')}
                  className="text-xs h-9 bg-white"
                >
                  Volver a Vista Previa
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                >
                  <Save size={15} />
                  <span>{isSaving ? 'Guardando en expediente...' : 'Guardar y Aplicar Cambios'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Diseño corporativo oficial de <strong>Terravall Servicios Inmobiliarios</strong>
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 text-slate-600"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 bg-[#8B1D2C] hover:bg-[#721523] text-white font-bold gap-1.5 shadow-xs"
            >
              <Printer size={14} />
              <span>Imprimir / Descargar PDF</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
