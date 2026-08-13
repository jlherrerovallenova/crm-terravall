import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Maximize2, BedDouble, Bath, CheckCircle, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MortgageCalculator } from '@/components/MortgageCalculator';

export const PublicPropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error("Error al cargar detalle público:", error);
        if (data) setProperty(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <span className="text-[10px] uppercase tracking-[0.2em] animate-pulse">Cargando...</span>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <h2 className="text-3xl font-serif text-black mb-4">No encontrada</h2>
        <Link to="/web/propiedades" className="text-[10px] uppercase tracking-[0.2em] border-b border-black pb-1 hover:opacity-50 transition-opacity">Volver a colección</Link>
      </div>
    );
  }

  const images = property.property_media || [];
  const mainImage = images.length > 0 ? images[0].url : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80';
  const ref = property.internal_reference || `TRV-${property.id.substring(0, 6).toUpperCase()}`;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && images.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && images.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  // WhatsApp Contact Link Generator
  const getWhatsAppLink = () => {
    const defaultPhone = '34600000000'; // Teléfono oficial Terravall (configurable)
    const text = `¡Hola Terravall! Estoy interesado/a en solicitar una visita para el inmueble en ${property.city} (Ref: ${ref}). Precio: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)}. ¿Podemos agendar una visita?`;
    return `https://wa.me/${defaultPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="bg-slate-50/30 min-h-screen font-sans pb-24">
      
      {/* Navigation Top Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
          <Link to="/web/propiedades" className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-primary transition-colors gap-2">
            <ArrowLeft size={16} /> Volver al catálogo
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-md border border-slate-200 uppercase">
              Ref: {ref}
            </span>
          </div>
        </div>
      </div>

      {/* Main Image Header Grid */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 group">
          <div className="aspect-[16/9] sm:aspect-[21/9] w-full relative">
            <img 
              src={mainImage} 
              alt={property.title} 
              className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-500" 
              onClick={() => openLightbox(0)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider">
                  {property.operation}
                </span>
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider border border-white/20">
                  {property.type}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif font-medium text-white mb-2 leading-tight">
                {property.title || `${property.type} en ${property.city}`}
              </h1>
              <p className="text-sm text-white/80 flex items-center gap-1.5 font-medium">
                <MapPin size={16} className="text-primary" />
                {property.address_public ? `${property.address_public}, ` : ''}{property.city}, {property.province}
              </p>
            </div>

            {/* Gallery Fullscreen Button */}
            {images.length > 0 && (
              <button
                onClick={() => openLightbox(0)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 shadow-md transition-all cursor-pointer"
              >
                <Maximize2 size={16} />
                Ver Galería ({images.length} fotos)
              </button>
            )}
          </div>
        </div>

        {/* Thumbnail Preview Strip */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pt-4 pb-2 scrollbar-none">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx)}
                className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-primary shrink-0 transition-all cursor-pointer relative group"
              >
                <img src={img.url} alt={`Vista ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                {idx === 0 && <span className="absolute bottom-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Principal</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Info (Left Column) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Price & Summary Stats Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Precio de Salida</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1 block">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-700">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                  <Maximize2 size={18} className="text-primary" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Superficie</span>
                    <span className="font-bold text-slate-900">{property.area_built} m²</span>
                  </div>
                </div>

                {property.specific_features?.rooms !== undefined && (
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                    <BedDouble size={18} className="text-primary" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Habitaciones</span>
                      <span className="font-bold text-slate-900">{property.specific_features.rooms}</span>
                    </div>
                  </div>
                )}

                {property.specific_features?.bathrooms !== undefined && (
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-150">
                    <Bath size={18} className="text-primary" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Baños</span>
                      <span className="font-bold text-slate-900">{property.specific_features.bathrooms}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-xl font-serif font-bold text-slate-900 border-b border-slate-100 pb-3">Descripción Detallada</h3>
              <div className="prose prose-slate max-w-none text-slate-700 font-normal leading-relaxed text-sm sm:text-base whitespace-pre-line text-justify">
                {property.description || "Esta propiedad es un lienzo en blanco esperando ser descubierto. Sus características puras ofrecen múltiples posibilidades."}
              </div>
            </div>

            {/* Features & Equipment Badges */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-xl font-serif font-bold text-slate-900 border-b border-slate-100 pb-3">Equipamiento y Detalles</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span>Estado: <strong className="capitalize">{property.condition === 'buen_estado' ? 'Buen estado' : property.condition === 'obra_nueva' ? 'Obra nueva' : 'A reformar'}</strong></span>
                </div>

                {property.specific_features?.has_elevator && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Ascensor disponible</span>
                  </div>
                )}

                {property.specific_features?.has_terrace && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Terraza exterior</span>
                  </div>
                )}

                {property.specific_features?.has_parking && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Plaza de garaje</span>
                  </div>
                )}

                {property.specific_features?.has_storage_room && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Trastero</span>
                  </div>
                )}

                {property.specific_features?.has_pool && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Piscina comunitaria</span>
                  </div>
                )}

                {property.energy_certificate && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Eficiencia Energética: <strong className="uppercase">{property.energy_certificate}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* MORTGAGE & EXPENSES CALCULATOR */}
            <MortgageCalculator price={property.price} isNewWork={property.condition === 'obra_nueva'} />

          </div>

          {/* Contact Box (Right Column) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* WhatsApp Sticky Card */}
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Contacto Directo</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">Terravall Inmobiliaria</h3>
                <p className="text-xs text-slate-500 mt-1">Nuestros asesores están disponibles para concertar una visita personalizada.</p>
              </div>

              {/* WHATSAPP BUTTON (PROMINENT) */}
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <MessageSquare size={20} className="fill-current" />
                Solicitar Visita por WhatsApp
              </a>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-slate-400">O envía un email</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Email Contact Form */}
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert('¡Gracias por tu interés! Hemos recibido tu solicitud y un agente de Terravall te contactará enseguida.'); }}>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre Completo *</label>
                  <input type="text" required placeholder="Tu nombre..." className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-primary focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Teléfono *</label>
                  <input type="tel" required placeholder="Ej. 600 00 00 00" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-primary focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                  <input type="email" placeholder="tuemail@ejemplo.com" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-primary focus:bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Comentario</label>
                  <textarea rows={3} placeholder="Hola, me gustaría recibir más información..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary focus:bg-white resize-none"></textarea>
                </div>
                <button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                  Enviar Solicitud
                </button>
              </form>

              <div className="pt-2 text-center border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">Oficina Terravall: Plaza Mayor 8, 1ºA, Valladolid</span>
                <span className="text-[11px] text-slate-400 block font-medium mt-0.5">Tel: 983 12 34 56</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* LIGHTBOX MODAL FULLSCREEN */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={closeLightbox}
        >
          {/* Top Bar inside Lightbox */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-50">
            <span className="text-xs font-bold tracking-widest uppercase bg-black/50 px-4 py-1.5 rounded-full border border-white/20">
              Foto {lightboxIndex + 1} de {images.length}
            </span>
            <button 
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X size={24} />
            </button>
          </div>

          {/* Previous Arrow */}
          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors cursor-pointer z-50"
              title="Anterior foto"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Main Image */}
          <div className="max-w-6xl max-h-[85vh] flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
            <img 
              src={images[lightboxIndex]?.url} 
              alt={`Foto ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Next Arrow */}
          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors cursor-pointer z-50"
              title="Siguiente foto"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}

    </div>
  );
};
