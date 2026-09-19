import React from 'react';
import { formatPrice } from '@/lib/utils';
import { PiggyBank, TrendingUp } from 'lucide-react';

interface SimuladorResultsPanelProps {
  downPaymentPercent: number;
  monthlyPayment: number;
  mortgageAmount: number;
  loanYears: number;
  interestRate: number;
  totalSavingsNeeded: number;
  downPaymentAmount: number;
  totalExpenses: number;
  isNewWork: boolean;
  isReducedITP: boolean;
  taxAmount: number;
  notaryFee: number;
  registryFee: number;
  gestoriaFee: number;
  tasacionFee: number;
  totalInterests: number;
  totalPaidBack: number;
}

export const SimuladorResultsPanel: React.FC<SimuladorResultsPanelProps> = ({
  downPaymentPercent,
  monthlyPayment,
  mortgageAmount,
  loanYears,
  interestRate,
  totalSavingsNeeded,
  downPaymentAmount,
  totalExpenses,
  isNewWork,
  isReducedITP,
  taxAmount,
  notaryFee,
  registryFee,
  gestoriaFee,
  tasacionFee,
  totalInterests,
  totalPaidBack,
}) => {
  return (
    <div className="lg:col-span-7 space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Cuota Mensual */}
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Cuota Mensual Estimada</span>
            <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {100 - downPaymentPercent}% Financiado
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
            {formatPrice(monthlyPayment)} <span className="text-sm font-semibold text-primary/80">/ mes</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Préstamo de <strong>{formatPrice(mortgageAmount)}</strong> a {loanYears} años al {interestRate}%.
          </p>
        </div>

        {/* Ahorros Totales */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-2 relative overflow-hidden shadow-md">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Ahorros Totales en Efectivo</span>
            <span className="text-[11px] font-bold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
              Disponibilidad Requerida
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {formatPrice(totalSavingsNeeded)}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Entrada ({formatPrice(downPaymentAmount)}) + Impuestos y Gastos ({formatPrice(totalExpenses)}).
          </p>
        </div>
      </div>

      {/* Detailed Expenses Table */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="flex items-center gap-2">
            <PiggyBank className="text-primary" size={20} />
            Desglose Detallado de Impuestos y Gastos de Compraventa
          </span>
          <span className="text-xs font-black text-primary bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
            Total: {formatPrice(totalExpenses)}
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Base / Tipo Aplicado</th>
                <th className="px-4 py-3 text-right">Importe Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  {isNewWork ? 'IVA (10%) + AJD (1.5%)' : (isReducedITP ? 'Impuesto ITP Reducido (4%)' : 'Impuesto ITP General (8%)')}
                </td>
                <td className="px-4 py-3.5 text-slate-500">
                  {isNewWork ? 'Obra Nueva' : (isReducedITP ? 'Jóvenes <36 / VPO en CyL' : 'Vivienda Segunda Mano')}
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">{formatPrice(taxAmount)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-semibold">Notaría</td>
                <td className="px-4 py-3.5 text-slate-500">Arancel oficial regulado por RD</td>
                <td className="px-4 py-3.5 text-right font-bold">{formatPrice(notaryFee)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-semibold">Registro de la Propiedad</td>
                <td className="px-4 py-3.5 text-slate-500">Arancel oficial regulado por RD</td>
                <td className="px-4 py-3.5 text-right font-bold">{formatPrice(registryFee)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-semibold">Gestoría Administrativa</td>
                <td className="px-4 py-3.5 text-slate-500">Tramitación de escritura e impuestos</td>
                <td className="px-4 py-3.5 text-right font-bold">{formatPrice(gestoriaFee)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-semibold">Tasación Oficial del Banco</td>
                <td className="px-4 py-3.5 text-slate-500">Valoración homologada por la entidad financiera</td>
                <td className="px-4 py-3.5 text-right font-bold">{formatPrice(tasacionFee)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Summary Info Box */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Resumen del Préstamo Hipotecario a {loanYears} años
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">Capital Solicitado</span>
            <span className="text-sm font-bold text-slate-900">{formatPrice(mortgageAmount)}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">Intereses Totales</span>
            <span className="text-sm font-bold text-slate-900">{formatPrice(totalInterests)}</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-medium">Total Devuelto al Banco</span>
            <span className="text-sm font-bold text-slate-900">{formatPrice(totalPaidBack)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
