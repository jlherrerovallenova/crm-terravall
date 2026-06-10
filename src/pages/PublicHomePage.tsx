import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const PublicHomePage = () => {
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('publish_web', true)
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data);
      });
  }, []);

  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <section className="relative h-[85vh] w-full border-b border-black">
        <div className="absolute inset-0 p-6 md:p-12 pb-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Arquitectura" 
            className="w-full h-full object-cover filter grayscale-[20%]"
          />
        </div>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 bg-black/20">
          <h1 className="text-5xl md:text-8xl font-serif text-white mb-6 drop-shadow-md">
            Espacios Singulares
          </h1>
          <p className="text-sm md:text-base font-light text-white tracking-widest uppercase max-w-2xl drop-shadow">
            Arquitectura · Diseño · Vida
          </p>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="py-24 md:py-40 max-w-screen-xl mx-auto px-6 text-center border-b border-gray-200">
        <h2 className="text-3xl md:text-5xl font-serif text-black leading-tight max-w-4xl mx-auto text-balance">
          Nuestra colección representa una cuidada selección de viviendas que destacan por su integridad arquitectónica y diseño atemporal.
        </h2>
        <Link to="/propiedades" className="inline-block mt-16 pb-2 border-b border-black text-xs uppercase tracking-[0.2em] font-medium hover:opacity-50 transition-opacity">
          Explorar Colección
        </Link>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="py-24 max-w-screen-2xl mx-auto px-6">
        <div className="flex justify-between items-end mb-16 border-b border-black pb-4">
          <h2 className="text-xl md:text-3xl font-serif text-black">Ventas Destacadas</h2>
          <Link to="/propiedades" className="text-[10px] uppercase tracking-[0.2em] font-medium hover:opacity-50 transition-opacity">
            Ver todas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
          {featured.map(property => (
            <Link to={`/propiedades/${property.id}`} key={property.id} className="group block">
              <div className="aspect-[4/3] overflow-hidden mb-6 bg-gray-100">
                <img 
                  src={property.property_media?.[0]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'} 
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-2xl text-black">
                    {property.title || `${property.type} en ${property.city}`}
                  </h3>
                  <span className="text-sm font-light whitespace-nowrap ml-4">
                    {property.price.toLocaleString()} €
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500">
                  {property.city}, {property.province}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
