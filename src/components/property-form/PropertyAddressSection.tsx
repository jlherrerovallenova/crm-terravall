import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { FormInputField } from './FormInputField';
import { Search, Sparkles, MapPin, Eye, EyeOff } from 'lucide-react';

interface PropertyAddressSectionProps {
  isLookingUpCatastro: boolean;
  onLookupCatastro: () => Promise<void> | void;
  isLookingUpZipcode: boolean;
  onLookupZipcode: () => Promise<void> | void;
}

export const PropertyAddressSection: React.FC<PropertyAddressSectionProps> = ({
  isLookingUpCatastro,
  onLookupCatastro,
  isLookingUpZipcode,
  onLookupZipcode
}) => {
  const form = useFormContext<any>();
  const propertyType = form.watch('type');

  return (
    <div className="space-y-8 transition-opacity duration-300">
      <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-2xl text-slate-900 font-medium">2. Localización y Dirección</h3>
          <p className="text-slate-500 text-xs mt-1">Ingresa los datos postales de la propiedad o impórtalos directamente desde el Catastro.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLookingUpCatastro}
          onClick={onLookupCatastro}
          className="text-xs text-primary border-primary/30 hover:bg-primary/5 gap-1.5 font-semibold cursor-pointer"
        >
          <Search size={14} className={isLookingUpCatastro ? 'animate-spin' : ''} />
          {isLookingUpCatastro ? 'Consultando Catastro...' : 'Importar datos desde Catastro'}
        </Button>
      </div>

      {/* Public and Private addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInputField
          id="address_hidden"
          label="Dirección Interna (Calle, Número, Planta) *"
          placeholder="Ej. Calle Principal, 12, 3º B"
          error={form.formState.errors.address_hidden}
          hint="Esta dirección es estrictamente confidencial para agentes."
          {...form.register("address_hidden")}
          onBlur={() => {
            if (!form.getValues('zipcode')) {
              onLookupZipcode();
            }
          }}
        />

        <FormInputField
          id="address_public"
          label="Ubicación Pública (Zona o Barrio)"
          placeholder="Ej. Centro / Gran Vía"
          error={form.formState.errors.address_public}
          hint="Texto público que aparecerá en los anuncios web."
          {...form.register("address_public")}
        />
      </div>

      {/* City, Province, Zipcode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInputField
          id="city"
          label="Municipio *"
          placeholder="Ej. Valladolid"
          error={form.formState.errors.city}
          {...form.register("city")}
          onBlur={() => {
            if (!form.getValues('zipcode')) {
              onLookupZipcode();
            }
          }}
        />

        <FormInputField
          id="province"
          label="Provincia *"
          placeholder="Ej. Valladolid"
          error={form.formState.errors.province}
          {...form.register("province")}
        />

        <FormInputField
          id="zipcode"
          label="Código Postal *"
          placeholder="Ej. 47006"
          error={form.formState.errors.zipcode}
          labelExtra={
            <button
              type="button"
              onClick={onLookupZipcode}
              disabled={isLookingUpZipcode}
              className="text-[10px] font-bold text-primary hover:text-primary/80 disabled:text-slate-400 flex items-center gap-1 cursor-pointer select-none focus:outline-none"
              title="Autocompletar código postal usando IA según la dirección y municipio"
            >
              <Sparkles size={10} className={isLookingUpZipcode ? 'animate-spin' : ''} />
              {isLookingUpZipcode ? 'Buscando...' : 'Buscar por IA'}
            </button>
          }
          {...form.register("zipcode")}
        />
      </div>

      {/* Escaleras, Bloques y urbanización */}
      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Detalles del Edificio / Complejo</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInputField
            id="urbanization_name"
            label="Urbanización"
            placeholder="Ej. Mirador de Terravall"
            {...form.register("urbanization_name")}
          />
          <FormInputField
            id="block_stairs"
            label="Bloque / Escalera"
            placeholder="Ej. Portal A"
            {...form.register("block_stairs")}
          />
          <FormInputField
            id="door"
            label="Puerta"
            placeholder="Ej. 3º Izquierda"
            {...form.register("door")}
          />
        </div>
      </div>

      {/* Top Floor Checkbox Switch */}
      {(propertyType === 'piso' || propertyType === 'oficina') && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="flex flex-col gap-0.5 pr-4">
            <Label htmlFor="is_top_floor" className="font-semibold text-slate-800 cursor-pointer">Última planta del edificio</Label>
            <span className="text-[11px] text-slate-400">Marca si corresponde al ático o piso más alto del bloque.</span>
          </div>
          <input 
            type="checkbox" 
            id="is_top_floor" 
            {...form.register("is_top_floor")} 
            className="h-5 w-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer border-slate-300"
          />
        </div>
      )}

      {/* Visibility Options Cards */}
      <div className="space-y-3">
        <Label className="font-semibold text-slate-800">Privacidad y Visibilidad en Portales</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 'exact', label: 'Dirección exacta', desc: 'Muestra calle y número en los portales.', icon: MapPin },
            { value: 'street_only', label: 'Solo calle', desc: 'Oculta el número exacto del inmueble.', icon: Eye },
            { value: 'hidden', label: 'Ocultar dirección', desc: 'Solo muestra la zona general o barrio.', icon: EyeOff }
          ].map(vis => {
            const isSelected = form.watch('visibility') === vis.value;
            const Icon = vis.icon;
            return (
              <button
                key={vis.value}
                type="button"
                onClick={() => form.setValue('visibility', vis.value as any, { shouldValidate: true })}
                className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                    {vis.label}
                  </span>
                  <Icon size={16} className={isSelected ? 'text-primary' : 'text-slate-400'} />
                </div>
                <span className="text-[11px] text-slate-400 leading-normal">{vis.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
