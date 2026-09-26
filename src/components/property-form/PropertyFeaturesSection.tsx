import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Info } from 'lucide-react';
import { SpecificFeaturesForm } from '../SpecificFeaturesForm';
import { cleanErrorMessage } from './types';
import { EnergyScaleSelector } from './EnergyScaleSelector';

interface SurfaceFieldProps {
  id: string;
  label: string;
  error?: unknown;
  registerProps: any;
}

const SurfaceField: React.FC<SurfaceFieldProps> = ({ id, label, error, registerProps }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className={`whitespace-nowrap ${error ? "text-red-500" : "font-semibold text-slate-800"}`}>
      {label}
    </Label>
    <div className="relative">
      <Input 
        id={id} 
        type="number" 
        className="pr-10 h-11 rounded-xl"
        error={!!error} 
        {...registerProps} 
      />
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">m²</span>
    </div>
    {error ? <p className="text-xs text-red-500">{cleanErrorMessage(error)}</p> : null}
  </div>
);

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
        <SurfaceField
          id="area_built"
          label="Superficie Construida (M²)*"
          error={form.formState.errors.area_built}
          registerProps={form.register("area_built", { valueAsNumber: true })}
        />
        <SurfaceField
          id="area_useful"
          label="Superficie Útil (M²)*"
          error={form.formState.errors.area_useful}
          registerProps={form.register("area_useful", { valueAsNumber: true })}
        />
      </div>

      {/* Estado de Conservación Cards */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-800 whitespace-nowrap">Estado del Inmueble</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'obra_nueva', label: 'Obra Nueva', desc: 'A estrenar' },
            { value: 'buen_estado', label: 'Buen Estado', desc: 'Listo para entrar' },
            { value: 'a_reformar', label: 'A Reformar', desc: 'Requiere actualización' }
          ].map(cond => {
            const isSelected = form.watch('condition') === cond.value;
            return (
              <button
                key={cond.value}
                type="button"
                onClick={() => form.setValue('condition', cond.value as any, { shouldValidate: true })}
                className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className={`font-bold text-sm block whitespace-nowrap ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                  {cond.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{cond.desc}</span>
              </button>
            );
          })}
        </div>
        {form.formState.errors.condition && <p className="text-xs text-red-500 mt-1">{cleanErrorMessage(form.formState.errors.condition.message)}</p>}
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
        
        <EnergyScaleSelector
          label="Consumo Energético"
          fieldName="energy_certificate"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="energy_consumption" className="whitespace-nowrap">Valor de Consumo Energético (kWh/m² año)</Label>
            <Input id="energy_consumption" type="number" step="any" placeholder="Ej. 120" {...form.register("energy_consumption", { valueAsNumber: true })} />
          </div>
        </div>

        <EnergyScaleSelector
          label="Calificación de Emisiones CO₂"
          fieldName="emissions_certificate"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emissions" className="whitespace-nowrap">Valor de Emisiones (kg CO₂/m² año)</Label>
            <Input id="emissions" type="number" step="any" placeholder="Ej. 25" {...form.register("emissions", { valueAsNumber: true })} />
          </div>
        </div>
      </div>
    </div>
  );
};
