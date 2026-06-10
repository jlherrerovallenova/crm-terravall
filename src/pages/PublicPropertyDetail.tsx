import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';

export const PublicPropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
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
        <Link to="/propiedades" className="text-[10px] uppercase tracking-[0.2em] border-b border-black pb-1 hover:opacity-50 transition-opacity">Volver a colección</Link>
      </div>
    );
  }

  const images = property.property_media || [];
  const mainImage = images.length > 0 ? images[0].url : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80';

  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6 flex items-center">
        <Link to="/propiedades" className="flex items-center text-[10px] uppercase tracking-[0.2em] hover:opacity-50 transition-opacity">
          <ArrowLeft size={14} className="mr-4" strokeWidth={1.5} /> Colección
        </Link>
      </div>

      {/* Hero Image */}
      <div className="w-full h-[70vh] md:h-[85vh] border-y border-black">
        <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
      </div>

      {/* Main Title & Details */}
      <div className="max-w-screen-2xl mx-auto px-6 pt-16 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b border-gray-200 pb-16">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-serif text-black mb-6 leading-tight">
              {property.title || `${property.type} en ${property.city}`}
            </h1>
            <p className="text-sm font-light uppercase tracking-widest text-gray-500">
              {property.city}, {property.province}
            </p>
          </div>
          <div className="shrink-0 text-left md:text-right">
            <p className="text-3xl md:text-4xl font-serif text-black mb-2">{property.price.toLocaleString()} €</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{property.operation}</p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-16">
          
          {/* Key Features Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-32">
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-black mb-8 border-b border-black pb-4">Detalles</h3>
              <ul className="space-y-6 text-sm font-light">
                <li className="flex justify-between border-b border-gray-100 pb-4">
                  <span className="text-gray-500">Superficie</span>
                  <span className="text-black">{property.area_built} m²</span>
                </li>
                {property.specific_features?.rooms && (
                  <li className="flex justify-between border-b border-gray-100 pb-4">
                    <span className="text-gray-500">Habitaciones</span>
                    <span className="text-black">{property.specific_features.rooms}</span>
                  </li>
                )}
                {property.specific_features?.bathrooms && (
                  <li className="flex justify-between border-b border-gray-100 pb-4">
                    <span className="text-gray-500">Baños</span>
                    <span className="text-black">{property.specific_features.bathrooms}</span>
                  </li>
                )}
                <li className="flex justify-between border-b border-gray-100 pb-4">
                  <span className="text-gray-500">Estado</span>
                  <span className="text-black capitalize">{property.condition.replace('_', ' ')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Description */}
          <div className="lg:col-span-6">
            <h3 className="text-2xl font-serif text-black mb-8">Memoria Descriptiva</h3>
            <div className="prose prose-slate max-w-none text-black font-light leading-relaxed prose-p:mb-6">
              {property.description?.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              )) || <p>Esta propiedad es un lienzo en blanco esperando ser descubierto. Sus características arquitectónicas puras ofrecen múltiples posibilidades.</p>}
            </div>

            {/* Additional Gallery */}
            {images.length > 1 && (
              <div className="mt-24 space-y-12">
                {images.slice(1).map((img: any, idx: number) => (
                  <div key={idx} className="w-full">
                    <img src={img.url} alt={`Vista ${idx+2}`} className="w-full h-auto" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="sticky top-32 bg-gray-50 p-8 border border-gray-200">
              <h3 className="text-xl font-serif text-black mb-8">Solicitar Dossier</h3>
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); alert('Solicitud enviada (Simulación)'); }}>
                <div>
                  <input type="text" placeholder="NOMBRE" required className="w-full bg-transparent border-b border-black pb-3 text-[11px] uppercase tracking-widest outline-none placeholder-gray-400 focus:border-black transition-colors" />
                </div>
                <div>
                  <input type="email" placeholder="EMAIL" required className="w-full bg-transparent border-b border-black pb-3 text-[11px] uppercase tracking-widest outline-none placeholder-gray-400 focus:border-black transition-colors" />
                </div>
                <div>
                  <input type="tel" placeholder="TELÉFONO" className="w-full bg-transparent border-b border-black pb-3 text-[11px] uppercase tracking-widest outline-none placeholder-gray-400 focus:border-black transition-colors" />
                </div>
                <div>
                  <textarea placeholder="MENSAJE" rows={4} className="w-full bg-transparent border-b border-black pb-3 pt-3 text-[11px] uppercase tracking-widest outline-none placeholder-gray-400 focus:border-black transition-colors resize-none"></textarea>
                </div>
                <button type="submit" className="w-full bg-black text-white text-[11px] uppercase tracking-[0.2em] py-5 hover:bg-white hover:text-black border border-black transition-colors">
                  Contactar
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
