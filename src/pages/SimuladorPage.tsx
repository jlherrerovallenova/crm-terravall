import React, { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { 
  Calculator, 
  PiggyBank, 
  Building, 
  Scale, 
  HelpCircle, 
  Info, 
  Percent, 
  FileText, 
  Printer, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';

export const SimuladorPage: React.FC = () => {
  const [propertyPrice, setPropertyPrice] = useState<number>(220000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [isNewWork, setIsNewWork] = useState<boolean>(false);
  const [isReducedITP, setIsReducedITP] = useState<boolean>(false);
  const [loanYears, setLoanYears] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(3.0);
  const [showAmortizationTable, setShowAmortizationTable] = useState<boolean>(false);

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

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-16">
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
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
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
              <label className="font-bold text-slate-700">Precio de Compraventa (€)</label>
              <span className="font-extrabold text-primary text-sm">{formatPrice(propertyPrice)}</span>
            </div>
            <input
              type="number"
              min={20000}
              step={5000}
              value={propertyPrice}
              onChange={e => setPropertyPrice(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50/50"
            />
          </div>

          {/* Entrada Aportada Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Entrada Aportada ({downPaymentPercent}%)</label>
              <span className="font-bold text-slate-900">{formatPrice(downPaymentAmount)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={downPaymentPercent}
              onChange={e => setDownPaymentPercent(Number(e.target.value))}
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
            <label className="block text-xs font-bold text-slate-700">Tipo de Vivienda</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsNewWork(false)}
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
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
                className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
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
              <label className="block text-xs font-bold text-slate-700">Modalidad ITP (Castilla y León)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsReducedITP(false)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                <label className="font-bold text-slate-700">Plazo Hipoteca</label>
                <span className="font-bold text-slate-900">{loanYears} años</span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={5}
                value={loanYears}
                onChange={e => setLoanYears(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Tipo Interés Anual (%)</label>
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Results & Analytics (7 cols) */}
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

      </div>
    </div>
  );
};
