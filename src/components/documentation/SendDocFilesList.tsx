import React from 'react';
import type { PropertyDocument } from '@/schema/property.schema';
import { CheckSquare, Square } from 'lucide-react';
import { Label } from '../ui/label';
import { formatFileSize } from '@/lib/utils';

interface SendDocFilesListProps {
  realDocs: PropertyDocument[];
  selectedDocIds: Set<string>;
  onToggleDocSelection: (id: string) => void;
  onSelectAll: () => void;
  onSelectSellersOnly: () => void;
  onSelectBuyersOnly: () => void;
  onDeselectAll: () => void;
}

export const SendDocFilesList: React.FC<SendDocFilesListProps> = ({
  realDocs,
  selectedDocIds,
  onToggleDocSelection,
  onSelectAll,
  onSelectSellersOnly,
  onSelectBuyersOnly,
  onDeselectAll
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Documentación a Incluir ({selectedDocIds.size} de {realDocs.length} seleccionados)
          </Label>
          <p className="text-[11px] text-slate-400">
            Selecciona qué documentos se enlazarán en el dossier de compraventa.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] font-bold text-slate-600 hover:text-primary px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={onSelectSellersOnly}
            className="text-[11px] font-bold text-slate-600 hover:text-primary px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Solo Vendedor
          </button>
          <button
            type="button"
            onClick={onSelectBuyersOnly}
            className="text-[11px] font-bold text-slate-600 hover:text-primary px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Solo Comprador
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
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
              <button
                type="button"
                key={doc.id}
                onClick={() => onToggleDocSelection(doc.id)}
                className={`flex items-start text-left w-full gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
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
                    <span className="font-semibold text-slate-800 truncate">
                      {doc.title}
                    </span>
                    <span className={`px-1.5 py-0.2 text-[9px] rounded font-medium shrink-0 uppercase ${catBadge}`}>
                      {doc.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES') : 'Fecha no disp.'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
