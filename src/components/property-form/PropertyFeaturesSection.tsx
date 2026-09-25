import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Info } from 'lucide-react';
import { SpecificFeaturesForm } from '../SpecificFeaturesForm';
import { energyOptions, cleanErrorMessage } from './types';

export const PropertyFeaturesSection: React.FC = () => {
  const form = useFormContext<any>();
  const propertyType = form.watch('type');

  return (
    <div className="space-y-8 transition-opacity duration-300">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-serif text-2xl text-slate-900 font-medium">3. Superficies y Características</h3>
        <p className="text-slate-500 text-xs mt-1">Detalla los metros cuadrados, estado y particularidades del inmueble.</p>
      </div>

      {/* Areas Built and Useful */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="area_built" className={form.formState.errors.area_built ? "text-red-500" : "font-semibold text-slate-800"}>
            Superficie Construida (M²)*
          </Label>
          <div className="relative">
            <Input 
              id="area_built" 
              type="number" 
              className="pr-10 h-11 rounded-xl"
              error={!!form.formState.errors.area_built} 
              {...form.register("area_built", { valueAsNumber: true })} 
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">m²</span>
          </div>
          {form.formState.errors.area_built && <p className="text-xs text-red-500">{cleanErrorMessage(form.formState.errors.area_built.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="area_useful" className={form.formState.errors.area_useful ? "text-red-500" : "font-semibold text-slate-800"}>
            Superficie Útil (M²)*
          </Label>
          <div className="relative">
            <Input 
              id="area_useful" 
              type="number" 
              className="pr-10 h-11 rounded-xl"
              error={!!form.formState.errors.area_useful} 
              {...form.register("area_useful", { valueAsNumber: true })} 
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">m²</span>
          </div>
          {form.formState.errors.area_useful && <p className="text-xs text-red-500">{cleanErrorMessage(form.formState.errors.area_useful.message)}</p>}
        </div>
      </div>

      {/* Estado de Conservación Cards */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-800">Estado del Inmueble</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'buen_estado', label: 'Buen estado', desc: 'Listo para entrar a vivir' },
            { value: 'a_reformar', label: 'A reformar', desc: 'Requiere obras de reforma' },
            { value: 'obra_nueva', label: 'Obra nueva', desc: 'Propiedad a estrenar' }
          ].map(cond => {
            const isSelected = form.watch('condition') === cond.value;
            return (
              <button
                key={cond.value}
                type="button"
                onClick={() => form.setValue('condition', cond.value as any, { shouldValidate: true })}
                className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col justify-between h-20 cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={`font-bold text-sm block ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                  {cond.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{cond.desc}</span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.condition && <p className="text-xs text-red-500 mt-1">{form.formState.errors.condition.message}</p>}
      </div>

      {/* Dinámicamente renderizar las características del tipo de inmueble */}
      <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl space-y-6">
        <h4 className="font-serif text-lg text-slate-900 font-medium border-b border-primary/10 pb-2 flex items-center gap-2">
          <Info size={16} className="text-primary" />
          Características Específicas: {propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}
        </h4>
        <SpecificFeaturesForm type={propertyType} />
      </div>

      {/* Certificado Energético */}
      <div className="space-y-6 bg-slate-50/40 p-5 rounded-2xl border border-slate-150">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Eficiencia Energética (Consumos y Emisiones)</h4>
        
        {/* Clase Energética */}
        <div className="space-y-3">
          <Label className="font-semibold text-slate-700">Consumo Energético</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {energyOptions.map(opt => {
              const isSelected = form.watch('energy_certificate') === opt;
              let btnStyle = '';
              
              if (isSelected) {
                if (opt === 'A') btnStyle = 'bg-[#00a651] text-white border-[#00a651] font-bold shadow-xs';
                else if (opt === 'B') btnStyle = 'bg-[#5cb85c] text-white border-[#5cb85c] font-bold shadow-xs';
                else if (opt === 'C') btnStyle = 'bg-[#bfd730] text-black border-[#bfd730] font-bold shadow-xs';
                else if (opt === 'D') btnStyle = 'bg-[#fff200] text-black border-[#fff200] font-bold shadow-xs';
                else if (opt === 'E') btnStyle = 'bg-[#ffc20e] text-black border-[#ffc20e] font-bold shadow-xs';
                else if (opt === 'F') btnStyle = 'bg-[#f58220] text-white border-[#f58220] font-bold shadow-xs';
                else if (opt === 'G') btnStyle = 'bg-[#ed1c24] text-white border-[#ed1c24] font-bold shadow-xs';
                else btnStyle = 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs';
              } else {
                btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => form.setValue('energy_certificate', opt as any, { shouldValidate: true })}
                  className={`h-10 rounded-lg border text-[11px] flex items-center justify-center transition-colors cursor-pointer ${btnStyle}`}
                >
                  <span className="notranslate" translate="no">
                    {opt === 'en_tramite' ? 'En trámite' : opt.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="energy_consumption">Valor de Consumo Energético (kWh/m² año)</Label>
            <Input id="energy_consumption" type="number" step="any" placeholder="Ej. 120" {...form.register("energy_consumption", { valueAsNumber: true })} />
          </div>
        </div>

        {/* Emisiones */}
        <div className="space-y-3 pt-2">
          <Label className="font-semibold text-slate-700">Calificación de Emisiones CO₂</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {energyOptions.map(opt => {
              const isSelected = form.watch('emissions_certificate') === opt;
              let btnStyle = '';
              
              if (isSelected) {
                if (opt === 'A') btnStyle = 'bg-[#00a651] text-white border-[#00a651] font-bold shadow-xs';
                else if (opt === 'B') btnStyle = 'bg-[#5cb85c] text-white border-[#5cb85c] font-bold shadow-xs';
                else if (opt === 'C') btnStyle = 'bg-[#bfd730] text-black border-[#bfd730] font-bold shadow-xs';
                else if (opt === 'D') btnStyle = 'bg-[#fff200] text-black border-[#fff200] font-bold shadow-xs';
                else if (opt === 'E') btnStyle = 'bg-[#ffc20e] text-black border-[#ffc20e] font-bold shadow-xs';
                else if (opt === 'F') btnStyle = 'bg-[#f58220] text-white border-[#f58220] font-bold shadow-xs';
                else if (opt === 'G') btnStyle = 'bg-[#ed1c24] text-white border-[#ed1c24] font-bold shadow-xs';
                else btnStyle = 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs';
              } else {
                btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => form.setValue('emissions_certificate', opt as any, { shouldValidate: true })}
                  className={`h-10 rounded-lg border text-[11px] flex items-center justify-center transition-colors cursor-pointer ${btnStyle}`}
                >
                  <span className="notranslate" translate="no">
                    {opt === 'en_tramite' ? 'En trámite' : opt.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emissions">Valor de Emisiones (kg CO₂/m² año)</Label>
            <Input id="emissions" type="number" step="any" placeholder="Ej. 25" {...form.register("emissions", { valueAsNumber: true })} />
          </div>
        </div>

      </div>
    </div>
  );
};
