import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export const LocalFeatures: React.FC = () => {
  const { register, formState } = useFormContext();
  const errors = formState.errors as any;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="facade_meters" className={errors.specific_features?.facade_meters ? "text-red-500" : ""}>Metros de fachada</Label>
          <Input id="facade_meters" type="number" error={!!errors.specific_features?.facade_meters} {...register("specific_features.facade_meters", { valueAsNumber: true })} />
          {errors.specific_features?.facade_meters && <p className="text-sm text-red-500">{String(errors.specific_features.facade_meters.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop_windows" className={errors.specific_features?.shop_windows ? "text-red-500" : ""}>Nº Escaparates</Label>
          <Input id="shop_windows" type="number" error={!!errors.specific_features?.shop_windows} {...register("specific_features.shop_windows", { valueAsNumber: true })} />
          {errors.specific_features?.shop_windows && <p className="text-sm text-red-500">{String(errors.specific_features.shop_windows.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="local_layout">Distribución</Label>
          <select id="local_layout" {...register("specific_features.layout")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="diáfano">Diáfano</option>
            <option value="compartimentado">Compartimentado</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="smoke_extractor" {...register("specific_features.smoke_extractor")} />
        <Label htmlFor="smoke_extractor">¿Dispone de salida de humos?</Label>
      </div>
    </div>
  );
};

export const OficinaFeatures: React.FC = () => {
  const { register, formState } = useFormContext();
  const errors = formState.errors as any;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="office_layout">Distribución de la Oficina</Label>
          <select id="office_layout" {...register("specific_features.layout")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="diáfano">Diáfano</option>
            <option value="compartimentado">Compartimentado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms" className={errors.specific_features?.bathrooms ? "text-red-500" : ""}>Nº de Aseos / Baños</Label>
          <Input id="bathrooms" type="number" error={!!errors.specific_features?.bathrooms} {...register("specific_features.bathrooms", { valueAsNumber: true })} />
          {errors.specific_features?.bathrooms && <p className="text-sm text-red-500">{String(errors.specific_features.bathrooms.message)}</p>}
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
            <input type="checkbox" id="has_elevator" {...register("specific_features.has_elevator")} />
            <Label htmlFor="has_elevator">Ascensor</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="air_conditioning" {...register("specific_features.air_conditioning")} />
            <Label htmlFor="air_conditioning">Aire acondicionado</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_parking" {...register("specific_features.has_parking")} />
            <Label htmlFor="has_parking">Plaza de garaje</Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="heating_type">Tipo de calefacción</Label>
          <select id="heating_type" {...register("specific_features.heating_type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Seleccione opción</option>
            <option value="individual">Individual</option>
            <option value="central">Central</option>
            <option value="no_tiene">No dispone</option>
          </select>
        </div>
      </div>
    </div>
  );
};
