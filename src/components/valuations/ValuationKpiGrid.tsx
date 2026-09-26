import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ValuationData } from './types';

interface ValuationKpiGridProps {
  valuation: ValuationData;
}

export const ValuationKpiGrid: React.FC<ValuationKpiGridProps> = ({ valuation }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Mínimo de Cierre</span>
        <div className="text-2xl font-extrabold text-slate-900">{formatPrice(valuation.price_min)}</div>
        <p className="text-[11px] text-slate-500">Suelo de negociación rápida</p>
      </div>

      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-xs space-y-1 relative overflow-hidden">
        <div className="absolute right-3 top-3 text-primary/20">
          <Sparkles size={40} />
        </div>
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Valor de Tasación Objetivo</span>
        <div className="text-3xl font-black text-primary">{formatPrice(valuation.price_target)}</div>
        <p className="text-[11px] text-primary/80 font-medium">Precio central adoptado ({valuation.price_per_m2} €/m²)</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Máximo de Salida</span>
        <div className="text-2xl font-extrabold text-slate-900">{formatPrice(valuation.price_max)}</div>
        <p className="text-[11px] text-slate-500">Publicación con margen</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimación Alquiler</span>
        <div className="text-2xl font-extrabold text-slate-900">{valuation.rent_target ? formatPrice(valuation.rent_target) : '-'} / mes</div>
        <p className="text-[11px] text-emerald-600 font-bold">Yield: {valuation.gross_yield || 5.7}% | PER: {valuation.per_years || 17.5} años</p>
      </div>
    </div>
  );
};
