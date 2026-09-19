import React from 'react';
import { formatPrice } from '@/lib/utils';
import { ChevronDown, ChevronUp, PiggyBank } from 'lucide-react';

interface MortgageExpensesAccordionProps {
  showExpensesDetails: boolean;
  setShowExpensesDetails: (show: boolean) => void;
  totalExpenses: number;
  isNewWork: boolean;
  isReducedITP: boolean;
  taxAmount: number;
  notaryFee: number;
  registryFee: number;
  gestoriaFee: number;
  tasacionFee: number;
}

export const MortgageExpensesAccordion: React.FC<MortgageExpensesAccordionProps> = ({
  showExpensesDetails,
  setShowExpensesDetails,
  totalExpenses,
  isNewWork,
  isReducedITP,
  taxAmount,
  notaryFee,
  registryFee,
  gestoriaFee,
  tasacionFee,
}) => {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setShowExpensesDetails(!showExpensesDetails)}
        className="w-full bg-slate-50 px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5 truncate">
          <PiggyBank size={15} className="text-primary shrink-0" />
          Desglose de Gastos ({formatPrice(totalExpenses)})
        </span>
        {showExpensesDetails ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
      </button>

      {showExpensesDetails && (
        <div className="p-3 space-y-1.5 bg-white text-[11px] divide-y divide-slate-100 text-slate-700">
          <div className="flex justify-between py-1">
            <span>{isNewWork ? 'IVA (10%) + AJD (1.5%)' : (isReducedITP ? 'ITP Reducido (4%)' : 'ITP General (8%)')}</span>
            <span className="font-bold text-slate-900">{formatPrice(taxAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Notaría (Arancel oficial est.)</span>
            <span className="font-medium">{formatPrice(notaryFee)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Registro de la Propiedad</span>
            <span className="font-medium">{formatPrice(registryFee)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Gestoría y Tasación</span>
            <span className="font-medium">{formatPrice(gestoriaFee + tasacionFee)}</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-slate-900 text-xs">
            <span>Gastos Totales Adicionales</span>
            <span className="text-primary">{formatPrice(totalExpenses)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
