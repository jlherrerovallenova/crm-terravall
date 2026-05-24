import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyFormValues } from '@/schema/property.schema';
import { supabase } from '@/lib/supabase';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SpecificFeaturesForm } from './SpecificFeaturesForm';
import { MediaUploader, MediaItem } from './MediaUploader';
import { Sparkles } from 'lucide-react';

interface PropertyFormProps {
  initialData?: PropertyFormValues & { id?: string };
}

export const PropertyForm: React.FC<PropertyFormProps> = ({ initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [initialMedia, setInitialMedia] = useState<MediaItem[]>([]);

  React.useEffect(() => {
    if (initialData?.id) {
      supabase.from('property_media').select('*').eq('property_id', initialData.id).then(({ data }) => {
        if (data) setInitialMedia(data);
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
      if (!initialData?.id) {
        form.reset();
        setSelectedFiles([]);
      } else {
        // Recargar media si estamos editando
        supabase.from('property_media').select('*').eq('property_id', propertyId).then(({ data }) => {
          if (data) setInitialMedia(data);
        });
        setSelectedFiles([]);
      }
    } catch (error: any) {
      console.error('Error al guardar el inmueble:', error);
      alert(error.message || "Error al comunicarse con Supabase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDescriptionWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const data = form.getValues();
      
      // Construimos el prompt interno
      const characteristics = `
        Tipo: ${data.type} ${data.subtype ? `(${data.subtype})` : ''}
        Operación: ${data.operation}
        Precio: ${data.price}€
        Ubicación: ${data.address_public}, ${data.city} (${data.province})
        Superficie: Construidos ${data.area_built}m², Útiles ${data.area_useful}m²
        Estado: ${data.condition}
        Características Específicas: ${JSON.stringify(data.specific_features)}
      `;

      const prompt = `
        Actúa como un agente inmobiliario técnico. Redacta una descripción para un portal inmobiliario basándote en estos datos:
        ${characteristics}
        
        REGLAS:
        - Sé puramente técnico, directo y descriptivo.
        - NO uses lenguaje poético, adornos, ni adjetivos emocionales (ej. "maravilloso", "hogar de tus sueños", "espectacular").
        - Organiza el texto en 2 o 3 párrafos limpios destacando la distribución, ubicación y características clave.
        - Longitud óptima: 100-150 palabras.
      `;

      // Simulación de llamada a API de IA (Aquí iría el fetch a tu backend/OpenAI)
      console.log("Llamando a IA con prompt:", prompt);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const formatFeatures = () => {
        if (!data.specific_features) return "";
        const f: any = data.specific_features;
        const sentences = [];
        
        if (data.type === 'piso') {
          sentences.push(`Ubicado en la planta ${f.floor || 'baja'} del edificio, la finca ${f.has_elevator ? 'dispone de ascensor' : 'carece de ascensor'}.`);
          sentences.push(`Su distribución interior consta de ${f.rooms || 0} habitaciones y ${f.bathrooms || 0} cuartos de baño.`);
          if (f.has_terrace) sentences.push(`Cuenta además con terraza.`);
          if (f.community_fees) sentences.push(`Los gastos fijos de comunidad ascienden a ${f.community_fees}€ mensuales.`);
        } else if (data.type === 'chalet') {
          sentences.push(`Asentado sobre una parcela de ${f.plot_area || 0} m², la edificación consta de ${f.floors_count || 1} plantas.`);
          sentences.push(`La distribución incluye ${f.rooms || 0} habitaciones y ${f.bathrooms || 0} cuartos de baño.`);
          if (f.has_pool) sentences.push(`Dispone de piscina privada en sus instalaciones.`);
        } else if (data.type === 'local') {
          sentences.push(`El activo comercial cuenta con una fachada principal de ${f.facade_meters || 0} metros lineales y un total de ${f.shop_windows || 0} escaparates.`);
          sentences.push(`Presenta una configuración interior de tipo ${f.layout || 'diáfano'}.`);
          if (f.smoke_extractor) sentences.push(`La instalación está equipada con salida de humos reglamentaria.`);
        }
        return sentences.join(" ");
      };

      const mockAiResponse = `Inmueble de tipología ${data.type} ${data.subtype ? `(${data.subtype})` : ''} ofertado para ${data.operation} en el término municipal de ${data.city} (${data.province}). El activo registra una superficie construida total de ${data.area_built} m², de los cuales ${data.area_useful} m² corresponden a superficie útil transitable. A nivel estructural e instalaciones, el estado de conservación se cataloga como: ${data.condition.replace('_', ' ')}. Valoración económica de salida: ${data.price}€. Su emplazamiento exacto en ${data.address_public} proporciona un acceso eficiente a las principales vías e infraestructuras del sector.

${formatFeatures()}

El certificado de eficiencia energética consta con calificación: ${data.energy_certificate.toUpperCase().replace('_', ' ')}. Expediente técnico disponible para su análisis detallado.`;

      form.setValue('description', mockAiResponse, { shouldValidate: true });
      
    } catch (error) {
      console.error("Error generando IA:", error);
      alert("Hubo un error al generar el texto.");
    } finally {
      setIsGeneratingAI(false);
    }
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          
          {/* SECCIÓN 1: TIPO Y OPERACIÓN */}
          <section className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Datos Principales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Inmueble</Label>
                <select 
                  id="type"
                  {...form.register("type")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="piso">Piso / Apartamento</option>
                  <option value="chalet">Chalet / Casa</option>
                  <option value="local">Local Comercial</option>
                </select>
                {form.formState.errors.type && <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>}
              </div>

              {propertyType === 'piso' && (
                <div className="space-y-2">
                  <Label htmlFor="subtype">Subtipo de Inmueble</Label>
                  <select 
                    id="subtype"
                    {...form.register("subtype")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="piso">Piso estándar</option>
                    <option value="atico">Ático</option>
                    <option value="duplex">Dúplex</option>
                    <option value="estudio">Estudio</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="operation">Operación</Label>
                <select 
                  id="operation"
                  {...form.register("operation")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="traspaso">Traspaso</option>
                </select>
                {form.formState.errors.operation && <p className="text-sm text-red-500">{form.formState.errors.operation.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (€)</Label>
                <Input id="price" type="number" {...form.register("price", { valueAsNumber: true })} />
                {form.formState.errors.price && <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Estado de Conservación</Label>
                <select 
                  id="condition"
                  {...form.register("condition")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="buen_estado">Buen Estado</option>
                  <option value="a_reformar">A Reformar</option>
                  <option value="obra_nueva">Obra Nueva</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="energy_certificate">Certificado Energético</Label>
                <select 
                  id="energy_certificate"
                  {...form.register("energy_certificate")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="en_tramite">En trámite</option>
                  <option value="exento">Exento (Inmueble Protegido/Ruina)</option>
                  <option value="A">Clase A</option>
                  <option value="B">Clase B</option>
                  <option value="C">Clase C</option>
                  <option value="D">Clase D</option>
                  <option value="E">Clase E</option>
                  <option value="F">Clase F</option>
                  <option value="G">Clase G</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: CARACTERÍSTICAS COMUNES */}
          <section className="p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Ubicación y Dimensiones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address_hidden">Dirección Exacta (Privada)</Label>
                <Input id="address_hidden" {...form.register("address_hidden")} placeholder="Ej. Calle Mayor 12, 3º B" />
                {form.formState.errors.address_hidden && <p className="text-sm text-red-500">{form.formState.errors.address_hidden.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_public">Ubicación Pública</Label>
                <Input id="address_public" {...form.register("address_public")} placeholder="Ej. Zona Centro" />
                {form.formState.errors.address_public && <p className="text-sm text-red-500">{form.formState.errors.address_public.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Municipio</Label>
                <Input id="city" {...form.register("city")} placeholder="Ej. Madrid" />
                {form.formState.errors.city && <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" {...form.register("province")} placeholder="Ej. Madrid" />
                {form.formState.errors.province && <p className="text-sm text-red-500">{form.formState.errors.province.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipcode">Código Postal</Label>
                <Input id="zipcode" {...form.register("zipcode")} placeholder="Ej. 28001" />
                {form.formState.errors.zipcode && <p className="text-sm text-red-500">{form.formState.errors.zipcode.message}</p>}
              </div>
              <div className="space-y-2 flex items-center gap-2 mt-8">
                <input type="checkbox" id="hide_exact_address" {...form.register("hide_exact_address")} />
                <Label htmlFor="hide_exact_address">Ocultar calle exacta en Idealista</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_built">Metros Construidos</Label>
                <Input id="area_built" type="number" {...form.register("area_built", { valueAsNumber: true })} />
                {form.formState.errors.area_built && <p className="text-sm text-red-500">{form.formState.errors.area_built.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_useful">Metros Útiles</Label>
                <Input id="area_useful" type="number" {...form.register("area_useful", { valueAsNumber: true })} />
                {form.formState.errors.area_useful && <p className="text-sm text-red-500">{form.formState.errors.area_useful.message}</p>}
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: CARACTERÍSTICAS ESPECÍFICAS (DINÁMICAS) */}
          <section className="bg-blue-50/30 p-6 border border-blue-100 rounded-xl">
            <h2 className="text-xl font-semibold mb-6 text-blue-900 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
              Características Específicas ({propertyType})
            </h2>
            <SpecificFeaturesForm type={propertyType} />
          </section>

          {/* SECCIÓN 4: TEXTOS (SEO) */}
          <section className="p-6 border border-gray-100 rounded-xl">
             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
               <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
               Textos Comerciales
             </h2>
             <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Anuncio</Label>
                  <Input id="title" {...form.register("title")} placeholder="Ej. Espectacular ático con vistas en el centro..." />
                  {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Descripción Detallada (SEO)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={generateDescriptionWithAI}
                      disabled={isGeneratingAI}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Sparkles size={14} className="mr-2" />
                      {isGeneratingAI ? 'Generando...' : 'Autocompletar con IA'}
                    </Button>
                  </div>
                  <textarea 
                    id="description" 
                    {...form.register("description")} 
                    className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Describe el inmueble destacando sus puntos fuertes o utiliza el generador automático de IA..."
                  />
                  {form.formState.errors.description && <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>}
                </div>
             </div>
          </section>

          {/* SECCIÓN 5: MULTIMEDIA */}
          <section className="p-6 border border-gray-100 rounded-xl">
             <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
               <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
               Multimedia
             </h2>
             <MediaUploader 
                maxFiles={50} 
                onFilesUpdate={setSelectedFiles} 
                initialMedia={initialMedia}
                onMediaDelete={handleMediaDelete}
             />
          </section>

          {/* SECCIÓN 6: DISTRIBUCIÓN Y PUBLICACIÓN */}
          <section className="bg-green-50/30 p-6 border border-green-100 rounded-xl">
            <h2 className="text-xl font-semibold mb-6 text-green-900 flex items-center gap-2">
              <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">6</span>
              Publicación y Distribución
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-1">
                <input 
                  type="checkbox" 
                  id="publish_web" 
                  {...form.register("publish_web")} 
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <div className="flex flex-col">
                  <Label htmlFor="publish_web" className="text-base font-medium cursor-pointer">Web Propia</Label>
                  <span className="text-xs text-gray-500">Publicar en la página de la agencia</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-1">
                <input 
                  type="checkbox" 
                  id="publish_idealista" 
                  {...form.register("publish_idealista")} 
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <div className="flex flex-col">
                  <Label htmlFor="publish_idealista" className="text-base font-medium cursor-pointer">Idealista</Label>
                  <span className="text-xs text-gray-500">Incluir en el feed XML de Idealista</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-1">
                <input 
                  type="checkbox" 
                  id="publish_fotocasa" 
                  {...form.register("publish_fotocasa")} 
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <div className="flex flex-col">
                  <Label htmlFor="publish_fotocasa" className="text-base font-medium cursor-pointer">Fotocasa</Label>
                  <span className="text-xs text-gray-500">Incluir en el feed XML de Fotocasa</span>
                </div>
              </div>
            </div>
          </section>

          {/* BOTÓN DE SUBMIT */}
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
