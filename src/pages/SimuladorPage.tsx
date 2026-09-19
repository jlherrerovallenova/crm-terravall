import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Calculator, Building, Printer } from 'lucide-react';
import { SimuladorResultsPanel } from '@/components/simulador/SimuladorResultsPanel';

const handlePrintSummary = () => {
  window.print();
};

export const SimuladorPage: React.FC = () => {
  const [propertyPrice, setPropertyPrice] = useState<number>(220000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [isNewWork, setIsNewWork] = useState<boolean>(false);
  const [isReducedITP, setIsReducedITP] = useState<boolean>(false);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(3.0);

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
    <div className="space-y-8 transition-opacity duration-500 font-sans pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Calculator className="text-primary" size={32} />
            Simulador Hipotecario & Gastos de Compraventa
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Calculadora completa de cuotas, impuestos de Castilla y León y ahorros en efectivo requeridos.
          </p>
        </div>

        <button
          onClick={handlePrintSummary}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Printer size={16} />
          Imprimir Simulación
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building className="text-primary" size={18} />
            Parámetros de la Compraventa
          </h3>

          {/* Precio del Inmueble */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sim-price" className="font-bold text-slate-700">Precio de Compraventa (€)</label>
              <span className="font-extrabold text-primary text-sm">{formatPrice(propertyPrice)}</span>
            </div>
            <input
              id="sim-price"
              type="number"
              min={20000}
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
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50/50"
            />
          </div>

          {/* Entrada Aportada Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="sim-downpayment" className="font-bold text-slate-700">Entrada Aportada ({downPaymentPercent}%)</label>
              <span className="font-bold text-slate-900">{formatPrice(downPaymentAmount)}</span>
            </div>
            <input
              id="sim-downpayment"
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
              className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>0% (Sin entrada)</span>
              <span>20% (Estándar)</span>
              <span>50%</span>
            </div>
          </div>

          {/* Tipo de Vivienda */}
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-slate-700">Tipo de Vivienda</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsNewWork(false)}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                  !isNewWork 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Segunda Mano (ITP)
              </button>
              <button
                type="button"
                onClick={() => setIsNewWork(true)}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                  isNewWork 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Obra Nueva (IVA+AJD)
              </button>
            </div>
          </div>

          {/* Modalidad ITP en Castilla y León */}
          {!isNewWork && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <span className="block text-xs font-bold text-slate-700">Modalidad ITP (Castilla y León)</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsReducedITP(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isReducedITP 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Reducido (4%) *
                </button>
              </div>
              {isReducedITP && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium leading-relaxed">
                  * ITP Reducido del 4% en Castilla y León para compradores menores de 36 años, VPO o familias numerosas.
                </p>
              )}
            </div>
          )}

          {/* Plazo e Interés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="sim-years" className="font-bold text-slate-700">Plazo Hipoteca</label>
                <span className="font-bold text-slate-900">{loanYears} años</span>
              </div>
              <input
                id="sim-years"
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
                className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sim-interest" className="block text-xs font-bold text-slate-700">Tipo Interés Anual (%)</label>
              <input
                id="sim-interest"
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
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Results & Analytics (7 cols) */}
        <SimuladorResultsPanel
          downPaymentPercent={downPaymentPercent}
          monthlyPayment={monthlyPayment}
          mortgageAmount={mortgageAmount}
          loanYears={loanYears}
          interestRate={interestRate}
          totalSavingsNeeded={totalSavingsNeeded}
          downPaymentAmount={downPaymentAmount}
          totalExpenses={totalExpenses}
          isNewWork={isNewWork}
          isReducedITP={isReducedITP}
          taxAmount={taxAmount}
          notaryFee={notaryFee}
          registryFee={registryFee}
          gestoriaFee={gestoriaFee}
          tasacionFee={tasacionFee}
          totalInterests={totalInterests}
          totalPaidBack={totalPaidBack}
        />

      </div>
    </div>
  );
};
