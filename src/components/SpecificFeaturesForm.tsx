import React from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "./ui/label"
import { Input } from "./ui/input"

export const SpecificFeaturesForm: React.FC<{ type: string }> = ({ type }) => {
  const { register, watch, formState } = useFormContext()
  const errors = formState.errors as any
  const hasParking = watch("specific_features.has_parking")
  const parkingIncluded = watch("specific_features.parking_included")

  if (type === "piso") {
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
    )
  }

  if (type === "chalet") {
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
    )
  }

  if (type === "local") {
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
    )
  }

  if (type === "oficina") {
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
    )
  }

  if (type === "terreno") {
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
    )
  }

  if (type === "nave") {
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
    )
  }

  return <p className="text-muted-foreground text-sm">Selecciona un tipo de inmueble para ver sus campos específicos.</p>
}
