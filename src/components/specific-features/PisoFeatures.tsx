import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FeatureSelect, NumericFeatureInput } from "./FeatureInputFields";

const interiorExteriorOptions = [
  { value: "exterior", label: "Exterior" },
  { value: "interior", label: "Interior" },
];

const heatingTypeOptions = [
  { value: "", label: "Seleccione opción" },
  { value: "individual", label: "Individual" },
  { value: "central", label: "Central" },
  { value: "central_contador", label: "Central con contador" },
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

export const PisoFeatures: React.FC = () => {
  const { register, watch, formState } = useFormContext();
  const errors = formState.errors as any;
  const hasParking = watch("specific_features.has_parking");
  const parkingIncluded = watch("specific_features.parking_included");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NumericFeatureInput
          id="floor"
          label="Planta"
          error={errors.specific_features?.floor ? String(errors.specific_features.floor.message) : undefined}
          registerProps={register("specific_features.floor", { valueAsNumber: true })}
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
        <FeatureSelect
          id="interior_exterior"
          label="Interior / Exterior"
          options={interiorExteriorOptions}
          {...register("specific_features.interior_exterior")}
        />
        <NumericFeatureInput
          id="community_fees"
          label="Gastos Comunidad (€/Mes)"
          error={errors.specific_features?.community_fees ? String(errors.specific_features.community_fees.message) : undefined}
          registerProps={register("specific_features.community_fees", { valueAsNumber: true })}
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
          <div className="flex items-center gap-2"><input type="checkbox" id="has_elevator" {...register("specific_features.has_elevator")} /><Label htmlFor="has_elevator" className="whitespace-nowrap">Ascensor</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_terrace" {...register("specific_features.has_terrace")} /><Label htmlFor="has_terrace" className="whitespace-nowrap">Terraza</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_balcony" {...register("specific_features.has_balcony")} /><Label htmlFor="has_balcony" className="whitespace-nowrap">Balcón</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="built_in_wardrobes" {...register("specific_features.built_in_wardrobes")} /><Label htmlFor="built_in_wardrobes" className="whitespace-nowrap">Armarios empotrados</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="air_conditioning" {...register("specific_features.air_conditioning")} /><Label htmlFor="air_conditioning" className="whitespace-nowrap">Aire acondicionado</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_storage_room" {...register("specific_features.has_storage_room")} /><Label htmlFor="has_storage_room" className="whitespace-nowrap">Trastero</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_pool" {...register("specific_features.has_pool")} /><Label htmlFor="has_pool" className="whitespace-nowrap">Piscina</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_garden" {...register("specific_features.has_garden")} /><Label htmlFor="has_garden" className="whitespace-nowrap">Jardín</Label></div>
        </div>
      </div>

      <div>
        <Label className={`mb-4 block text-base whitespace-nowrap ${errors.specific_features?.orientation ? "text-red-500" : ""}`}>Orientación</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_norte" value="norte" {...register("specific_features.orientation")} /><Label htmlFor="ori_norte" className={`whitespace-nowrap ${errors.specific_features?.orientation ? "text-red-500" : ""}`}>Norte</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_sur" value="sur" {...register("specific_features.orientation")} /><Label htmlFor="ori_sur" className={`whitespace-nowrap ${errors.specific_features?.orientation ? "text-red-500" : ""}`}>Sur</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_este" value="este" {...register("specific_features.orientation")} /><Label htmlFor="ori_este" className={`whitespace-nowrap ${errors.specific_features?.orientation ? "text-red-500" : ""}`}>Este</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_oeste" value="oeste" {...register("specific_features.orientation")} /><Label htmlFor="ori_oeste" className={`whitespace-nowrap ${errors.specific_features?.orientation ? "text-red-500" : ""}`}>Oeste</Label></div>
        </div>
        {errors.specific_features?.orientation && <p className="text-sm text-red-500 mt-1">{String(errors.specific_features.orientation.message)}</p>}
      </div>

      <div className={`bg-white p-4 rounded border ${errors.specific_features?.parking_included ? "border-red-500 bg-red-50/10" : "border-gray-200"} space-y-4`}>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="has_parking" {...register("specific_features.has_parking")} />
          <Label htmlFor="has_parking" className={`font-semibold text-base whitespace-nowrap ${errors.specific_features?.parking_included ? "text-red-500" : ""}`}>Plaza de garaje</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
          <div className="flex items-center gap-2">
            <input type="radio" id="park_inc" value="true" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_inc" className={`whitespace-nowrap ${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Incluida en el precio</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="radio" id="park_exc" value="false" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_exc" className={`whitespace-nowrap ${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Se cobra aparte</Label>
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2 max-w-xs">
            <Label htmlFor="parking_price" className={`whitespace-nowrap ${errors.specific_features?.parking_price ? "text-red-500" : ""} ${(!hasParking || parkingIncluded === "true" || parkingIncluded === true) ? "opacity-50" : ""}`}>Precio del garaje (€)</Label>
            <Input id="parking_price" type="number" error={!!errors.specific_features?.parking_price} disabled={!hasParking || parkingIncluded === "true" || parkingIncluded === true} {...register("specific_features.parking_price", { valueAsNumber: true })} />
            {errors.specific_features?.parking_price && <p className="text-sm text-red-500">{String(errors.specific_features.parking_price.message)}</p>}
          </div>
        </div>
        {errors.specific_features?.parking_included && <p className="text-sm text-red-500 mt-1">{String(errors.specific_features.parking_included.message)}</p>}
      </div>

      <div>
        <Label className="mb-4 block text-base whitespace-nowrap">Accesibilidad (Movilidad Reducida)</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><input type="checkbox" id="accessible_exterior" {...register("specific_features.accessible_exterior")} /><Label htmlFor="accessible_exterior" className="whitespace-nowrap">Acceso exterior a la vivienda adaptado</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="wheelchair_accessible" {...register("specific_features.wheelchair_accessible")} /><Label htmlFor="wheelchair_accessible" className="whitespace-nowrap">Adaptado para uso con silla de ruedas</Label></div>
        </div>
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
