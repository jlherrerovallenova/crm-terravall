import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FeatureSelect, NumericFeatureInput } from "./FeatureInputFields";

const heatingTypeOptions = [
  { value: "", label: "Seleccione opción" },
  { value: "individual", label: "Individual" },
  { value: "central", label: "Central" },
  { value: "no_tiene", label: "No dispone" },
];

const heatingFuelOptions = [
  { value: "", label: "Seleccione opción" },
  { value: "gas_natural", label: "Gas natural" },
  { value: "electrica", label: "Eléctrica" },
  { value: "gasoil", label: "Gasoil" },
  { value: "pellet", label: "Pellet / Biomasa" },
  { value: "otro", label: "Otro" },
];

export const ChaletFeatures: React.FC = () => {
  const { register, watch, formState } = useFormContext();
  const errors = formState.errors as any;
  const hasParking = watch("specific_features.has_parking");
  const parkingIncluded = watch("specific_features.parking_included");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NumericFeatureInput
          id="plot_area"
          label="Metros de Parcela"
          error={errors.specific_features?.plot_area ? String(errors.specific_features.plot_area.message) : undefined}
          registerProps={register("specific_features.plot_area", { valueAsNumber: true })}
        />
        <NumericFeatureInput
          id="floors_count"
          label="Nº de Plantas"
          error={errors.specific_features?.floors_count ? String(errors.specific_features.floors_count.message) : undefined}
          registerProps={register("specific_features.floors_count", { valueAsNumber: true })}
        />
        <NumericFeatureInput
          id="rooms"
          label="Habitaciones"
          error={errors.specific_features?.rooms ? String(errors.specific_features.rooms.message) : undefined}
          registerProps={register("specific_features.rooms", { valueAsNumber: true })}
        />
        <NumericFeatureInput
          id="bathrooms"
          label="Baños"
          error={errors.specific_features?.bathrooms ? String(errors.specific_features.bathrooms.message) : undefined}
          registerProps={register("specific_features.bathrooms", { valueAsNumber: true })}
        />
        <NumericFeatureInput
          id="construction_year"
          label="Año de construcción"
          error={errors.specific_features?.construction_year ? String(errors.specific_features.construction_year.message) : undefined}
          registerProps={register("specific_features.construction_year", { valueAsNumber: true })}
        />
      </div>

      <div>
        <Label className="mb-4 block text-base whitespace-nowrap">Características Adicionales</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2"><input type="checkbox" id="has_pool" {...register("specific_features.has_pool")} /><Label htmlFor="has_pool" className="whitespace-nowrap">Piscina</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_terrace" {...register("specific_features.has_terrace")} /><Label htmlFor="has_terrace" className="whitespace-nowrap">Terraza</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_balcony" {...register("specific_features.has_balcony")} /><Label htmlFor="has_balcony" className="whitespace-nowrap">Balcón</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="built_in_wardrobes" {...register("specific_features.built_in_wardrobes")} /><Label htmlFor="built_in_wardrobes" className="whitespace-nowrap">Armarios empotrados</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="air_conditioning" {...register("specific_features.air_conditioning")} /><Label htmlFor="air_conditioning" className="whitespace-nowrap">Aire acondicionado</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_storage_room" {...register("specific_features.has_storage_room")} /><Label htmlFor="has_storage_room" className="whitespace-nowrap">Trastero</Label></div>
        </div>
      </div>

      <div className={`bg-white p-4 rounded border ${errors.specific_features?.parking_included ? "border-red-500 bg-red-50/10" : "border-gray-200"} space-y-4`}>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="has_parking_chalet" {...register("specific_features.has_parking")} />
          <Label htmlFor="has_parking_chalet" className={`font-semibold text-base whitespace-nowrap ${errors.specific_features?.parking_included ? "text-red-500" : ""}`}>Plaza de garaje</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
          <div className="flex items-center gap-2">
            <input type="radio" id="park_inc_chalet" value="true" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_inc_chalet" className={`whitespace-nowrap ${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Incluida en el precio</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="radio" id="park_exc_chalet" value="false" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_exc_chalet" className={`whitespace-nowrap ${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Se cobra aparte</Label>
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2 max-w-xs">
            <Label htmlFor="parking_price_chalet" className={`whitespace-nowrap ${errors.specific_features?.parking_price ? "text-red-500" : ""} ${(!hasParking || parkingIncluded === "true" || parkingIncluded === true) ? "opacity-50" : ""}`}>Precio del garaje (€)</Label>
            <Input id="parking_price_chalet" type="number" error={!!errors.specific_features?.parking_price} disabled={!hasParking || parkingIncluded === "true" || parkingIncluded === true} {...register("specific_features.parking_price", { valueAsNumber: true })} />
            {errors.specific_features?.parking_price && <p className="text-sm text-red-500">{String(errors.specific_features.parking_price.message)}</p>}
          </div>
        </div>
        {errors.specific_features?.parking_included && <p className="text-sm text-red-500 mt-1">{String(errors.specific_features.parking_included.message)}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureSelect
          id="heating_type"
          label="Tipo de calefacción"
          options={heatingTypeOptions}
          {...register("specific_features.heating_type")}
        />
        <FeatureSelect
          id="heating_fuel"
          label="Combustible"
          options={heatingFuelOptions}
          {...register("specific_features.heating_fuel")}
        />
      </div>
    </div>
  );
};
