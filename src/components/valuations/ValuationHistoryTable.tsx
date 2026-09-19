import React from 'react';
import { FileText, Eye, Printer, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ValuationData } from './types';

interface ValuationHistoryTableProps {
  history: ValuationData[];
  loadingHistory: boolean;
  onSelectValuation: (item: ValuationData) => void;
  onPrintValuation: (item: ValuationData) => void;
  onDeleteValuation: (id: string, e: React.MouseEvent) => void;
  onGoToNew: () => void;
}

export const ValuationHistoryTable: React.FC<ValuationHistoryTableProps> = ({
  history,
  loadingHistory,
  onSelectValuation,
  onPrintValuation,
  onDeleteValuation,
  onGoToNew
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-lg">Historial de Tasaciones Realizadas</h3>
        <span className="text-xs text-slate-500 font-medium">{history.length} tasaciones registradas</span>
      </div>

      {loadingHistory ? (
        <div className="p-12 text-center text-slate-400 text-xs">Cargando historial de tasaciones...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <FileText size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No hay tasaciones en archivo</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Crea una nueva tasación para empezar a registrar el historial.</p>
          <button
            onClick={onGoToNew}
            className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl"
          >
            Nueva Tasación
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Propietario</th>
                <th className="px-6 py-3">Inmueble</th>
                <th className="px-6 py-3">Ubicación</th>
                <th className="px-6 py-3">Valor Objetivo</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.map((item) => (
                <tr 
                  key={item.id}
                  onClick={() => onSelectValuation(item)}
                  className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">{item.client_name}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className="font-semibold capitalize text-slate-800">{item.property_type}</span> • {item.area_built} m²
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{item.city} ({item.province})</td>
                  <td className="px-6 py-4 font-bold text-primary">{formatPrice(item.price_target)}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectValuation(item)}
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Ver tasación"
                        aria-label={`Ver tasación de ${item.client_name}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintValuation(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Imprimir Informe PDF"
                        aria-label={`Imprimir informe PDF de ${item.client_name}`}
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={e => onDeleteValuation(item.id!, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar tasación"
                        aria-label={`Eliminar tasación de ${item.client_name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
