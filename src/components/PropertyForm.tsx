import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyFormValues } from '@/schema/property.schema';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';
import { generatePropertyDescription, lookupZipcodeByGemini } from '@/lib/gemini';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { SpecificFeaturesForm } from './SpecificFeaturesForm';
import { MediaUploader, type MediaItem } from './MediaUploader';
import { 
  Sparkles, 
  Home, 
  Key, 
  Store, 
  Briefcase, 
  Compass, 
  Warehouse, 
  MapPin, 
  Eye, 
  EyeOff, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  Info,
  CheckCircle2,
  FileText,
  AlertCircle,
  Clipboard,
  Ruler,
  Globe,
  Share2,
  Lock,
  Building,
  Upload,
  ArrowRight,
  Activity,
  FileSignature,
  User,
  Percent,
  Clock
} from 'lucide-react';

interface PropertyFormProps {
  initialData?: PropertyFormValues & { id?: string };
}

const steps = [
  { id: 1, name: 'Básicos', desc: 'Tipo, precio y contrato', icon: Clipboard },
  { id: 2, name: 'Ubicación', desc: 'Dirección y visibilidad', icon: MapPin },
  { id: 3, name: 'Detalles', desc: 'Características y energía', icon: Ruler },
  { id: 4, name: 'Publicación', desc: 'Fotos, descripción y portales', icon: Globe },
  { id: 5, name: 'Encargo Venta', desc: 'Propietario y honorarios', icon: FileSignature }
];

const propertyTypes = [
  { value: 'piso', label: 'Piso / Apartamento', icon: Home, desc: 'Apartamentos, áticos, dúplex y estudios' },
  { value: 'chalet', label: 'Chalet / Casa', icon: Key, desc: 'Casas unifamiliares, chalets y adosados' },
  { value: 'local', label: 'Local Comercial', icon: Store, desc: 'Locales comerciales, oficinas a pie de calle' },
  { value: 'oficina', label: 'Oficina', icon: Briefcase, desc: 'Despachos, oficinas en edificios comerciales' },
  { value: 'terreno', label: 'Terreno', icon: Compass, desc: 'Parcelas urbanas, rústicas e industriales' },
  { value: 'nave', label: 'Nave Industrial', icon: Warehouse, desc: 'Almacenes, naves comerciales y logísticas' },
];

const operations = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'traspaso', label: 'Traspaso' }
];

const energyOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'exento', 'en_tramite'];

const energyClassColors: Record<string, string> = {
  A: 'bg-[#00a651] text-white border-[#00a651]',
  B: 'bg-[#5cb85c] text-white border-[#5cb85c]',
  C: 'bg-[#bfd730] text-black border-[#bfd730]',
  D: 'bg-[#fff200] text-black border-[#fff200]',
  E: 'bg-[#ffc20e] text-black border-[#ffc20e]',
  F: 'bg-[#f58220] text-white border-[#f58220]',
  G: 'bg-[#ed1c24] text-white border-[#ed1c24]',
  exento: 'bg-slate-200 text-slate-700 border-slate-350',
  en_tramite: 'bg-slate-200 text-slate-700 border-slate-350'
};

const defaultSpecificFeatures = {
  // Piso / Vivienda
  floor: 0,
  rooms: 0,
  bathrooms: 0,
  community_fees: 0,
  has_elevator: false,
  has_terrace: false,
  has_balcony: false,
  orientation: [],
  interior_exterior: 'exterior',
  built_in_wardrobes: false,
  air_conditioning: false,
  has_storage_room: false,
  has_pool: false,
  has_garden: false,
  has_parking: false,
  parking_included: true,
  parking_price: 0,
  accessible_exterior: false,
  wheelchair_accessible: false,
  construction_year: 0,
  // Chalet
  plot_area: 0,
  garden_type: 'ninguno',
  floors_count: 1,
  // Local
  facade_meters: 0,
  smoke_extractor: false,
  last_activity: '',
  layout: 'diáfano',
  shop_windows: 0,
  // Oficina
  // Terreno
  zoning: 'residencial',
  buildable_area: 0,
  has_electricity: false,
  has_water: false,
  has_gas: false,
  has_sewerage: false,
  // Nave
  activity: 'almacen',
  height_free: 0,
  loading_docks: 0,
  cranes_count: 0,
  has_heating: false,
  has_air_conditioning: false,
  has_security_system: false,
  has_fire_system: false,
  has_offices: false
};

export const PropertyForm: React.FC<PropertyFormProps> = ({ initialData }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [initialMedia, setInitialMedia] = useState<MediaItem[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isLookingUpZipcode, setIsLookingUpZipcode] = useState(false);

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

  React.useEffect(() => {
    if (selectedFiles.length > 0) {
      const url = URL.createObjectURL(selectedFiles[0]);
      setPreviewImage(url);
      return () => URL.revokeObjectURL(url);
    } else if (initialMedia.length > 0) {
      setPreviewImage(initialMedia[0].url);
    } else {
      setPreviewImage('');
    }
  }, [selectedFiles, initialMedia]);

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
    defaultValues: initialData ? {
      ...initialData,
      specific_features: {
        ...defaultSpecificFeatures,
        ...initialData.specific_features
      }
    } : {
      type: 'piso',
      operation: 'venta',
      visibility: 'exact',
      is_top_floor: false,
      is_bank_owned: false,
      exceptional_situation: 'ninguna',
      energy_certificate: 'en_tramite',
      emissions_certificate: 'en_tramite',
      notes_visibility: 'solo_yo',
      commission_type: 'porcentaje',
      specific_features: defaultSpecificFeatures
    } as any,
  });

  const propertyType = form.watch('type');
  const isFirstRender = React.useRef(true);

  // Clear specific_features when property type changes to avoid mixing fields from different types
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    form.setValue('specific_features', defaultSpecificFeatures);
    form.setValue('subtype', '');
  }, [propertyType, form]);

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
          let fileToUpload = file;
          try {
            if (file.type.startsWith('image/')) {
              fileToUpload = await compressImage(file);
            }
          } catch (compressErr) {
            console.error("Error al comprimir la foto, subiendo original:", compressErr);
          }

          const fileExt = fileToUpload.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${propertyId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage.from('property_media').upload(filePath, fileToUpload);
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
      const aiResponse = await generatePropertyDescription(data);
      form.setValue('description', aiResponse, { shouldValidate: true });
    } catch (error: any) {
      console.error("Error generando IA:", error);
      alert(error.message || "Hubo un error al generar el texto.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleLookupZipcode = async () => {
    const address = form.getValues('address_hidden') || form.getValues('address_public');
    const city = form.getValues('city');
    const province = form.getValues('province');

    if (!address || !city) {
      alert("Por favor, introduce primero la dirección y el municipio.");
      return;
    }

    setIsLookingUpZipcode(true);
    try {
      const zipcode = await lookupZipcodeByGemini(address, city, province || '');
      form.setValue('zipcode', zipcode, { shouldValidate: true });
    } catch (error: any) {
      console.error("Error buscando código postal:", error);
      alert(error.message || "No se pudo encontrar el código postal automáticamente.");
    } finally {
      setIsLookingUpZipcode(false);
    }
  };

  const validateStep = async (step: number) => {
    let fieldsToValidate: string[] = [];
    if (step === 1) {
      fieldsToValidate = ['type', 'subtype', 'operation', 'price', 'exceptional_situation', 'is_bank_owned'];
    } else if (step === 2) {
      fieldsToValidate = ['address_hidden', 'address_public', 'city', 'province', 'zipcode', 'visibility'];
    } else if (step === 3) {
      fieldsToValidate = [
        'area_built', 
        'area_useful', 
        'condition', 
        'energy_certificate', 
        'energy_consumption', 
        'emissions_certificate', 
        'emissions'
      ];
      // Include specific features fields
      const specificFields = Object.keys(form.getValues('specific_features') || {});
      specificFields.forEach(f => {
        fieldsToValidate.push(`specific_features.${f}`);
      });
    }
    
    if (fieldsToValidate.length > 0) {
      return await form.trigger(fieldsToValidate as any);
    }
    return true;
  };

  const handleNextStep = async () => {
    const isStepValid = await validateStep(currentStep);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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

  // Watch fields for live preview card
  const watchType = form.watch('type');
  const watchOperation = form.watch('operation');
  const watchPrice = form.watch('price');
  const watchAddressPublic = form.watch('address_public');
  const watchCity = form.watch('city');
  const watchAreaBuilt = form.watch('area_built');
  const watchTitle = form.watch('title');
  const watchPublishWeb = form.watch('publish_web');
  const watchPublishIdealista = form.watch('publish_idealista');
  const watchPublishFotocasa = form.watch('publish_fotocasa');
  
  // Specific features for preview
  const watchRooms = form.watch('specific_features.rooms');
  const watchBathrooms = form.watch('specific_features.bathrooms');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">
            {initialData ? 'Editar Inmueble' : 'Alta de Inmueble'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {initialData ? 'Modifica los datos del inmueble para actualizar portales.' : 'Sube y configura una nueva propiedad a tu cartera.'}
          </p>
        </div>
        <div className="text-sm font-semibold font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-md border border-slate-200">
          Ref: {form.watch('internal_reference') || '---'}
        </div>
      </div>

      {/* Stepper Progress Component */}
      <div className="w-full mb-10 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs">
        <div className="flex justify-between items-center relative max-w-4xl mx-auto">
          {/* Connecting Line Background */}
          <div className="absolute left-0 right-0 top-[20px] -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
          {/* Active Line Fill */}
          <div 
            className="absolute left-0 top-[20px] -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s) => {
            const StepIcon = s.icon;
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={async () => {
                  if (s.id < currentStep) {
                    setCurrentStep(s.id);
                  } else if (s.id > currentStep) {
                    let ok = true;
                    for (let stepIdx = currentStep; stepIdx < s.id; stepIdx++) {
                      const isValid = await validateStep(stepIdx);
                      if (!isValid) {
                        ok = false;
                        break;
                      }
                    }
                    if (ok) setCurrentStep(s.id);
                  }
                }}
                className="flex flex-col items-center relative z-10 group cursor-pointer focus:outline-none"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive 
                    ? 'border-primary bg-primary text-white scale-110 shadow-md shadow-primary/20' 
                    : isCompleted 
                      ? 'border-primary bg-white text-primary' 
                      : 'border-slate-200 bg-white text-slate-400 group-hover:border-slate-350'
                }`}>
                  {isCompleted ? <Check size={16} strokeWidth={2.5} /> : <StepIcon size={16} />}
                </div>
                <div className="mt-2.5 text-center">
                  <span className={`text-xs font-bold block transition-colors ${
                    isActive ? 'text-primary' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {s.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden md:block mt-0.5">
                    {s.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form Left, Sticky Preview Right */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Form Container */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-slate-100 shadow-xs p-6 md:p-8 min-h-[460px]">
          
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
              
              {/* Show errors summary if any */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs flex gap-2.5 items-start animate-in fade-in duration-300">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <div>
                    <span className="font-bold block mb-1">Hay errores en la validación</span>
                    <span className="block mb-2">Revisa todos los campos obligatorios del formulario antes de proceder.</span>
                    <ul className="list-disc pl-4 space-y-1 font-mono">
                      {Object.entries(form.formState.errors).map(([key, error]: [string, any]) => {
                        if (key === 'specific_features' && error) {
                          return Object.entries(error).map(([subKey, subError]: [string, any]) => (
                            <li key={`${key}.${subKey}`}>
                              <strong>características.{subKey}:</strong> {subError.message || JSON.stringify(subError)}
                            </li>
                          ));
                        }
                        return (
                          <li key={key}>
                            <strong>{key}:</strong> {error.message || JSON.stringify(error)}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {/* STEP 1: INFORMACIÓN BÁSICA */}
              <div className={currentStep === 1 ? "space-y-8 animate-in fade-in duration-300" : "hidden"}>
                  
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-serif text-2xl text-slate-900 font-medium">1. Tipo y Operación</h3>
                    <p className="text-slate-500 text-xs mt-1">Elige los datos contractuales base y la tipología de la propiedad.</p>
                  </div>

                  {/* Operación */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-800">Tipo de Operación</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {operations.map(op => {
                        const isSelected = form.watch('operation') === op.value;
                        return (
                          <button
                            key={op.value}
                            type="button"
                            onClick={() => form.setValue('operation', op.value as any, { shouldValidate: true })}
                            className={`py-3 px-4 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tipo de Inmueble Grid */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-800">Tipo de Propiedad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {propertyTypes.map(pt => {
                        const Icon = pt.icon;
                        const isSelected = form.watch('type') === pt.value;
                        return (
                          <button
                            key={pt.value}
                            type="button"
                            onClick={() => form.setValue('type', pt.value as any, { shouldValidate: true })}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28 cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs text-primary'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <Icon size={24} strokeWidth={1.5} className={isSelected ? 'text-primary' : 'text-slate-400'} />
                              {isSelected && <div className="bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]"><Check size={10} strokeWidth={3} /></div>}
                            </div>
                            <div className="mt-2">
                              <span className="font-bold text-sm block">{pt.label}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1">{pt.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtypes (Conditional) */}
                  {propertyType === 'piso' && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <Label htmlFor="subtype">Subtipo de Vivienda</Label>
                      <select id="subtype" {...form.register("subtype")} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                        <option value="piso">Piso estándar</option>
                        <option value="atico">Ático</option>
                        <option value="duplex">Dúplex</option>
                        <option value="estudio">Estudio</option>
                      </select>
                    </div>
                  )}

                  {propertyType === 'nave' && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <Label htmlFor="subtype">Subtipo de Nave</Label>
                      <select id="subtype" {...form.register("subtype")} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                        <option value="nave_industrial">Nave Industrial</option>
                        <option value="nave_comercial">Nave Comercial / Logística</option>
                      </select>
                    </div>
                  )}

                  {/* Price & Bank check */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="price" className={form.formState.errors.price ? "text-red-500" : "font-semibold text-slate-800"}>
                        Precio de Salida (€) *
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">€</span>
                        <Input 
                          id="price" 
                          type="number" 
                          className="pl-8 h-11 rounded-xl"
                          error={!!form.formState.errors.price} 
                          {...form.register("price", { valueAsNumber: true })} 
                        />
                      </div>
                      {form.formState.errors.price && <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exceptional_situation" className="font-semibold text-slate-800">Situación Jurídica</Label>
                      <select id="exceptional_situation" {...form.register("exceptional_situation")} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
                        <option value="ninguna">Sin condiciones especiales</option>
                        <option value="ocupada">Ocupada ilegalmente (Okupas)</option>
                        <option value="alquilada">Alquilada (Con inquilinos)</option>
                        <option value="nuda_propiedad">Venta de Nuda Propiedad</option>
                      </select>
                    </div>
                  </div>

                  {/* Bank Check Card */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col gap-0.5 pr-4">
                      <Label htmlFor="is_bank_owned" className="font-semibold text-slate-800 cursor-pointer">Inmueble de origen bancario</Label>
                      <span className="text-[11px] text-slate-400">Marca esta casilla si procede de activos bancarios o ejecuciones hipotecarias.</span>
                    </div>
                    <input 
                      type="checkbox" 
                      id="is_bank_owned" 
                      {...form.register("is_bank_owned")} 
                      className="h-5 w-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer border-slate-300"
                    />
                  </div>

                  {/* Internal Admin Collapsible Section */}
                  <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-150 space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Lock size={12} className="text-slate-400" />
                      Gestión Interna de la Agencia
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capture_agent">Agente Captador</Label>
                        <select 
                          id="capture_agent" 
                          {...form.register("capture_agent")} 
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                        >
                          <option value="">Seleccione un agente</option>
                          <option value="MAR RIVAS">MAR RIVAS</option>
                          <option value="YOLANDA ALBA">YOLANDA ALBA</option>
                          <option value="JUAN L. HERRERO">JUAN L. HERRERO</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sales_agent">Agente Comercial asignado</Label>
                        <select 
                          id="sales_agent" 
                          {...form.register("sales_agent")} 
                          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                        >
                          <option value="">Seleccione un comercial</option>
                          <option value="MAR RIVAS">MAR RIVAS</option>
                          <option value="YOLANDA ALBA">YOLANDA ALBA</option>
                          <option value="JUAN L. HERRERO">JUAN L. HERRERO</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="private_notes">Notas Internas Privadas</Label>
                      <textarea id="private_notes" placeholder="Escribe anotaciones que no serán públicas en los portales..." {...form.register("private_notes")} className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
                    </div>

                    <div className="space-y-2 max-w-xs">
                      <Label htmlFor="notes_visibility">Visibilidad de las notas</Label>
                      <select id="notes_visibility" {...form.register("notes_visibility")} className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs focus:outline-none">
                        <option value="solo_yo">Solo visible para mí y coordinador</option>
                        <option value="oficina">Visible para toda la oficina</option>
                      </select>
                    </div>
                  </div>

                </div>

              {/* STEP 2: UBICACIÓN */}
              <div className={currentStep === 2 ? "space-y-8 animate-in fade-in duration-300" : "hidden"}>
                  
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-serif text-2xl text-slate-900 font-medium">2. Localización y Dirección</h3>
                    <p className="text-slate-500 text-xs mt-1">Ingresa los datos postales de la propiedad y configura su privacidad.</p>
                  </div>

                  {/* Public and Private addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address_hidden" className={form.formState.errors.address_hidden ? "text-red-500" : "font-semibold text-slate-800"}>
                        Dirección Interna (Calle, Número, Planta) *
                      </Label>
                      <Input 
                        id="address_hidden" 
                        placeholder="Ej. Calle Principal, 12, 3º B" 
                        className="h-11 rounded-xl"
                        error={!!form.formState.errors.address_hidden} 
                        {...form.register("address_hidden")} 
                      />
                      {form.formState.errors.address_hidden && <p className="text-xs text-red-500">{form.formState.errors.address_hidden.message}</p>}
                      <span className="text-[10px] text-slate-400 block">Esta dirección es estrictamente confidencial para agentes.</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_public" className={form.formState.errors.address_public ? "text-red-500" : "font-semibold text-slate-800"}>
                        Ubicación Pública (Zona o Barrio)
                      </Label>
                      <Input 
                        id="address_public" 
                        placeholder="Ej. Centro / Gran Vía" 
                        className="h-11 rounded-xl"
                        error={!!form.formState.errors.address_public} 
                        {...form.register("address_public")} 
                      />
                      {form.formState.errors.address_public && <p className="text-xs text-red-500">{form.formState.errors.address_public.message}</p>}
                      <span className="text-[10px] text-slate-400 block">Texto público que aparecerá en los anuncios web.</span>
                    </div>
                  </div>

                  {/* City, Province, Zipcode */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className={form.formState.errors.city ? "text-red-500" : "font-semibold text-slate-800"}>Municipio *</Label>
                      <Input id="city" className="h-11 rounded-xl" error={!!form.formState.errors.city} {...form.register("city")} placeholder="Ej. Valladolid" />
                      {form.formState.errors.city && <p className="text-xs text-red-500">{form.formState.errors.city.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province" className={form.formState.errors.province ? "text-red-500" : "font-semibold text-slate-800"}>Provincia *</Label>
                      <Input id="province" className="h-11 rounded-xl" error={!!form.formState.errors.province} {...form.register("province")} placeholder="Ej. Valladolid" />
                      {form.formState.errors.province && <p className="text-xs text-red-500">{form.formState.errors.province.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="zipcode" className={form.formState.errors.zipcode ? "text-red-500" : "font-semibold text-slate-800"}>Código Postal *</Label>
                        <button
                          type="button"
                          onClick={handleLookupZipcode}
                          disabled={isLookingUpZipcode}
                          className="text-[10px] font-bold text-primary hover:text-primary/80 disabled:text-slate-400 flex items-center gap-1 cursor-pointer select-none focus:outline-none"
                          title="Autocompletar código postal usando IA según la dirección y municipio"
                        >
                          <Sparkles size={10} className={isLookingUpZipcode ? 'animate-spin' : ''} />
                          {isLookingUpZipcode ? 'Buscando...' : 'Buscar por IA'}
                        </button>
                      </div>
                      <Input id="zipcode" className="h-11 rounded-xl" error={!!form.formState.errors.zipcode} {...form.register("zipcode")} placeholder="Ej. 47006" />
                      {form.formState.errors.zipcode && <p className="text-xs text-red-500">{form.formState.errors.zipcode.message}</p>}
                    </div>
                  </div>

                  {/* Escaleras, Bloques y urbanización */}
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Detalles del Edificio / Complejo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="urbanization_name">Urbanización</Label>
                        <Input id="urbanization_name" placeholder="Ej. Mirador de Terravall" {...form.register("urbanization_name")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="block_stairs">Bloque / Escalera</Label>
                        <Input id="block_stairs" placeholder="Ej. Portal A" {...form.register("block_stairs")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="door">Puerta</Label>
                        <Input id="door" placeholder="Ej. 3º Izquierda" {...form.register("door")} />
                      </div>
                    </div>
                  </div>

                  {/* Top Floor Checkbox Switch */}
                  {(propertyType === 'piso' || propertyType === 'oficina') && (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors animate-in fade-in">
                      <div className="flex flex-col gap-0.5 pr-4">
                        <Label htmlFor="is_top_floor" className="font-semibold text-slate-800 cursor-pointer">Última planta del edificio</Label>
                        <span className="text-[11px] text-slate-400">Marca si corresponde al ático o piso más alto del bloque.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        id="is_top_floor" 
                        {...form.register("is_top_floor")} 
                        className="h-5 w-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer border-slate-300"
                      />
                    </div>
                  )}

                  {/* Visibility Options Cards */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-800">Privacidad y Visibilidad en Portales</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'exact', label: 'Dirección exacta', desc: 'Muestra calle y número en los portales.', icon: MapPin },
                        { value: 'street_only', label: 'Solo calle', desc: 'Oculta el número exacto del inmueble.', icon: Eye },
                        { value: 'hidden', label: 'Ocultar dirección', desc: 'Solo muestra la zona general o barrio.', icon: EyeOff }
                      ].map(vis => {
                        const Icon = vis.icon;
                        const isSelected = form.watch('visibility') === vis.value;
                        return (
                          <button
                            key={vis.value}
                            type="button"
                            onClick={() => form.setValue('visibility', vis.value as any, { shouldValidate: true })}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-355'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={16} className={isSelected ? 'text-primary' : 'text-slate-500'} />
                              <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                                {vis.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 leading-normal">{vis.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              {/* STEP 3: CARACTERÍSTICAS Y CERTIFICADO */}
              <div className={currentStep === 3 ? "space-y-8 animate-in fade-in duration-300" : "hidden"}>
                  
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-serif text-2xl text-slate-900 font-medium">3. Características y Calificación</h3>
                    <p className="text-slate-500 text-xs mt-1">Especifica los m², estado de conservación, detalles particulares y eficiencia energética.</p>
                  </div>

                  {/* Areas Built and Useful */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="area_built" className={form.formState.errors.area_built ? "text-red-500" : "font-semibold text-slate-800"}>
                        Superficie Construida (M²)*
                      </Label>
                      <div className="relative">
                        <Input 
                          id="area_built" 
                          type="number" 
                          className="pr-10 h-11 rounded-xl"
                          error={!!form.formState.errors.area_built} 
                          {...form.register("area_built", { valueAsNumber: true })} 
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">m²</span>
                      </div>
                      {form.formState.errors.area_built && <p className="text-xs text-red-500">{form.formState.errors.area_built.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area_useful" className={form.formState.errors.area_useful ? "text-red-500" : "font-semibold text-slate-800"}>
                        Superficie Útil (M²)*
                      </Label>
                      <div className="relative">
                        <Input 
                          id="area_useful" 
                          type="number" 
                          className="pr-10 h-11 rounded-xl"
                          error={!!form.formState.errors.area_useful} 
                          {...form.register("area_useful", { valueAsNumber: true })} 
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">m²</span>
                      </div>
                      {form.formState.errors.area_useful && <p className="text-xs text-red-500">{form.formState.errors.area_useful.message}</p>}
                    </div>
                  </div>

                  {/* Estado de Conservación Cards */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-800">Estado del Inmueble</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'buen_estado', label: 'Buen estado', desc: 'Listo para entrar a vivir' },
                        { value: 'a_reformar', label: 'A reformar', desc: 'Requiere obras de reforma' },
                        { value: 'obra_nueva', label: 'Obra nueva', desc: 'Propiedad a estrenar' }
                      ].map(cond => {
                        const isSelected = form.watch('condition') === cond.value;
                        return (
                          <button
                            key={cond.value}
                            type="button"
                            onClick={() => form.setValue('condition', cond.value as any, { shouldValidate: true })}
                            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className={`font-bold text-sm block ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                              {cond.label}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{cond.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.condition && <p className="text-xs text-red-500 mt-1">{form.formState.errors.condition.message}</p>}
                  </div>

                  {/* Dinámicamente renderizar las características del tipo de inmueble */}
                  <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl space-y-6">
                    <h4 className="font-serif text-lg text-slate-900 font-medium border-b border-primary/10 pb-2 flex items-center gap-2">
                      <Info size={16} className="text-primary" />
                      Características Específicas: {propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}
                    </h4>
                    <SpecificFeaturesForm type={propertyType} />
                  </div>

                  {/* Certificado Energético */}
                  <div className="space-y-6 bg-slate-50/40 p-5 rounded-2xl border border-slate-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Eficiencia Energética (Consumos y Emisiones)</h4>
                    
                    {/* Clase Energética */}
                    <div className="space-y-3">
                      <Label className="font-semibold text-slate-700">Consumo Energético</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                        {energyOptions.map(opt => {
                          const isSelected = form.watch('energy_certificate') === opt;
                          let btnStyle = '';
                          
                          if (isSelected) {
                            if (opt === 'A') btnStyle = 'bg-[#00a651] text-white border-[#00a651] font-bold shadow-xs';
                            else if (opt === 'B') btnStyle = 'bg-[#5cb85c] text-white border-[#5cb85c] font-bold shadow-xs';
                            else if (opt === 'C') btnStyle = 'bg-[#bfd730] text-black border-[#bfd730] font-bold shadow-xs';
                            else if (opt === 'D') btnStyle = 'bg-[#fff200] text-black border-[#fff200] font-bold shadow-xs';
                            else if (opt === 'E') btnStyle = 'bg-[#ffc20e] text-black border-[#ffc20e] font-bold shadow-xs';
                            else if (opt === 'F') btnStyle = 'bg-[#f58220] text-white border-[#f58220] font-bold shadow-xs';
                            else if (opt === 'G') btnStyle = 'bg-[#ed1c24] text-white border-[#ed1c24] font-bold shadow-xs';
                            else btnStyle = 'bg-slate-750 text-white border-slate-750 font-bold shadow-xs';
                          } else {
                            btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350';
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => form.setValue('energy_certificate', opt as any, { shouldValidate: true })}
                              className={`h-10 rounded-lg border text-[11px] flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                            >
                              {opt === 'en_tramite' ? 'En trámite' : opt.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="energy_consumption">Valor de Consumo Energético (kWh/m² año)</Label>
                        <Input id="energy_consumption" type="number" step="any" placeholder="Ej. 120" {...form.register("energy_consumption", { valueAsNumber: true })} />
                      </div>
                    </div>

                    {/* Emisiones */}
                    <div className="space-y-3 pt-2">
                      <Label className="font-semibold text-slate-700">Calificación de Emisiones CO₂</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                        {energyOptions.map(opt => {
                          const isSelected = form.watch('emissions_certificate') === opt;
                          let btnStyle = '';
                          
                          if (isSelected) {
                            if (opt === 'A') btnStyle = 'bg-[#00a651] text-white border-[#00a651] font-bold shadow-xs';
                            else if (opt === 'B') btnStyle = 'bg-[#5cb85c] text-white border-[#5cb85c] font-bold shadow-xs';
                            else if (opt === 'C') btnStyle = 'bg-[#bfd730] text-black border-[#bfd730] font-bold shadow-xs';
                            else if (opt === 'D') btnStyle = 'bg-[#fff200] text-black border-[#fff200] font-bold shadow-xs';
                            else if (opt === 'E') btnStyle = 'bg-[#ffc20e] text-black border-[#ffc20e] font-bold shadow-xs';
                            else if (opt === 'F') btnStyle = 'bg-[#f58220] text-white border-[#f58220] font-bold shadow-xs';
                            else if (opt === 'G') btnStyle = 'bg-[#ed1c24] text-white border-[#ed1c24] font-bold shadow-xs';
                            else btnStyle = 'bg-slate-750 text-white border-slate-750 font-bold shadow-xs';
                          } else {
                            btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350';
                          }

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => form.setValue('emissions_certificate', opt as any, { shouldValidate: true })}
                              className={`h-10 rounded-lg border text-[11px] flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                            >
                              {opt === 'en_tramite' ? 'En trámite' : opt.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emissions">Valor de Emisiones (kg CO₂/m² año)</Label>
                        <Input id="emissions" type="number" step="any" placeholder="Ej. 25" {...form.register("emissions", { valueAsNumber: true })} />
                      </div>
                    </div>

                  </div>

                </div>

              {/* STEP 4: PUBLICACIÓN Y DESCRIPCIÓN */}
              <div className={currentStep === 4 ? "space-y-8 animate-in fade-in duration-300" : "hidden"}>
                  
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-serif text-2xl text-slate-900 font-medium">4. Publicación y Contenido</h3>
                    <p className="text-slate-500 text-xs mt-1">Escribe los textos publicitarios, sube imágenes y distribuye en portales.</p>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-6">
                    
                    <div className="space-y-2">
                      <Label htmlFor="title" className={form.formState.errors.title ? "text-red-500" : "font-semibold text-slate-800"}>
                        Título Comercial del Anuncio *
                      </Label>
                      <Input 
                        id="title" 
                        placeholder="Ej. Magnífico ático dúplex con piscina y terraza junto a Paseo Zorrilla" 
                        className="h-11 rounded-xl"
                        error={!!form.formState.errors.title} 
                        {...form.register("title")} 
                      />
                      {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description" className={form.formState.errors.description ? "text-red-500" : "font-semibold text-slate-800"}>
                          Descripción Detallada (Optimizado SEO) *
                        </Label>
                        
                        <button
                          type="button"
                          onClick={generateDescriptionWithAI}
                          disabled={isGeneratingAI}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-transparent shadow-xs transition-all cursor-pointer ${
                            isGeneratingAI
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-primary/10 text-primary hover:bg-primary/15 active:scale-95'
                          }`}
                        >
                          <Sparkles size={13} className={isGeneratingAI ? 'animate-spin' : 'text-primary'} />
                          {isGeneratingAI ? 'Redactando descripción...' : 'Escribir con IA'}
                        </button>
                      </div>
                      
                      <textarea 
                        id="description" 
                        placeholder="Describe la zona, distribución, luz, calidades e infraestructuras cercanas (mínimo 50 caracteres)..." 
                        {...form.register("description")} 
                        className={`flex min-h-[160px] w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          form.formState.errors.description 
                            ? "border-red-500 focus:ring-red-500/20 bg-red-50/10 text-red-955" 
                            : "border-slate-200 focus:ring-primary/25"
                        }`} 
                      />
                      {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website_url">Enlace a Tour Virtual 3D o Video</Label>
                      <Input id="website_url" placeholder="https://my.matterport.com/show/?m=..." {...form.register("website_url")} />
                    </div>

                  </div>

                  {/* Media Dropzone */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-slate-800">Galería de Imágenes de la Propiedad</Label>
                    <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/40">
                      <MediaUploader maxFiles={50} onFilesUpdate={setSelectedFiles} initialMedia={initialMedia} onMediaDelete={handleMediaDelete} />
                    </div>
                  </div>

                  {/* Portales de Publicación */}
                  <div className="space-y-4 pt-2">
                    <Label className="font-semibold text-slate-800">Canales de Distribución y Sincronización</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'publish_web', label: 'Web Terravall', desc: 'Mostrar en la página oficial inmobiliaria.' },
                        { key: 'publish_idealista', label: 'Portal Idealista', desc: 'Exportar automáticamente a Idealista.' },
                        { key: 'publish_fotocasa', label: 'Portal Fotocasa', desc: 'Exportar automáticamente a Fotocasa.' }
                      ].map(portal => {
                        const isChecked = form.watch(portal.key as any);
                        return (
                          <label
                            key={portal.key}
                            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-350'
                            }`}
                          >
                            <input
                              type="checkbox"
                              {...form.register(portal.key as any)}
                              className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-550 accent-emerald-600 cursor-pointer"
                            />
                            <div className="flex flex-col gap-0.5">
                              <span className={`font-bold text-xs ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                                {portal.label}
                              </span>
                              <span className="text-[10px] text-slate-500 leading-normal">{portal.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>

              {/* STEP 5: ENCARGO DE VENTA */}
              <div className={currentStep === 5 ? "space-y-8 animate-in fade-in duration-300" : "hidden"}>
                  
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-serif text-2xl text-slate-900 font-medium">5. Datos para el Encargo de Venta</h3>
                    <p className="text-slate-500 text-xs mt-1">Introduce la información del propietario/s, honorarios de comisión y periodo de exclusiva para formalizar el documento de encargo.</p>
                  </div>

                  {/* Datos del Propietario */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                      <User size={18} className="text-primary" />
                      <span>Datos del Propietario / Titular</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="owner_name">Nombre y Apellidos del/los propietario/s</Label>
                        <Input 
                          id="owner_name" 
                          placeholder="Ej. Juan Pérez García y Maria López Martínez" 
                          {...form.register("owner_name")} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_dni">DNI / NIF / NIE</Label>
                        <Input 
                          id="owner_dni" 
                          placeholder="Ej. 12345678X" 
                          {...form.register("owner_dni")} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="owner_address">Domicilio habitual</Label>
                        <Input 
                          id="owner_address" 
                          placeholder="Ej. Av. de Ramón y Cajal 12, 4ºA" 
                          {...form.register("owner_address")} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_zipcode">Código Postal</Label>
                        <Input 
                          id="owner_zipcode" 
                          placeholder="Ej. 47001" 
                          {...form.register("owner_zipcode")} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="owner_city">Municipio</Label>
                        <Input 
                          id="owner_city" 
                          placeholder="Ej. Valladolid" 
                          {...form.register("owner_city")} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_province">Provincia</Label>
                        <Input 
                          id="owner_province" 
                          placeholder="Ej. Valladolid" 
                          {...form.register("owner_province")} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="owner_phone">Teléfono de contacto</Label>
                        <Input 
                          id="owner_phone" 
                          type="tel"
                          placeholder="Ej. 612 345 678" 
                          {...form.register("owner_phone")} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="owner_email">Correo Electrónico</Label>
                        <Input 
                          id="owner_email" 
                          type="email"
                          placeholder="Ej. propietario@email.com" 
                          {...form.register("owner_email")} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Condición Económica y Exclusiva */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-2">
                      <Percent size={18} className="text-primary" />
                      <span>Condiciones Económicas y Periodo de Exclusiva</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Tipo de Comisión</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => form.setValue("commission_type", "porcentaje")}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              form.watch("commission_type") === "porcentaje"
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            % Porcentaje
                          </button>
                          <button
                            type="button"
                            onClick={() => form.setValue("commission_type", "fija")}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              form.watch("commission_type") === "fija"
                                ? "bg-primary text-white border-primary shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Fija (€)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commission_value">
                          {form.watch("commission_type") === "porcentaje" ? "Comisión (% sobre venta)" : "Comisión Fija (€)"}
                        </Label>
                        <Input 
                          id="commission_value" 
                          type="number" 
                          step="any"
                          placeholder={form.watch("commission_type") === "porcentaje" ? "Ej. 3" : "Ej. 3000"} 
                          {...form.register("commission_value", { valueAsNumber: true })} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exclusivity_months" className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          Periodo de exclusiva (meses)
                        </Label>
                        <Input 
                          id="exclusivity_months" 
                          type="number" 
                          placeholder="Ej. 6" 
                          {...form.register("exclusivity_months", { valueAsNumber: true })} 
                        />
                      </div>
                    </div>
                  </div>

                </div>

              {/* Bottom Buttons Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 h-11 px-5 rounded-xl border-slate-200 font-semibold cursor-pointer text-slate-700"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/95 h-11 px-6 rounded-xl font-semibold cursor-pointer shadow-xs"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 bg-primary text-white hover:bg-primary/95 h-11 px-8 rounded-xl font-bold cursor-pointer shadow-md shadow-primary/10"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        {initialData ? 'Guardar Cambios' : 'Publicar Inmueble'}
                      </>
                    )}
                  </Button>
                )}
              </div>

            </form>
          </FormProvider>

        </div>

        {/* Sticky Real-Time Live Preview Sidebar */}
        <div className="hidden lg:block lg:w-80 shrink-0 lg:sticky lg:top-6 animate-in fade-in duration-500">
          
          <div className="bg-white rounded-2xl border border-slate-150 shadow-md overflow-hidden flex flex-col w-full">
            
            {/* Header / Info Badge */}
            <div className="bg-slate-55 bg-slate-50 border-b border-slate-150 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Info size={12} className="text-slate-400" />
                Vista Previa del Anuncio
              </span>
              <span className="font-mono text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded font-bold">DRAFT</span>
            </div>

            {/* Photo Area */}
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
              {previewImage ? (
                <img src={previewImage} alt="Vista previa del inmueble" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <Home size={36} strokeWidth={1.2} />
                  <span className="text-[10px] tracking-wide uppercase font-bold">Sin fotos cargadas</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3 select-none">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm border ${
                  watchOperation === 'venta' 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : watchOperation === 'alquiler' 
                      ? 'bg-indigo-500 text-white border-indigo-500' 
                      : 'bg-amber-500 text-white border-amber-500'
                }`}>
                  En {watchOperation}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-4">
              
              {/* Title & Location */}
              <div>
                <h4 className="font-serif text-lg font-bold text-slate-900 leading-snug line-clamp-2 min-h-[46px]" title={watchTitle}>
                  {watchTitle || 'Título comercial de tu anuncio'}
                </h4>
                <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-1.5">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{watchAddressPublic || watchCity || 'Dirección de publicación'}</span>
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-b border-slate-100 py-3">
                <div className="text-xs text-slate-400 font-medium">Precio ofertado</div>
                <div className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                  {watchPrice ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(watchPrice) : '--- €'}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <div className="flex items-center gap-1.5">
                  <Ruler size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {watchAreaBuilt ? `${watchAreaBuilt} m² const.` : '-- m²'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Building size={13} className="text-slate-400" />
                  <span className="font-medium text-slate-700 capitalize">
                    {watchType === 'piso' ? 'Vivienda' : watchType === 'chalet' ? 'Casa' : watchType}
                  </span>
                </div>

                {(watchType === 'piso' || watchType === 'chalet') && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <FileText size={13} className="text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {watchRooms !== undefined ? `${watchRooms} habs.` : '-- habs.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity size={13} className="text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {watchBathrooms !== undefined ? `${watchBathrooms} baños` : '-- baños'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Publication Channels */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Distribución activa</span>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                    watchPublishWeb 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                  }`}>
                    Web
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                    watchPublishIdealista 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                  }`}>
                    Idealista
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                    watchPublishFotocasa 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                  }`}>
                    Fotocasa
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
