import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Calculator, Info } from 'lucide-react';
import { MortgageHighlights } from './mortgage/MortgageHighlights';
import { MortgageExpensesAccordion } from './mortgage/MortgageExpensesAccordion';

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
  const taxRate = isNewWork ? 0.115 : (isReducedITP ? 0.04 : 0.08); // 8% ITP general o 4% reducido en CyL | 10% IVA + 1.5% AJD en Obra Nueva
  const taxAmount = Math.round(propertyPrice * taxRate);
  const notaryFee = Math.round(500 + propertyPrice * 0.002);
  const registryFee = Math.round(300 + propertyPrice * 0.001);
  const gestoriaFee = 380;
  const tasacionFee = 390;
  const totalExpenses = taxAmount + notaryFee + registryFee + gestoriaFee + tasacionFee;

  // 2. Cálculos de Entrada e Hipoteca
  const downPaymentAmount = Math.round(propertyPrice * (downPaymentPercent / 100));
  const mortgageAmount = Math.max(0, propertyPrice - downPaymentAmount);
  const totalSavingsNeeded = downPaymentAmount + totalExpenses;

  // 3. Cálculo de Cuota Mensual (Fórmula Francesa)
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5 font-sans w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <Calculator className="text-primary shrink-0" size={20} />
          Simulador Hipoteca y Gastos
        </h3>
        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
          Castilla y León
        </span>
      </div>

      {/* Main Results Highlight Cards */}
      <MortgageHighlights
        monthlyPayment={monthlyPayment}
        downPaymentPercent={downPaymentPercent}
        mortgageAmount={mortgageAmount}
        loanYears={loanYears}
        interestRate={interestRate}
        totalSavingsNeeded={totalSavingsNeeded}
        downPaymentAmount={downPaymentAmount}
        totalExpenses={totalExpenses}
      />

      {/* Inputs Form */}
      <div className="space-y-4 pt-1">
        {/* Precio del Inmueble */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="mortgage-property-price" className="text-xs font-bold text-slate-700">Precio del Inmueble</label>
            <span className="text-xs font-extrabold text-slate-900">{formatPrice(propertyPrice)}</span>
          </div>
          <input
            id="mortgage-property-price"
            type="number"
            min={10000}
            step={5000}
            value={propertyPrice}
            onChange={e => {
              const raw = e.target.value;
              if (!raw || !raw.trim()) {
                setPropertyPrice(0);
                return;
              }
              const val = Number(raw);
              if (!Number.isNaN(val)) {
                setPropertyPrice(Math.max(0, val));
              }
            }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50/50"
          />
        </div>

        {/* Entrada Aportada Slider */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-bold text-slate-700">Entrada Aportada</span>
            <span className="font-bold text-primary">{downPaymentPercent}% ({formatPrice(downPaymentAmount)})</span>
          </div>
          <input
            type="range"
            aria-label="Porcentaje de entrada aportada"
            min={0}
            max={50}
            step={5}
            value={downPaymentPercent}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setDownPaymentPercent(Number.isNaN(val) ? 0 : val);
            }}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Tipo de Vivienda Selector */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-1.5">Tipo de Vivienda e Impuestos</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsNewWork(false)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center truncate ${
                !isNewWork 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              2ª Mano (ITP)
            </button>
            <button
              type="button"
              onClick={() => setIsNewWork(true)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center truncate ${
                isNewWork 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Obra Nueva (IVA)
            </button>
          </div>
        </div>

        {/* Modalidad ITP en CyL */}
        {!isNewWork && (
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1.5">Modalidad ITP (Castilla y León)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsReducedITP(false)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center truncate ${
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
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center truncate ${
                  isReducedITP 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Reducido (4%) *
              </button>
            </div>
            {isReducedITP && (
              <p className="text-[10px] text-emerald-700 bg-emerald-50 p-2 mt-1.5 rounded-lg border border-emerald-200 font-medium">
                * Para jóvenes menores de 36 años, VPO o familias numerosas en CyL.
              </p>
            )}
          </div>
        )}

        {/* Plazo e Interés */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-slate-700">Plazo</span>
              <span className="font-bold text-slate-900">{loanYears} años</span>
            </div>
            <input
              type="range"
              aria-label="Plazo de amortización en años"
              min={10}
              max={30}
              step={5}
              value={loanYears}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                setLoanYears(Number.isNaN(val) ? 10 : val);
              }}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
          </div>

          <div>
            <label htmlFor="mortgage-interest-rate" className="block text-xs font-bold text-slate-700 mb-1">Interés Anual (%)</label>
            <input
              id="mortgage-interest-rate"
              type="number"
              min={0.5}
              max={10}
              step={0.1}
              value={interestRate}
              onChange={e => {
                const raw = e.target.value;
                if (!raw || !raw.trim()) {
                  setInterestRate(0);
                  return;
                }
                const val = Number(raw);
                if (!Number.isNaN(val)) {
                  setInterestRate(Math.max(0, val));
                }
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs font-bold bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Expenses Breakdown Accordion */}
      <MortgageExpensesAccordion
        showExpensesDetails={showExpensesDetails}
        setShowExpensesDetails={setShowExpensesDetails}
        totalExpenses={totalExpenses}
        isNewWork={isNewWork}
        isReducedITP={isReducedITP}
        taxAmount={taxAmount}
        notaryFee={notaryFee}
        registryFee={registryFee}
        gestoriaFee={gestoriaFee}
        tasacionFee={tasacionFee}
      />

      {/* Footer Info Note */}
      <div className="flex items-start gap-1.5 text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-normal">
        <Info size={13} className="shrink-0 text-slate-400 mt-0.5" />
        <span>
          Simulación orientativa. Intereses totales pagados en {loanYears} años: <strong>{formatPrice(totalInterests)}</strong>.
        </span>
      </div>
    </div>
  );
};
