import React from 'react';
import { Building2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ValuationData, WitnessProperty } from './types';

interface ValuationComparableTableProps {
  valuation: ValuationData;
}

export const ValuationComparableTable: React.FC<ValuationComparableTableProps> = ({ valuation }) => {
  const comps = valuation.comparable_properties;
  const hasComps = comps && comps.length > 0;

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
        <Building2 size={16} className="text-primary" />
        Tabla de Testigos Comparables Filtrados (&lt; 500m)
      </h4>
      {hasComps ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-3 py-2">Testigo / Ubicación</th>
                <th className="px-3 py-2">Superficie</th>
                <th className="px-3 py-2">Precio Ofertado</th>
                <th className="px-3 py-2">€/m² Base</th>
                <th className="px-3 py-2 text-right">€/m² Homogeneizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {comps.map((comp: WitnessProperty) => (
                <tr key={comp.id || `${comp.title}-${comp.price_asked}-${comp.area_built}`}>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-slate-900 block">{comp.title}</span>
                    <span className="text-[10px] text-slate-400">{comp.notes}</span>
                  </td>
                  <td className="px-3 py-2.5">{comp.area_built} m²</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{formatPrice(comp.price_asked)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{comp.price_per_m2_asked} €/m²</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-primary">
                    {comp.price_per_m2_adjusted} €/m²
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
          Calculado mediante muestra homogeneizada en {valuation.city} ({valuation.price_per_m2} €/m² medio).
        </div>
      )}
    </div>
  );
};
