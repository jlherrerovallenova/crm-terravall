import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SignatureCanvas } from '../SignatureCanvas';
import type { RentalContractData } from '../RentalContractDocument';
import { PenTool, Check } from 'lucide-react';

interface RentalSignaturesTabProps {
  formData: RentalContractData;
  setFormData: React.Dispatch<React.SetStateAction<RentalContractData>>;
  onBack: () => void;
  onContinue: () => void;
}

export const RentalSignaturesTab: React.FC<RentalSignaturesTabProps> = ({
  formData,
  setFormData,
  onBack,
  onContinue
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
      <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
        <PenTool size={18} className="text-primary" />
        Captura de Firmas Manuscritas Digitales
      </h3>
      <p className="text-xs text-slate-500">
        Puedes dibujar la firma digital en pantalla para que aparezca impresa automáticamente en la hoja de firmas del contrato legal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Firma Propietario */}
        <div className="space-y-2">
          <Label className="whitespace-nowrap font-bold text-slate-800">Firma del Propietario ({formData.owner1Name || 'Propietario'})</Label>
          <SignatureCanvas
            onSave={(dataUrl) => setFormData(p => ({
              ...p,
              signatures: { ...p.signatures, owner1: dataUrl || undefined }
            }))}
          />
          {formData.signatures?.owner1 && (
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <Check size={14} /> Firma del Propietario capturada
            </p>
          )}
        </div>

        {/* Firma Inquilino */}
        <div className="space-y-2">
          <Label className="whitespace-nowrap font-bold text-slate-800">Firma del Inquilino ({formData.tenant1Name || 'Inquilino'})</Label>
          <SignatureCanvas
            onSave={(dataUrl) => setFormData(p => ({
              ...p,
              signatures: { ...p.signatures, tenant1: dataUrl || undefined }
            }))}
          />
          {formData.signatures?.tenant1 && (
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <Check size={14} /> Firma del Inquilino capturada
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
        <Button variant="outline" onClick={onBack}>
          ← Volver al Formulario
        </Button>
        <Button
          onClick={onContinue}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer"
        >
          Ver Vista Previa del Documento →
        </Button>
      </div>
    </div>
  );
};
