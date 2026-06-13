import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyFormValues } from '@/schema/property.schema';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SpecificFeaturesForm } from './SpecificFeaturesForm';
import { MediaUploader, type MediaItem } from './MediaUploader';
import { Sparkles } from 'lucide-react';

interface PropertyFormProps {
  initialData?: PropertyFormValues & { id?: string };
}

export const PropertyForm: React.FC<PropertyFormProps> = ({ initialData }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [initialMedia, setInitialMedia] = useState<MediaItem[]>([]);

  React.useEffect(() => {
    if (initialData?.id) {
      supabase.from('property_media').select('*').eq('property_id', initialData.id).then(({ data }) => {
        if (data) setInitialMedia(data);
      });
    } else {
      supabase
        .from('properties')
        .select('internal_reference')
        .not('internal_reference', 'is', null)
        .order('internal_reference', { ascending: false })
        .limit(1)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const lastRef = data[0].internal_reference;
            const match = lastRef.match(/TRV-(\d+)/);
            if (match) {
              const nextNum = parseInt(match[1], 10) + 1;
              const nextRef = `TRV-${String(nextNum).padStart(4, '0')}`;
              form.setValue('internal_reference', nextRef);
            } else {
              form.setValue('internal_reference', 'TRV-0001');
            }
          } else {
            form.setValue('internal_reference', 'TRV-0001');
          }
        });
    }
  }, [initialData?.id]);

  const handleMediaDelete = async (mediaId: string) => {
    if (confirm("¿Seguro que deseas eliminar esta foto?")) {
      const { error } = await supabase.from('property_media').delete().eq('id', mediaId);
      if (!error) {
        setInitialMedia(prev => prev.filter(m => m.id !== mediaId));
      } else {
        alert("Error al eliminar la foto.");
      }
    }
  };

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData || {
      type: 'piso',
      operation: 'venta',
      visibility: 'exact',
      is_top_floor: false,
      is_bank_owned: false,
      exceptional_situation: 'ninguna',
      energy_certificate: 'en_tramite',
      emissions_certificate: 'en_tramite',
      notes_visibility: 'solo_yo'
    } as any,
  });

  const propertyType = form.watch('type');

  const onSubmit = async (data: PropertyFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("No estás autenticado. Inicia sesión primero.");
      }

      const { specific_features, ...globalFeatures } = data;
      let propertyId = initialData?.id;

      if (propertyId) {
        // Update mode
        const { error } = await supabase.from('properties').update({
          ...globalFeatures,
          specific_features
        }).eq('id', propertyId);

        if (error) throw error;
      } else {
        // Insert mode
        const { data: newProp, error } = await supabase.from('properties').insert({
          ...globalFeatures,
          specific_features,
          user_id: userData.user.id
        }).select().single();

        if (error) throw error;
        propertyId = newProp.id;
      }

      // Procesar la subida de imágenes
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${propertyId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage.from('property_media').upload(filePath, file);
          if (uploadError) {
            console.error("Error subiendo foto:", uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage.from('property_media').getPublicUrl(filePath);

          await supabase.from('property_media').insert({
            property_id: propertyId,
            url: publicUrlData.publicUrl,
            type: 'image'
          });
        }
      }

      alert("¡Inmueble guardado correctamente!");
      navigate(`/crm/inmuebles/${propertyId}`);
    } catch (error: any) {
      console.error('Error al guardar el inmueble:', error);
      alert(error.message || "Error al comunicarse con Supabase. Verifica que has actualizado la base de datos con los nuevos campos de Idealista.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDescriptionWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const data = form.getValues();
      const prompt = `Actúa como un agente inmobiliario técnico. Redacta una descripción puramente técnica basándote en los datos.`;
      console.log("Llamando a IA con prompt:", prompt);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAiResponse = `Inmueble de tipología ${data.type} ofertado para ${data.operation} en ${data.city}. Superficie construida de ${data.area_built} m². Estado de conservación: ${data.condition.replace('_', ' ')}. Precio: ${data.price}€. Su emplazamiento exacto en ${data.address_public} proporciona un acceso excelente. Certificado de eficiencia energética: ${data.energy_certificate.toUpperCase().replace('_', ' ')}.`;

      form.setValue('description', mockAiResponse, { shouldValidate: true });
    } catch (error) {
      console.error("Error generando IA:", error);
      alert("Hubo un error al generar el texto.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onInvalid = (errors: any) => {
    const fieldNames: Record<string, string> = {
      type: "Tipo de Inmueble",
      operation: "Operación",
      subtype: "Subtipo de Inmueble",
      price: "Precio",
      address_hidden: "Dirección Exacta (Calle y Número)",
      address_public: "Zona/Barrio Público",
      city: "Municipio",
      province: "Provincia",
      zipcode: "Código Postal",
      block_stairs: "Portal/Escalera",
      door: "Puerta",
      urbanization_name: "Nombre de Urbanización",
      visibility: "Visibilidad de Dirección",
      is_top_floor: "Es Última Planta",
      is_bank_owned: "Procedencia Bancaria",
      exceptional_situation: "Situación Excepcional",
      area_built: "M² Construidos",
      area_useful: "M² Útiles",
      condition: "Estado del Inmueble",
      energy_certificate: "Certificado de Consumo Energético",
      energy_consumption: "Consumo de Energía",
      emissions_certificate: "Certificado de Emisiones CO2",
      emissions: "Emisiones CO2",
      title: "Título del Anuncio",
      description: "Descripción Detallada",
      publish_web: "Publicar en Web",
      publish_idealista: "Publicar en Idealista",
      publish_fotocasa: "Publicar en Fotocasa",
      website_url: "URL de la Web",
      capture_agent: "Agente Captador",
      sales_agent: "Agente Comercial",
      internal_reference: "Referencia Interna",
      private_notes: "Notas Privadas",
      notes_visibility: "Visibilidad de Notas",
      
      // Características específicas
      floor: "Planta",
      has_elevator: "Ascensor",
      community_fees: "Gastos de Comunidad",
      has_terrace: "Terraza",
      has_balcony: "Balcón",
      orientation: "Orientación",
      rooms: "Habitaciones",
      bathrooms: "Baños",
      interior_exterior: "Interior/Exterior",
      built_in_wardrobes: "Armarios Empotrados",
      air_conditioning: "Aire Acondicionado",
      has_storage_room: "Trastero",
      has_pool: "Piscina",
      has_garden: "Jardín",
      has_parking: "Plaza de Garaje",
      parking_included: "Garaje Incluido",
      parking_price: "Precio de Garaje",
      accessible_exterior: "Acceso Exterior Adaptado",
      wheelchair_accessible: "Adaptado para Silla de Ruedas",
      heating_type: "Tipo de Calefacción",
      heating_fuel: "Combustible de Calefacción",
      construction_year: "Año de Construcción",
      plot_area: "Metros de Parcela",
      garden_type: "Tipo de Jardín",
      floors_count: "Número de Plantas",
      facade_meters: "Metros de Fachada",
      smoke_extractor: "Salida de Humos",
      last_activity: "Última Actividad",
      layout: "Distribución",
      shop_windows: "Escaparates"
    };

    const getErrorFields = (obj: any): string[] => {
      let fields: string[] = [];
      for (const key in obj) {
        if (obj[key]?.message) {
          fields.push(fieldNames[key] || key);
        } else if (typeof obj[key] === 'object') {
          fields = [...fields, ...getErrorFields(obj[key])];
        }
      }
      return fields;
    };

    const missingFields = getErrorFields(errors);
    alert(`No se puede guardar. Revisa los siguientes campos:\n\n- ${missingFields.join('\n- ')}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          {initialData ? 'Editar Inmueble' : 'Alta de Inmueble'}
        </h1>
        <p className="text-gray-500 mt-2">
          {initialData ? 'Modifica los datos del inmueble.' : 'Completa los datos para publicar en la web e Idealista.'}
        </p>
      </div>
      
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-10">
          
          {/* SECCIÓN 1: TIPO Y OPERACIÓN */}
          <section className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Operación y Precio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Inmueble</Label>
                <select id="type" {...form.register("type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="piso">Piso / Apartamento</option>
                  <option value="chalet">Chalet / Casa</option>
                  <option value="local">Local Comercial</option>
                  <option value="oficina">Oficina</option>
                  <option value="terreno">Terreno</option>
                </select>
                {form.formState.errors.type && <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>}
              </div>

              {propertyType === 'piso' && (
                <div className="space-y-2">
                  <Label htmlFor="subtype">Subtipo de Inmueble</Label>
                  <select id="subtype" {...form.register("subtype")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="piso">Piso estándar</option>
                    <option value="atico">Ático</option>
                    <option value="duplex">Dúplex</option>
                    <option value="estudio">Estudio</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="operation">Operación</Label>
                <select id="operation" {...form.register("operation")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="traspaso">Traspaso</option>
                </select>
                {form.formState.errors.operation && <p className="text-sm text-red-500">{form.formState.errors.operation.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exceptional_situation">Situaciones excepcionales</Label>
                <select id="exceptional_situation" {...form.register("exceptional_situation")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="ninguna">No, en ninguna situación excepcional</option>
                  <option value="ocupada">Ocupada ilegalmente</option>
                  <option value="alquilada">Alquilada, con inquilinos</option>
                  <option value="nuda_propiedad">Nuda propiedad</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className={form.formState.errors.price ? "text-red-500" : ""}>Precio (€)</Label>
                <Input id="price" type="number" error={!!form.formState.errors.price} {...form.register("price", { valueAsNumber: true })} />
                {form.formState.errors.price && <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>}
              </div>
              
              <div className="space-y-2 flex items-center gap-2 mt-8">
                <input type="checkbox" id="is_bank_owned" {...form.register("is_bank_owned")} />
                <Label htmlFor="is_bank_owned">Inmueble de banco</Label>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: UBICACIÓN */}
          <section className="p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Localización del Inmueble
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address_hidden" className={form.formState.errors.address_hidden ? "text-red-500" : ""}>Dirección Exacta (Calle y Número)</Label>
                <Input id="address_hidden" error={!!form.formState.errors.address_hidden} {...form.register("address_hidden")} placeholder="Ej. Calle Juan Sebastián Elcano, 4" />
                {form.formState.errors.address_hidden && <p className="text-sm text-red-500">{form.formState.errors.address_hidden.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_public" className={form.formState.errors.address_public ? "text-red-500" : ""}>Zona/Barrio Público</Label>
                <Input id="address_public" error={!!form.formState.errors.address_public} {...form.register("address_public")} placeholder="Ej. Campo Grande" />
                {form.formState.errors.address_public && <p className="text-sm text-red-500">{form.formState.errors.address_public.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className={form.formState.errors.city ? "text-red-500" : ""}>Municipio</Label>
                <Input id="city" error={!!form.formState.errors.city} {...form.register("city")} placeholder="Ej. Valladolid" />
                {form.formState.errors.city && <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="province" className={form.formState.errors.province ? "text-red-500" : ""}>Provincia</Label>
                <Input id="province" error={!!form.formState.errors.province} {...form.register("province")} placeholder="Ej. Valladolid" />
                {form.formState.errors.province && <p className="text-sm text-red-500">{form.formState.errors.province.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipcode" className={form.formState.errors.zipcode ? "text-red-500" : ""}>Código Postal</Label>
                <Input id="zipcode" error={!!form.formState.errors.zipcode} {...form.register("zipcode")} placeholder="Ej. 47006" />
                {form.formState.errors.zipcode && <p className="text-sm text-red-500">{form.formState.errors.zipcode.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="urbanization_name">Nombre de la urbanización</Label>
                <Input id="urbanization_name" {...form.register("urbanization_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block_stairs">Bloque / Esc.</Label>
                <Input id="block_stairs" {...form.register("block_stairs")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="door">Puerta</Label>
                <Input id="door" {...form.register("door")} />
              </div>
              
              <div className="space-y-2 flex flex-col justify-center gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_top_floor" {...form.register("is_top_floor")} />
                  <Label htmlFor="is_top_floor">Es la última planta del bloque</Label>
                </div>
              </div>

              <div className="space-y-3 col-span-1 md:col-span-2 mt-4 bg-gray-50 p-4 rounded border">
                <Label className="font-semibold text-base block mb-2">Visibilidad en portales</Label>
                <div className="flex items-center gap-2">
                  <input type="radio" id="vis_exact" value="exact" {...form.register("visibility")} />
                  <Label htmlFor="vis_exact">Dirección exacta (Recomendado)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="vis_street" value="street_only" {...form.register("visibility")} />
                  <Label htmlFor="vis_street">Mostrar sólo calle</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="vis_hidden" value="hidden" {...form.register("visibility")} />
                  <Label htmlFor="vis_hidden">Ocultar dirección</Label>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: DIMENSIONES Y CARACTERÍSTICAS COMUNES */}
          <section className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
              Tamaño y Estado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="area_built" className={form.formState.errors.area_built ? "text-red-500" : ""}>M² Construidos</Label>
                <Input id="area_built" type="number" error={!!form.formState.errors.area_built} {...form.register("area_built", { valueAsNumber: true })} />
                {form.formState.errors.area_built && <p className="text-sm text-red-500">{form.formState.errors.area_built.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_useful" className={form.formState.errors.area_useful ? "text-red-500" : ""}>M² Útiles</Label>
                <Input id="area_useful" type="number" error={!!form.formState.errors.area_useful} {...form.register("area_useful", { valueAsNumber: true })} />
                {form.formState.errors.area_useful && <p className="text-sm text-red-500">{form.formState.errors.area_useful.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="block mb-2">Estado de Conservación</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input type="radio" id="cond_buen" value="buen_estado" {...form.register("condition")} />
                    <Label htmlFor="cond_buen">Buen estado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id="cond_reformar" value="a_reformar" {...form.register("condition")} />
                    <Label htmlFor="cond_reformar">A reformar</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id="cond_obra" value="obra_nueva" {...form.register("condition")} />
                    <Label htmlFor="cond_obra">Obra nueva</Label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 4: CARACTERÍSTICAS ESPECÍFICAS (DINÁMICAS) */}
          <section className="bg-blue-50/30 p-6 border border-blue-100 rounded-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-900 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
              Características Específicas ({propertyType})
            </h2>
            <SpecificFeaturesForm type={propertyType} />
          </section>

          {/* SECCIÓN 5: CERTIFICADO ENERGÉTICO */}
          <section className="p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
              Calificación de consumo de energía
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="energy_certificate">Clase energética</Label>
                <select id="energy_certificate" {...form.register("energy_certificate")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="en_tramite">En trámite</option>
                  <option value="exento">Exento</option>
                  <option value="A">Clase A</option>
                  <option value="B">Clase B</option>
                  <option value="C">Clase C</option>
                  <option value="D">Clase D</option>
                  <option value="E">Clase E</option>
                  <option value="F">Clase F</option>
                  <option value="G">Clase G</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy_consumption" className={form.formState.errors.energy_consumption ? "text-red-500" : ""}>Consumo de energía (kwh/m2 año)</Label>
                <Input id="energy_consumption" type="number" error={!!form.formState.errors.energy_consumption} {...form.register("energy_consumption", { valueAsNumber: true })} />
                {form.formState.errors.energy_consumption && <p className="text-sm text-red-500">{form.formState.errors.energy_consumption.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emissions_certificate">Calificación de emisiones</Label>
                <select id="emissions_certificate" {...form.register("emissions_certificate")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="en_tramite">Seleccione opción</option>
                  <option value="A">Clase A</option>
                  <option value="B">Clase B</option>
                  <option value="C">Clase C</option>
                  <option value="D">Clase D</option>
                  <option value="E">Clase E</option>
                  <option value="F">Clase F</option>
                  <option value="G">Clase G</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emissions" className={form.formState.errors.emissions ? "text-red-500" : ""}>Emisiones (kg CO / m2 año)</Label>
                <Input id="emissions" type="number" error={!!form.formState.errors.emissions} {...form.register("emissions", { valueAsNumber: true })} />
                {form.formState.errors.emissions && <p className="text-sm text-red-500">{form.formState.errors.emissions.message}</p>}
              </div>
            </div>
          </section>

          {/* SECCIÓN 6: TEXTOS (SEO) Y WEB */}
          <section className="p-6 border border-gray-100 rounded-xl">
             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
               <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">6</span>
               Descripción de la propiedad
             </h2>
             <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className={form.formState.errors.title ? "text-red-500" : ""}>Título del Anuncio</Label>
                  <Input id="title" error={!!form.formState.errors.title} {...form.register("title")} placeholder="Ej. Espectacular ático con vistas..." />
                  {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className={form.formState.errors.description ? "text-red-500" : ""}>Descripción Detallada (SEO)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={generateDescriptionWithAI} disabled={isGeneratingAI}>
                      <Sparkles size={14} className="mr-2" />
                      {isGeneratingAI ? 'Generando...' : 'Mejorar texto con IA'}
                    </Button>
                  </div>
                  <textarea id="description" {...form.register("description")} className={`flex min-h-[160px] w-full rounded-md border bg-background px-3 py-2 text-sm ${form.formState.errors.description ? "border-red-500 focus-visible:ring-red-500 bg-red-50/10 text-red-900" : "border-input"}`} />
                  {form.formState.errors.description && <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Sitio web (Link a tour o web externa)</Label>
                  <Input id="website_url" {...form.register("website_url")} placeholder="https://..." />
                </div>
             </div>
          </section>

          {/* SECCIÓN 7: DATOS INTERNOS */}
          <section className="bg-orange-50/30 p-6 border border-orange-100 rounded-xl">
            <h2 className="text-xl font-semibold mb-6 text-orange-900 flex items-center gap-2">
              <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">7</span>
              Datos internos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="capture_agent">Agente captador</Label>
                <Input id="capture_agent" {...form.register("capture_agent")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_agent">Agente comercializador</Label>
                <Input id="sales_agent" {...form.register("sales_agent")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal_reference">Referencia Interna (Autogenerada)</Label>
                <Input id="internal_reference" {...form.register("internal_reference")} readOnly className="bg-gray-100/70 text-gray-500 cursor-not-allowed font-medium" />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="private_notes">Notas privadas</Label>
                <textarea id="private_notes" {...form.register("private_notes")} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes_visibility">Visibilidad de las notas</Label>
                <select id="notes_visibility" {...form.register("notes_visibility")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="solo_yo">Las ves tú y tu coordinador</option>
                  <option value="oficina">Las ve toda la oficina</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECCIÓN 8: MULTIMEDIA */}
          <section className="p-6 border border-gray-100 rounded-xl">
             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
               <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">8</span>
               Multimedia
             </h2>
             <MediaUploader maxFiles={50} onFilesUpdate={setSelectedFiles} initialMedia={initialMedia} onMediaDelete={handleMediaDelete} />
          </section>

          {/* SECCIÓN 9: PUBLICACIÓN */}
          <section className="bg-green-50/30 p-6 border border-green-100 rounded-xl">
            <h2 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2">
              <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">9</span>
              Publicación y Distribución
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border flex-1">
                <input type="checkbox" id="publish_web" {...form.register("publish_web")} className="h-5 w-5 rounded" />
                <div className="flex flex-col"><Label htmlFor="publish_web" className="text-base font-medium">Web Propia</Label></div>
              </div>
              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border flex-1">
                <input type="checkbox" id="publish_idealista" {...form.register("publish_idealista")} className="h-5 w-5 rounded" />
                <div className="flex flex-col"><Label htmlFor="publish_idealista" className="text-base font-medium">Idealista</Label></div>
              </div>
              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border flex-1">
                <input type="checkbox" id="publish_fotocasa" {...form.register("publish_fotocasa")} className="h-5 w-5 rounded" />
                <div className="flex flex-col"><Label htmlFor="publish_fotocasa" className="text-base font-medium">Fotocasa</Label></div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-8 pb-4">
            <Button type="submit" size="lg" className="w-full md:w-auto px-12" disabled={isSubmitting}>
              {isSubmitting ? 'Validando y Guardando...' : (initialData ? 'Guardar Cambios' : 'Publicar Inmueble')}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
