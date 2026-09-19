import React from 'react';
import { FileCode, Copy } from 'lucide-react';

interface XmlPreviewModalProps {
  showXmlModal: boolean;
  setShowXmlModal: (show: boolean) => void;
  xmlFormat: 'kyero' | 'idealista';
  xmlPreview: string;
}

export const XmlPreviewModal: React.FC<XmlPreviewModalProps> = ({
  showXmlModal,
  setShowXmlModal,
  xmlFormat,
  xmlPreview,
}) => {
  if (!showXmlModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 text-white">
            <FileCode className="text-primary" size={20} />
            <span className="font-bold text-sm">Vista Previa Feed XML ({xmlFormat.toUpperCase()})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(xmlPreview);
                alert("¡Código XML copiado al portapapeles!");
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Copy size={14} />
              Copiar XML
            </button>
            <button
              onClick={() => setShowXmlModal(false)}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="p-6 overflow-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre leading-relaxed bg-slate-900/90">
          {xmlPreview}
        </div>
      </div>
    </div>
  );
};
