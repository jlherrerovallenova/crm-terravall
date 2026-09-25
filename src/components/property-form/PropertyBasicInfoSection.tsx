import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Lock } from 'lucide-react';
import { operations, propertyTypes, cleanErrorMessage } from './types';

interface PropertyBasicInfoSectionProps {
  agentsOptions: { id?: string; name: string }[];
}

export const PropertyBasicInfoSection: React.FC<PropertyBasicInfoSectionProps> = ({
  agentsOptions
}) => {
  const form = useFormContext<any>();
  const propertyType = form.watch('type');
  const watchPrice = form.watch('price');

  return (
    <div className="space-y-8 transition-opacity duration-300">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-serif text-2xl text-slate-900 font-medium">1. Tipo y Operación</h3>
        <p className="text-slate-500 text-xs mt-1">Elige los datos contractuales base y la tipología de la propiedad.</p>
      </div>

      {/* Operación */}
      <div className="space-y-2">
        <Label className="font-semibold text-slate-800">Tipo de Operación</Label>
        <div className="grid grid-cols-3 gap-3">
          {operations.map(op => {
            const isSelected = form.watch('operation') === op.value;
            return (
              <button
                key={op.value}
                type="button"
                onClick={() => form.setValue('operation', op.value as any, { shouldValidate: true })}
                className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-colors flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tipo de Inmueble Select Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          <Label htmlFor="type" className="font-semibold text-slate-800">Tipo de Propiedad *</Label>
          <select
            id="type"
            {...form.register("type")}
            onChange={(e) => form.setValue('type', e.target.value as any, { shouldValidate: true })}
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
          >
            {propertyTypes.map(pt => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subtypes (Conditional Dropdown) */}
        {propertyType === 'piso' && (
          <div className="space-y-2 transition-opacity duration-200">
            <Label htmlFor="subtype" className="font-semibold text-slate-800">Subtipo de Vivienda</Label>
            <select 
              id="subtype" 
              {...form.register("subtype")} 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="piso">Piso estándar</option>
              <option value="atico">Ático</option>
              <option value="duplex">Dúplex</option>
              <option value="estudio">Estudio</option>
            </select>
          </div>
        )}

        {propertyType === 'nave' && (
          <div className="space-y-2 transition-opacity duration-200">
            <Label htmlFor="subtype" className="font-semibold text-slate-800">Subtipo de Nave</Label>
            <select 
              id="subtype" 
              {...form.register("subtype")} 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="nave_industrial">Nave Industrial</option>
              <option value="nave_comercial">Nave Comercial / Logística</option>
            </select>
          </div>
        )}
      </div>

      {/* Price & Exceptional Situation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price" className={form.formState.errors.price ? "text-red-500" : "font-semibold text-slate-800"}>
            Precio de Salida (€) *
          </Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">€</span>
            <Input 
              id="price" 
              type="text"
              inputMode="numeric"
              className="pl-8 h-11 rounded-xl font-semibold text-slate-900"
              error={!!form.formState.errors.price} 
              value={watchPrice ? watchPrice.toLocaleString('es-ES') : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                const val = raw ? parseInt(raw, 10) : 0;
                form.setValue('price', val, { shouldValidate: true });
              }}
              placeholder="Ej: 320.000"
            />
          </div>
          {form.formState.errors.price && <p className="text-xs text-red-500">{cleanErrorMessage(form.formState.errors.price.message)}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exceptional_situation" className="font-semibold text-slate-800">Situación Jurídica</Label>
          <select 
            id="exceptional_situation" 
            {...form.register("exceptional_situation")} 
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="ninguna">Sin condiciones especiales</option>
            <option value="ocupada">Ocupada ilegalmente (Okupas)</option>
            <option value="alquilada">Alquilada (Con inquilinos)</option>
            <option value="nuda_propiedad">Venta de Nuda Propiedad</option>
          </select>
        </div>
      </div>

      {/* Bank Check Card */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
        <div className="flex flex-col gap-0.5 pr-4">
          <Label htmlFor="is_bank_owned" className="font-semibold text-slate-800 cursor-pointer">Inmueble de origen bancario</Label>
          <span className="text-[11px] text-slate-400">Marca esta casilla si procede de activos bancarios o ejecuciones hipotecarias.</span>
        </div>
        <input 
          type="checkbox" 
          id="is_bank_owned" 
          {...form.register("is_bank_owned")} 
          className="h-5 w-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer border-slate-300"
        />
      </div>

      {/* Internal Admin Collapsible Section */}
      <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-150 space-y-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Lock size={12} className="text-slate-400" />
          Gestión Interna de la Agencia
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capture_agent">Agente Captador</Label>
            <select 
              id="capture_agent" 
              {...form.register("capture_agent")} 
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
            >
              <option value="">Seleccione un agente</option>
              {agentsOptions.map(agent => (
                <option key={agent.id || agent.name} value={agent.name}>{agent.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sales_agent">Agente Comercial asignado</Label>
            <select 
              id="sales_agent" 
              {...form.register("sales_agent")} 
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
            >
              <option value="">Seleccione un comercial</option>
              {agentsOptions.map(agent => (
                <option key={agent.id || agent.name} value={agent.name}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="private_notes">Notas Internas Privadas</Label>
          <textarea 
            id="private_notes" 
            placeholder="Escribe anotaciones que no serán públicas en los portales..." 
            {...form.register("private_notes")} 
            className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" 
          />
        </div>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="notes_visibility">Visibilidad de las notas</Label>
          <select 
            id="notes_visibility" 
            {...form.register("notes_visibility")} 
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs focus:outline-none"
          >
            <option value="solo_yo">Solo visible para mí y coordinador</option>
            <option value="oficina">Visible para toda la oficina</option>
          </select>
        </div>
      </div>

    </div>
  );
};
