import React from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "./ui/label"
import { Input } from "./ui/input"

export const SpecificFeaturesForm: React.FC<{ type: string }> = ({ type }) => {
  const { register, formState: { errors } } = useFormContext()

  if (type === "piso") {
    return (
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
        <div className="space-y-2 flex items-center gap-2 mt-8">
          <input type="checkbox" id="has_elevator" {...register("specific_features.has_elevator")} />
          <Label htmlFor="has_elevator">¿Tiene ascensor?</Label>
        </div>
        <div className="space-y-2 flex items-center gap-2 mt-8">
          <input type="checkbox" id="has_terrace" {...register("specific_features.has_terrace")} />
          <Label htmlFor="has_terrace">¿Tiene terraza?</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="community_fees">Gastos Comunidad (€)</Label>
          <Input id="community_fees" type="number" {...register("specific_features.community_fees", { valueAsNumber: true })} />
        </div>
      </div>
    )
  }

  if (type === "chalet") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="plot_area">Metros de Parcela</Label>
          <Input id="plot_area" type="number" {...register("specific_features.plot_area", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2 flex items-center gap-2 mt-8">
          <input type="checkbox" id="has_pool" {...register("specific_features.has_pool")} />
          <Label htmlFor="has_pool">¿Tiene piscina?</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="floors_count">Nº de Plantas</Label>
          <Input id="floors_count" type="number" {...register("specific_features.floors_count", { valueAsNumber: true })} />
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
