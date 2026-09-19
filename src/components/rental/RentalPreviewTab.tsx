import React from 'react';
import { RentalContractDocument } from '../RentalContractDocument';
import type { RentalContractData } from '../RentalContractDocument';
import { Printer } from 'lucide-react';

interface RentalPreviewTabProps {
  formData: RentalContractData;
  onPrint: () => void;
}

export const RentalPreviewTab: React.FC<RentalPreviewTabProps> = ({
  formData,
  onPrint
}) => {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Documento Final Generado</h4>
          <p className="text-xs text-slate-500">Listo para revisión legal, descarga en PDF o impresión física.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Printer size={16} />
            Imprimir / Descargar PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-4 bg-slate-200/60 rounded-2xl flex justify-center">
        <RentalContractDocument data={formData} />
      </div>
    </div>
  );
};
