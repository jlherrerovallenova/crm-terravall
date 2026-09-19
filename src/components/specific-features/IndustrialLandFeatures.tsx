import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export const TerrenoFeatures: React.FC = () => {
  const { register, formState } = useFormContext();
  const errors = formState.errors as any;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="plot_area" className={errors.specific_features?.plot_area ? "text-red-500" : ""}>Superficie de Parcela (m²)</Label>
          <Input id="plot_area" type="number" error={!!errors.specific_features?.plot_area} {...register("specific_features.plot_area", { valueAsNumber: true })} />
          {errors.specific_features?.plot_area && <p className="text-sm text-red-500">{String(errors.specific_features.plot_area.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="zoning">Tipo de Suelo (Zonificación)</Label>
          <select id="zoning" {...register("specific_features.zoning")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="industrial">Industrial</option>
            <option value="agrario">Agrario / Rústico</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="buildable_area" className={errors.specific_features?.buildable_area ? "text-red-500" : ""}>Edificabilidad Máxima (m²)</Label>
          <Input id="buildable_area" type="number" error={!!errors.specific_features?.buildable_area} {...register("specific_features.buildable_area", { valueAsNumber: true })} />
          {errors.specific_features?.buildable_area && <p className="text-sm text-red-500">{String(errors.specific_features.buildable_area.message)}</p>}
        </div>
      </div>

      <div>
        <Label className="mb-4 block text-base font-medium">Suministros y Acometidas</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_electricity" {...register("specific_features.has_electricity")} />
            <Label htmlFor="has_electricity">Electricidad</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_water" {...register("specific_features.has_water")} />
            <Label htmlFor="has_water">Agua corriente</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_gas" {...register("specific_features.has_gas")} />
            <Label htmlFor="has_gas">Gas natural</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_sewerage" {...register("specific_features.has_sewerage")} />
            <Label htmlFor="has_sewerage">Alcantarillado</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NaveFeatures: React.FC = () => {
  const { register, formState } = useFormContext();
  const errors = formState.errors as any;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="activity">Uso / Actividad Principal</Label>
          <select id="activity" {...register("specific_features.activity")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="almacen">Almacén / Archivo</option>
            <option value="industrial">Industrial / Fabricación</option>
            <option value="comercial">Comercial / Exposición</option>
            <option value="oficinas">Oficinas / Corporativo</option>
            <option value="otros">Otros</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="height_free" className={errors.specific_features?.height_free ? "text-red-500" : ""}>Altura libre (m)</Label>
          <Input id="height_free" type="number" step="0.1" error={!!errors.specific_features?.height_free} {...register("specific_features.height_free", { valueAsNumber: true })} />
          {errors.specific_features?.height_free && <p className="text-sm text-red-500">{String(errors.specific_features.height_free.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms" className={errors.specific_features?.bathrooms ? "text-red-500" : ""}>Nº de Aseos / Baños</Label>
          <Input id="bathrooms" type="number" error={!!errors.specific_features?.bathrooms} {...register("specific_features.bathrooms", { valueAsNumber: true })} />
          {errors.specific_features?.bathrooms && <p className="text-sm text-red-500">{String(errors.specific_features.bathrooms.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="loading_docks" className={errors.specific_features?.loading_docks ? "text-red-500" : ""}>Nº Muelles de Carga</Label>
          <Input id="loading_docks" type="number" error={!!errors.specific_features?.loading_docks} {...register("specific_features.loading_docks", { valueAsNumber: true })} />
          {errors.specific_features?.loading_docks && <p className="text-sm text-red-500">{String(errors.specific_features.loading_docks.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cranes_count" className={errors.specific_features?.cranes_count ? "text-red-500" : ""}>Nº Puentes Grúa</Label>
          <Input id="cranes_count" type="number" error={!!errors.specific_features?.cranes_count} {...register("specific_features.cranes_count", { valueAsNumber: true })} />
          {errors.specific_features?.cranes_count && <p className="text-sm text-red-500">{String(errors.specific_features.cranes_count.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="plot_area" className={errors.specific_features?.plot_area ? "text-red-500" : ""}>Superficie de Parcela / Patio (m²)</Label>
          <Input id="plot_area" type="number" error={!!errors.specific_features?.plot_area} {...register("specific_features.plot_area", { valueAsNumber: true })} />
          {errors.specific_features?.plot_area && <p className="text-sm text-red-500">{String(errors.specific_features.plot_area.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="construction_year" className={errors.specific_features?.construction_year ? "text-red-500" : ""}>Año de Construcción</Label>
          <Input id="construction_year" type="number" error={!!errors.specific_features?.construction_year} {...register("specific_features.construction_year", { valueAsNumber: true })} />
          {errors.specific_features?.construction_year && <p className="text-sm text-red-500">{String(errors.specific_features.construction_year.message)}</p>}
        </div>
      </div>

      <div>
        <Label className="mb-4 block text-base font-medium">Equipamiento e Instalaciones</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_heating" {...register("specific_features.has_heating")} />
            <Label htmlFor="has_heating">Calefacción</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_air_conditioning" {...register("specific_features.has_air_conditioning")} />
            <Label htmlFor="has_air_conditioning">Aire acondicionado</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_security_system" {...register("specific_features.has_security_system")} />
            <Label htmlFor="has_security_system">Alarma / Seguridad</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_fire_system" {...register("specific_features.has_fire_system")} />
            <Label htmlFor="has_fire_system">Protección contra incendios (BIES)</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_offices" {...register("specific_features.has_offices")} />
            <Label htmlFor="has_offices">Oficinas integradas</Label>
          </div>
        </div>
      </div>
    </div>
  );
};
