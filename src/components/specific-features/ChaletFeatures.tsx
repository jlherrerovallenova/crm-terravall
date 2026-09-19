import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export const ChaletFeatures: React.FC = () => {
  const { register, watch, formState } = useFormContext();
  const errors = formState.errors as any;
  const hasParking = watch("specific_features.has_parking");
  const parkingIncluded = watch("specific_features.parking_included");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="plot_area" className={errors.specific_features?.plot_area ? "text-red-500" : ""}>Metros de Parcela</Label>
          <Input id="plot_area" type="number" error={!!errors.specific_features?.plot_area} {...register("specific_features.plot_area", { valueAsNumber: true })} />
          {errors.specific_features?.plot_area && <p className="text-sm text-red-500">{String(errors.specific_features.plot_area.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="floors_count" className={errors.specific_features?.floors_count ? "text-red-500" : ""}>Nº de Plantas</Label>
          <Input id="floors_count" type="number" error={!!errors.specific_features?.floors_count} {...register("specific_features.floors_count", { valueAsNumber: true })} />
          {errors.specific_features?.floors_count && <p className="text-sm text-red-500">{String(errors.specific_features.floors_count.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rooms" className={errors.specific_features?.rooms ? "text-red-500" : ""}>Habitaciones</Label>
          <Input id="rooms" type="number" error={!!errors.specific_features?.rooms} {...register("specific_features.rooms", { valueAsNumber: true })} />
          {errors.specific_features?.rooms && <p className="text-sm text-red-500">{String(errors.specific_features.rooms.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms" className={errors.specific_features?.bathrooms ? "text-red-500" : ""}>Baños</Label>
          <Input id="bathrooms" type="number" error={!!errors.specific_features?.bathrooms} {...register("specific_features.bathrooms", { valueAsNumber: true })} />
          {errors.specific_features?.bathrooms && <p className="text-sm text-red-500">{String(errors.specific_features.bathrooms.message)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="construction_year" className={errors.specific_features?.construction_year ? "text-red-500" : ""}>Año de construcción</Label>
          <Input id="construction_year" type="number" error={!!errors.specific_features?.construction_year} {...register("specific_features.construction_year", { valueAsNumber: true })} />
          {errors.specific_features?.construction_year && <p className="text-sm text-red-500">{String(errors.specific_features.construction_year.message)}</p>}
        </div>
      </div>

      <div>
        <Label className="mb-4 block text-base">Características Adicionales</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2"><input type="checkbox" id="has_pool" {...register("specific_features.has_pool")} /><Label htmlFor="has_pool">Piscina</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_terrace" {...register("specific_features.has_terrace")} /><Label htmlFor="has_terrace">Terraza</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_balcony" {...register("specific_features.has_balcony")} /><Label htmlFor="has_balcony">Balcón</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="built_in_wardrobes" {...register("specific_features.built_in_wardrobes")} /><Label htmlFor="built_in_wardrobes">Armarios empotrados</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="air_conditioning" {...register("specific_features.air_conditioning")} /><Label htmlFor="air_conditioning">Aire acondicionado</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_storage_room" {...register("specific_features.has_storage_room")} /><Label htmlFor="has_storage_room">Trastero</Label></div>
        </div>
      </div>

      <div className={`bg-white p-4 rounded border ${errors.specific_features?.parking_included ? "border-red-500 bg-red-50/10" : "border-gray-200"} space-y-4`}>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="has_parking_chalet" {...register("specific_features.has_parking")} />
          <Label htmlFor="has_parking_chalet" className={`font-semibold text-base ${errors.specific_features?.parking_included ? "text-red-500" : ""}`}>Plaza de garaje</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
          <div className="flex items-center gap-2">
            <input type="radio" id="park_inc_chalet" value="true" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_inc_chalet" className={`${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Incluida en el precio</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="radio" id="park_exc_chalet" value="false" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_exc_chalet" className={`${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Se cobra aparte</Label>
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2 max-w-xs">
            <Label htmlFor="parking_price_chalet" className={`${errors.specific_features?.parking_price ? "text-red-500" : ""} ${(!hasParking || parkingIncluded === "true" || parkingIncluded === true) ? "opacity-50" : ""}`}>Precio del garaje (€)</Label>
            <Input id="parking_price_chalet" type="number" error={!!errors.specific_features?.parking_price} disabled={!hasParking || parkingIncluded === "true" || parkingIncluded === true} {...register("specific_features.parking_price", { valueAsNumber: true })} />
            {errors.specific_features?.parking_price && <p className="text-sm text-red-500">{String(errors.specific_features.parking_price.message)}</p>}
          </div>
        </div>
        {errors.specific_features?.parking_included && <p className="text-sm text-red-500 mt-1">{String(errors.specific_features.parking_included.message)}</p>}
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
        <div className="space-y-2">
          <Label htmlFor="heating_fuel">Combustible</Label>
          <select id="heating_fuel" {...register("specific_features.heating_fuel")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Seleccione opción</option>
            <option value="gas_natural">Gas natural</option>
            <option value="electrica">Eléctrica</option>
            <option value="gasoil">Gasoil</option>
            <option value="pellet">Pellet / Biomasa</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>
    </div>
  );
};
