import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Info, 
  Percent, 
  PiggyBank, 
  Scale, 
  Building 
} from 'lucide-react';

interface MortgageCalculatorProps {
  price?: number;
  isNewWork?: boolean;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ 
  price: initialPrice = 180000, 
  isNewWork: initialIsNewWork = false 
}) => {
  const [propertyPrice, setPropertyPrice] = useState<number>(initialPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [isNewWork, setIsNewWork] = useState<boolean>(initialIsNewWork);
  const [isReducedITP, setIsReducedITP] = useState<boolean>(false);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(3.0);
  const [showExpensesDetails, setShowExpensesDetails] = useState<boolean>(false);

  // 1. Cálculos de Gastos e Impuestos de Compraventa
  let taxRate = isNewWork ? 0.115 : (isReducedITP ? 0.04 : 0.08); // 8% ITP general o 4% reducido en CyL | 10% IVA + 1.5% AJD en Obra Nueva
  const taxAmount = Math.round(propertyPrice * taxRate);

  // Escala aproximada de Notaría según aranceles oficiales (tramo decreciente)
  const notaryFee = Math.round(500 + propertyPrice * 0.002);

  // Registro de la Propiedad (~60% del arancel notarial)
  const registryFee = Math.round(300 + propertyPrice * 0.001);

  // Gestoría y Tasación fija aproximada
  const gestoriaFee = 380;
  const tasacionFee = 390;

  const totalExpenses = taxAmount + notaryFee + registryFee + gestoriaFee + tasacionFee;

  // 2. Cálculos de Entrada e Hipoteca
  const downPaymentAmount = Math.round(propertyPrice * (downPaymentPercent / 100));
  const mortgageAmount = Math.max(0, propertyPrice - downPaymentAmount);

  // Ahorros totales en efectivo necesarios = Entrada (20%) + Todos los Gastos de Compra
  const totalSavingsNeeded = downPaymentAmount + totalExpenses;

  // 3. Cálculo de la Cuota Mensual de Hipoteca (Fórmula Francesa)
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = loanYears * 12;

  let monthlyPayment = 0;
  if (monthlyRate > 0 && mortgageAmount > 0) {
    monthlyPayment = Math.round(
      (mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
  } else if (mortgageAmount > 0) {
    monthlyPayment = Math.round(mortgageAmount / totalMonths);
  }

  const totalPaidBack = monthlyPayment * totalMonths;
  const totalInterests = Math.max(0, totalPaidBack - mortgageAmount);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Calculator className="text-primary" size={24} />
          Simulador Hipotecario y Gastos
        </h3>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Castilla y León
        </span>
      </div>

      {/* Main Results Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly Payment Card */}
        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 space-y-1 relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Cuota Mensual Estimada</span>
          <div className="text-3xl font-black text-primary">
            {monthlyPayment > 0 ? `${formatPrice(monthlyPayment)} / mes` : '0 € / mes'}
          </div>
          <p className="text-[11px] text-primary/80 font-medium">
            Financiando {formatPrice(mortgageAmount)} ({100 - downPaymentPercent}% del precio)
          </p>
        </div>

        {/* Total Cash Savings Needed Card */}
        <div className="bg-slate-900 p-5 rounded-2xl text-white space-y-1 relative overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ahorros Totales Necesarios</span>
          <div className="text-3xl font-black text-white">
            {formatPrice(totalSavingsNeeded)}
          </div>
          <p className="text-[11px] text-slate-400">
            Entrada ({formatPrice(downPaymentAmount)}) + Gastos ({formatPrice(totalExpenses)})
          </p>
        </div>
      </div>

      {/* Interactive Inputs */}
      <div className="space-y-5 pt-2">
        {/* Row 1: Precio & Entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Precio del Inmueble (€)</label>
            <input
              type="number"
              min={10000}
              step={5000}
              value={propertyPrice}
              onChange={e => setPropertyPrice(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs font-semibold"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">Entrada Aportada ({downPaymentPercent}%)</label>
              <span className="text-xs font-bold text-primary">{formatPrice(downPaymentAmount)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={downPaymentPercent}
              onChange={e => setDownPaymentPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Row 2: Tipo de Vivienda e Impuestos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo de Vivienda</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsNewWork(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !isNewWork 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Segunda Mano (ITP)
              </button>
              <button
                type="button"
                onClick={() => setIsNewWork(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isNewWork 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Obra Nueva (IVA+AJD)
              </button>
            </div>
          </div>

          {!isNewWork && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Modalidad de ITP (Castilla y León)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsReducedITP(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !isReducedITP 
                      ? 'bg-primary/10 text-primary border-primary/30' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  General (8%)
                </button>
                <button
                  type="button"
                  onClick={() => setIsReducedITP(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isReducedITP 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Reducido (4%) *
                </button>
              </div>
            </div>
          )}
        </div>

        {isReducedITP && !isNewWork && (
          <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-medium">
            * ITP Reducido del 4% aplicable en Castilla y León para jóvenes menores de 36 años, vivienda VPO o familias numerosas.
          </p>
        )}

        {/* Row 3: Plazo e Interés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-700">Plazo de la Hipoteca</label>
              <span className="text-xs font-bold text-slate-900">{loanYears} años</span>
            </div>
            <input
              type="range"
              min={10}
              max={30}
              step={5}
              value={loanYears}
              onChange={e => setLoanYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo de Interés Anual (%)</label>
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.1}
              value={interestRate}
              onChange={e => setInterestRate(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Expenses Breakdown Accordion */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExpensesDetails(!showExpensesDetails)}
          className="w-full bg-slate-50 px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <PiggyBank size={16} className="text-primary" />
            Desglose de Gastos e Impuestos de Compraventa ({formatPrice(totalExpenses)})
          </span>
          {showExpensesDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showExpensesDetails && (
          <div className="p-4 space-y-2 bg-white text-xs divide-y divide-slate-100 text-slate-700">
            <div className="flex justify-between py-1.5">
              <span>{isNewWork ? 'IVA (10%) + AJD (1.5%)' : (isReducedITP ? 'Impuesto ITP Reducido (4%)' : 'Impuesto ITP General (8%)')}</span>
              <span className="font-bold text-slate-900">{formatPrice(taxAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Notaría (Arancel Oficial estimado)</span>
              <span className="font-semibold">{formatPrice(notaryFee)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Registro de la Propiedad</span>
              <span className="font-semibold">{formatPrice(registryFee)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Gestoría Administrativa</span>
              <span className="font-semibold">{formatPrice(gestoriaFee)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Tasación Oficial del Banco</span>
              <span className="font-semibold">{formatPrice(tasacionFee)}</span>
            </div>
            <div className="flex justify-between pt-2.5 font-bold text-slate-900 text-sm">
              <span>Gastos Totales Adicionales</span>
              <span className="text-primary">{formatPrice(totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Note */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
        <span>
          Simulación orientativa calculada según impuestos vigentes en Castilla y León y aranceles notariales. Intereses totales pagados en {loanYears} años: <strong>{formatPrice(totalInterests)}</strong>.
        </span>
      </div>
    </div>
  );
};
