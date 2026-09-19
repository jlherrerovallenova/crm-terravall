import React from 'react';
import { Sparkles, FileCheck2, Printer, ArrowRight, Layers, Building2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ValuationData, WitnessProperty } from './types';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Mínimo de Cierre</span>
          <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_min)}</div>
          <p className="text-[11px] text-slate-500">Suelo de negociación rápida</p>
        </div>

        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-xs space-y-1 relative overflow-hidden">
          <div className="absolute right-3 top-3 text-primary/20">
            <Sparkles size={40} />
          </div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Valor de Tasación Objetivo</span>
          <div className="text-3xl font-black text-primary">{formatPrice(currentValuation.price_target)}</div>
          <p className="text-[11px] text-primary/80 font-medium">Precio central adoptado ({currentValuation.price_per_m2} €/m²)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Máximo de Salida</span>
          <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_max)}</div>
          <p className="text-[11px] text-slate-500">Publicación con margen</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimación Alquiler</span>
          <div className="text-2xl font-extrabold text-slate-900">{currentValuation.rent_target ? formatPrice(currentValuation.rent_target) : '-'} / mes</div>
          <p className="text-[11px] text-emerald-600 font-bold">Yield: {currentValuation.gross_yield || 5.7}% | PER: {currentValuation.per_years || 17.5} años</p>
        </div>
      </div>

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
        {/* Technical Coefficients */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers size={16} className="text-primary" />
            Coeficientes ECO de Homogeneización
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex justify-between py-1 border-b border-slate-50">
              <span>Estado de conservación</span>
              <span className="font-bold">{currentValuation.coefficients?.state && currentValuation.coefficients.state > 0 ? `+${currentValuation.coefficients.state}%` : `${currentValuation.coefficients?.state || 0}%`}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-50">
              <span>Ascensor</span>
              <span className="font-bold">{currentValuation.has_elevator ? '+5%' : '-6%'}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-50">
              <span>Plaza de garaje</span>
              <span className="font-bold">{currentValuation.has_parking ? '+8%' : '0%'}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-50">
              <span>Terraza</span>
              <span className="font-bold">{currentValuation.has_terrace ? '+5%' : '0%'}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-50">
              <span>Certificación energética ({currentValuation.energy_certificate})</span>
              <span className="font-bold">{currentValuation.coefficients?.energy && currentValuation.coefficients.energy > 0 ? `+${currentValuation.coefficients.energy}%` : `${currentValuation.coefficients?.energy || 0}%`}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-50">
              <span>Ubicación, Vistas y Orientación ({currentValuation.orientation})</span>
              <span className="font-bold">+{currentValuation.coefficients?.location_views || 5}%</span>
            </li>
            <li className="flex justify-between pt-2 font-bold text-slate-900 text-sm">
              <span>Multiplicador Global Homogeneizado</span>
              <span className="text-primary">{currentValuation.coefficients?.totalMultiplier || 100}%</span>
            </li>
          </ul>
        </div>

        {/* Comparable Witness Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 size={16} className="text-primary" />
            Tabla de Testigos Comparables Filtrados (&lt; 500m)
          </h4>
          {currentValuation.comparable_properties && currentValuation.comparable_properties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2">Testigo / Ubicación</th>
                    <th className="px-3 py-2">Superficie</th>
                    <th className="px-3 py-2">Precio Ofertado</th>
                    <th className="px-3 py-2">€/m² Base</th>
                    <th className="px-3 py-2 text-right">€/m² Homogeneizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentValuation.comparable_properties.map((comp: WitnessProperty) => (
                    <tr key={comp.id || `${comp.title}-${comp.price_asked}-${comp.area_built}`}>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-900 block">{comp.title}</span>
                        <span className="text-[10px] text-slate-400">{comp.notes}</span>
                      </td>
                      <td className="px-3 py-2.5">{comp.area_built} m²</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{formatPrice(comp.price_asked)}</td>
                      <td className="px-3 py-2.5 text-slate-500">{comp.price_per_m2_asked} €/m²</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-primary">
                        {comp.price_per_m2_adjusted} €/m²
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
              Calculado mediante muestra homogeneizada en {currentValuation.city} ({currentValuation.price_per_m2} €/m² medio).
            </div>
          )}
        </div>
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
