import React from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export const PisoFeatures: React.FC = () => {
  const { register, watch, formState } = useFormContext();
  const errors = formState.errors as any;
  const hasParking = watch("specific_features.has_parking");
  const parkingIncluded = watch("specific_features.parking_included");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="floor" className={errors.specific_features?.floor ? "text-red-500" : ""}>Planta</Label>
          <Input id="floor" type="number" error={!!errors.specific_features?.floor} {...register("specific_features.floor", { valueAsNumber: true })} />
          {errors.specific_features?.floor && <p className="text-sm text-red-500">{String(errors.specific_features.floor.message)}</p>}
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
          <Label htmlFor="interior_exterior">Interior / Exterior</Label>
          <select id="interior_exterior" {...register("specific_features.interior_exterior")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="exterior">Exterior</option>
            <option value="interior">Interior</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="community_fees" className={errors.specific_features?.community_fees ? "text-red-500" : ""}>Gastos Comunidad (€/Mes)</Label>
          <Input id="community_fees" type="number" error={!!errors.specific_features?.community_fees} {...register("specific_features.community_fees", { valueAsNumber: true })} />
          {errors.specific_features?.community_fees && <p className="text-sm text-red-500">{String(errors.specific_features.community_fees.message)}</p>}
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
          <div className="flex items-center gap-2"><input type="checkbox" id="has_elevator" {...register("specific_features.has_elevator")} /><Label htmlFor="has_elevator">Ascensor</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_terrace" {...register("specific_features.has_terrace")} /><Label htmlFor="has_terrace">Terraza</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_balcony" {...register("specific_features.has_balcony")} /><Label htmlFor="has_balcony">Balcón</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="built_in_wardrobes" {...register("specific_features.built_in_wardrobes")} /><Label htmlFor="built_in_wardrobes">Armarios empotrados</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="air_conditioning" {...register("specific_features.air_conditioning")} /><Label htmlFor="air_conditioning">Aire acondicionado</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_storage_room" {...register("specific_features.has_storage_room")} /><Label htmlFor="has_storage_room">Trastero</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_pool" {...register("specific_features.has_pool")} /><Label htmlFor="has_pool">Piscina</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="has_garden" {...register("specific_features.has_garden")} /><Label htmlFor="has_garden">Jardín</Label></div>
        </div>
      </div>

      <div>
        <Label className={`mb-4 block text-base ${errors.specific_features?.orientation ? "text-red-500" : ""}`}>Orientación</Label>
        <div className="flex gap-4">
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_norte" value="norte" {...register("specific_features.orientation")} /><Label htmlFor="ori_norte" className={errors.specific_features?.orientation ? "text-red-500" : ""}>Norte</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_sur" value="sur" {...register("specific_features.orientation")} /><Label htmlFor="ori_sur" className={errors.specific_features?.orientation ? "text-red-500" : ""}>Sur</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_este" value="este" {...register("specific_features.orientation")} /><Label htmlFor="ori_este" className={errors.specific_features?.orientation ? "text-red-500" : ""}>Este</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ori_oeste" value="oeste" {...register("specific_features.orientation")} /><Label htmlFor="ori_oeste" className={errors.specific_features?.orientation ? "text-red-500" : ""}>Oeste</Label></div>
        </div>
        {errors.specific_features?.orientation && <p className="text-sm text-red-500 mt-1">{String(errors.specific_features.orientation.message)}</p>}
      </div>

      <div className={`bg-white p-4 rounded border ${errors.specific_features?.parking_included ? "border-red-500 bg-red-50/10" : "border-gray-200"} space-y-4`}>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="has_parking" {...register("specific_features.has_parking")} />
          <Label htmlFor="has_parking" className={`font-semibold text-base ${errors.specific_features?.parking_included ? "text-red-500" : ""}`}>Plaza de garaje</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
          <div className="flex items-center gap-2">
            <input type="radio" id="park_inc" value="true" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_inc" className={`${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Incluida en el precio</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="radio" id="park_exc" value="false" disabled={!hasParking} {...register("specific_features.parking_included")} />
            <Label htmlFor="park_exc" className={`${errors.specific_features?.parking_included ? "text-red-500" : ""} ${!hasParking ? "opacity-50 cursor-not-allowed" : ""}`}>Se cobra aparte</Label>
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2 max-w-xs">
            <Label htmlFor="parking_price" className={`${errors.specific_features?.parking_price ? "text-red-500" : ""} ${(!hasParking || parkingIncluded === "true" || parkingIncluded === true) ? "opacity-50" : ""}`}>Precio del garaje (€)</Label>
            <Input id="parking_price" type="number" error={!!errors.specific_features?.parking_price} disabled={!hasParking || parkingIncluded === "true" || parkingIncluded === true} {...register("specific_features.parking_price", { valueAsNumber: true })} />
            {errors.specific_features?.parking_price && <p className="text-sm text-red-500">{String(errors.specific_features.parking_price.message)}</p>}
          </div>
        </div>
        {errors.specific_features?.parking_included && <p className="text-sm text-red-500 mt-1">{String(errors.specific_features.parking_included.message)}</p>}
      </div>

      <div>
        <Label className="mb-4 block text-base">Accesibilidad (Movilidad Reducida)</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><input type="checkbox" id="accessible_exterior" {...register("specific_features.accessible_exterior")} /><Label htmlFor="accessible_exterior">Acceso exterior a la vivienda adaptado</Label></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="wheelchair_accessible" {...register("specific_features.wheelchair_accessible")} /><Label htmlFor="wheelchair_accessible">Adaptado para uso con silla de ruedas</Label></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="heating_type">Tipo de calefacción</Label>
          <select id="heating_type" {...register("specific_features.heating_type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Seleccione opción</option>
            <option value="individual">Individual</option>
            <option value="central">Central</option>
            <option value="central_contador">Central con contador</option>
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
