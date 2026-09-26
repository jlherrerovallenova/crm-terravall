import React from 'react';
import { Sparkles, FileCheck2, Printer, ArrowRight } from 'lucide-react';
import type { ValuationData } from './types';
import { ValuationKpiGrid } from './ValuationKpiGrid';
import { ValuationCoefficientsList } from './ValuationCoefficientsList';
import { ValuationComparableTable } from './ValuationComparableTable';

interface ValuationResultViewProps {
  currentValuation: ValuationData;
  onPrint: (val: ValuationData) => void;
  onConvertToProperty: (val: ValuationData) => void;
}

export const ValuationResultView: React.FC<ValuationResultViewProps> = ({
  currentValuation,
  onPrint,
  onConvertToProperty
}) => {
  return (
    <div className="space-y-8 transition-opacity duration-300">
      {/* KPI Cards Grid */}
      <ValuationKpiGrid valuation={currentValuation} />

      {/* Action Bar */}
      <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <FileCheck2 className="text-primary" size={20} />
            Informe Profesional de Tasación ACM Generado
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Genera el PDF impreso A4 con el análisis comparativo o convierte esta valoración en un inmueble del CRM.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onPrint(currentValuation)}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Printer size={16} className="text-primary" />
            Imprimir Informe Tasación PDF (A4)
          </button>
          <button
            onClick={() => onConvertToProperty(currentValuation)}
            className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <ArrowRight size={16} />
            Convertir en Inmueble del CRM
          </button>
        </div>
      </div>

      {/* Coeffs & Witness Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ValuationCoefficientsList valuation={currentValuation} />
        <ValuationComparableTable valuation={currentValuation} />
      </div>

      {/* Markdown Appraisal Report */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-primary" size={20} />
          Informe de Valoración Inmobiliaria Exhaustivo (5 Secciones Markdown)
        </h3>
        <div className="text-slate-800 leading-relaxed text-sm whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-150 font-serif shadow-inner">
          {currentValuation.ai_opinion}
        </div>
      </div>
    </div>
  );
};
