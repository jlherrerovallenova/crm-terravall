import React from 'react';
import { formatPrice } from '@/lib/utils';

interface MortgageHighlightsProps {
  monthlyPayment: number;
  downPaymentPercent: number;
  mortgageAmount: number;
  loanYears: number;
  interestRate: number;
  totalSavingsNeeded: number;
  downPaymentAmount: number;
  totalExpenses: number;
}

export const MortgageHighlights: React.FC<MortgageHighlightsProps> = ({
  monthlyPayment,
  downPaymentPercent,
  mortgageAmount,
  loanYears,
  interestRate,
  totalSavingsNeeded,
  downPaymentAmount,
  totalExpenses,
}) => {
  return (
    <div className="space-y-3">
      {/* Monthly Payment Card */}
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Cuota Mensual Estimada</span>
          <span className="text-[10px] font-medium text-primary/70">{100 - downPaymentPercent}% financiado</span>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {formatPrice(monthlyPayment)} <span className="text-xs font-semibold text-primary/80">/ mes</span>
        </div>
        <div className="text-[11px] text-slate-500 pt-0.5">
          Préstamo: <strong className="text-slate-700">{formatPrice(mortgageAmount)}</strong> a {loanYears} años ({interestRate}%)
        </div>
      </div>

      {/* Total Cash Savings Needed Card */}
      <div className="bg-slate-900 p-4 rounded-xl text-white space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Ahorros en Efectivo Necesarios</span>
          <span className="text-[10px] font-medium text-slate-400">Entrada + Gastos</span>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {formatPrice(totalSavingsNeeded)}
        </div>
        <div className="text-[11px] text-slate-400 pt-0.5 flex justify-between gap-2 flex-wrap">
          <span>Entrada: <strong className="text-white">{formatPrice(downPaymentAmount)}</strong> ({downPaymentPercent}%)</span>
          <span>Gastos: <strong className="text-white">{formatPrice(totalExpenses)}</strong></span>
        </div>
      </div>
    </div>
  );
};
