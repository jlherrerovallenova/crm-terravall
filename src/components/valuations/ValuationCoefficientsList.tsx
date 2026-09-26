import React from 'react';
import { Layers } from 'lucide-react';
import type { ValuationData } from './types';

interface ValuationCoefficientsListProps {
  valuation: ValuationData;
}

export const ValuationCoefficientsList: React.FC<ValuationCoefficientsListProps> = ({ valuation }) => {
  const stateCoeff = valuation.coefficients?.state;
  const energyCoeff = valuation.coefficients?.energy;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
        <Layers size={16} className="text-primary" />
        Coeficientes ECO de Homogeneización
      </h4>
      <ul className="space-y-2 text-xs text-slate-600">
        <li className="flex justify-between py-1 border-b border-slate-50">
          <span>Estado de conservación</span>
          <span className="font-bold">
            {stateCoeff && stateCoeff > 0 ? `+${stateCoeff}%` : `${stateCoeff || 0}%`}
          </span>
        </li>
        <li className="flex justify-between py-1 border-b border-slate-50">
          <span>Ascensor</span>
          <span className="font-bold">{valuation.has_elevator ? '+5%' : '-6%'}</span>
        </li>
        <li className="flex justify-between py-1 border-b border-slate-50">
          <span>Plaza de garaje</span>
          <span className="font-bold">{valuation.has_parking ? '+8%' : '0%'}</span>
        </li>
        <li className="flex justify-between py-1 border-b border-slate-50">
          <span>Terraza</span>
          <span className="font-bold">{valuation.has_terrace ? '+5%' : '0%'}</span>
        </li>
        <li className="flex justify-between py-1 border-b border-slate-50">
          <span>Certificación energética ({valuation.energy_certificate})</span>
          <span className="font-bold">
            {energyCoeff && energyCoeff > 0 ? `+${energyCoeff}%` : `${energyCoeff || 0}%`}
          </span>
        </li>
        <li className="flex justify-between py-1 border-b border-slate-50">
          <span>Ubicación, Vistas y Orientación ({valuation.orientation})</span>
          <span className="font-bold">+{valuation.coefficients?.location_views || 5}%</span>
        </li>
        <li className="flex justify-between pt-2 font-bold text-slate-900 text-sm">
          <span>Multiplicador Global Homogeneizado</span>
          <span className="text-primary">{valuation.coefficients?.totalMultiplier || 100}%</span>
        </li>
      </ul>
    </div>
  );
};
