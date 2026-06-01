import React from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "./ui/label"
import { Input } from "./ui/input"

export const SpecificFeaturesForm: React.FC<{ type: string }> = ({ type }) => {
  const { register, formState: { errors } } = useFormContext()

  if (type === "piso") {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="floor">Planta</Label>
            <Input id="floor" type="number" {...register("specific_features.floor", { valueAsNumber: true })} />
            {errors.specific_features?.floor && <p className="text-sm text-red-500">{String(errors.specific_features.floor.message)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rooms">Habitaciones</Label>
            <Input id="rooms" type="number" {...register("specific_features.rooms", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Baños</Label>
            <Input id="bathrooms" type="number" {...register("specific_features.bathrooms", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interior_exterior">Interior / Exterior</Label>
            <select id="interior_exterior" {...register("specific_features.interior_exterior")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="exterior">Exterior</option>
              <option value="interior">Interior</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="community_fees">Gastos Comunidad (€/Mes)</Label>
            <Input id="community_fees" type="number" {...register("specific_features.community_fees", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="construction_year">Año de construcción</Label>
            <Input id="construction_year" type="number" {...register("specific_features.construction_year", { valueAsNumber: true })} />
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
          <Label className="mb-4 block text-base">Orientación</Label>
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><input type="checkbox" id="ori_norte" value="norte" {...register("specific_features.orientation")} /><Label htmlFor="ori_norte">Norte</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="ori_sur" value="sur" {...register("specific_features.orientation")} /><Label htmlFor="ori_sur">Sur</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="ori_este" value="este" {...register("specific_features.orientation")} /><Label htmlFor="ori_este">Este</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="ori_oeste" value="oeste" {...register("specific_features.orientation")} /><Label htmlFor="ori_oeste">Oeste</Label></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_parking" {...register("specific_features.has_parking")} />
            <Label htmlFor="has_parking" className="font-semibold text-base">Plaza de garaje</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="flex items-center gap-2">
              <input type="radio" id="park_inc" value="true" {...register("specific_features.parking_included")} />
              <Label htmlFor="park_inc">Incluida en el precio</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="park_exc" value="false" {...register("specific_features.parking_included")} />
              <Label htmlFor="park_exc">Se cobra aparte</Label>
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2 max-w-xs">
              <Label htmlFor="parking_price">Precio del garaje (€)</Label>
              <Input id="parking_price" type="number" {...register("specific_features.parking_price", { valueAsNumber: true })} />
            </div>
          </div>
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
            <Label htmlFor="plot_area">Metros de Parcela</Label>
            <Input id="plot_area" type="number" {...register("specific_features.plot_area", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floors_count">Nº de Plantas</Label>
            <Input id="floors_count" type="number" {...register("specific_features.floors_count", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rooms">Habitaciones</Label>
            <Input id="rooms" type="number" {...register("specific_features.rooms", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Baños</Label>
            <Input id="bathrooms" type="number" {...register("specific_features.bathrooms", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="construction_year">Año de construcción</Label>
            <Input id="construction_year" type="number" {...register("specific_features.construction_year", { valueAsNumber: true })} />
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

        <div className="bg-white p-4 rounded border border-gray-200 space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_parking" {...register("specific_features.has_parking")} />
            <Label htmlFor="has_parking" className="font-semibold text-base">Plaza de garaje</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="flex items-center gap-2">
              <input type="radio" id="park_inc" value="true" {...register("specific_features.parking_included")} />
              <Label htmlFor="park_inc">Incluida en el precio</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="park_exc" value="false" {...register("specific_features.parking_included")} />
              <Label htmlFor="park_exc">Se cobra aparte</Label>
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2 max-w-xs">
              <Label htmlFor="parking_price">Precio del garaje (€)</Label>
              <Input id="parking_price" type="number" {...register("specific_features.parking_price", { valueAsNumber: true })} />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="facade_meters">Metros de fachada</Label>
          <Input id="facade_meters" type="number" {...register("specific_features.facade_meters", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2 flex items-center gap-2 mt-8">
          <input type="checkbox" id="smoke_extractor" {...register("specific_features.smoke_extractor")} />
          <Label htmlFor="smoke_extractor">¿Salida de humos?</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="shop_windows">Nº Escaparates</Label>
          <Input id="shop_windows" type="number" {...register("specific_features.shop_windows", { valueAsNumber: true })} />
        </div>
      </div>
    )
  }

  return <p className="text-muted-foreground text-sm">Selecciona un tipo de inmueble para ver sus campos específicos.</p>
}
