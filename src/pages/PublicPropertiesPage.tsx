import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const PublicPropertiesPage = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const typeFilter = searchParams.get('type') || 'todos';

  useEffect(() => {
    let query = supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('publish_web', true);

    if (typeFilter !== 'todos') {
      query = query.eq('type', typeFilter);
    }

    query.then(({ data, error }) => {
      if (data) setProperties(data);
      setLoading(false);
    });
  }, [typeFilter]);

  return (
    <div className="bg-white min-h-screen pt-12 pb-24">
      <div className="max-w-screen-2xl mx-auto px-6">
        
        {/* Header & Filters */}
        <div className="border-b border-black pb-8 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-black mb-2">Colección</h1>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.2em]">
            <button 
              onClick={() => setSearchParams({ type: 'todos' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'todos' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setSearchParams({ type: 'piso' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'piso' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Pisos
            </button>
            <button 
              onClick={() => setSearchParams({ type: 'chalet' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'chalet' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Chalets
            </button>
            <button 
              onClick={() => setSearchParams({ type: 'local' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'local' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Locales
            </button>
            <button 
              onClick={() => setSearchParams({ type: 'oficina' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'oficina' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Oficinas
            </button>
            <button 
              onClick={() => setSearchParams({ type: 'terreno' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'terreno' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Terrenos
            </button>
            <button 
              onClick={() => setSearchParams({ type: 'nave' })}
              className={`pb-1 border-b transition-colors cursor-pointer ${typeFilter === 'nave' ? 'border-black text-black font-semibold' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Naves
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <span className="text-[10px] uppercase tracking-[0.2em] animate-pulse">Cargando...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-serif text-black mb-4">Colección vacía</h3>
            <p className="text-sm font-light max-w-md text-balance text-gray-500">Actualmente no disponemos de propiedades bajo estos criterios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {properties.map(property => (
              <Link to={`/web/propiedades/${property.id}`} key={property.id} className="group block">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-gray-100">
                  <img 
                    src={property.property_media?.[0]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out filter hover:grayscale-[20%]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-xl text-black leading-tight">
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
        )}
      </div>
    </div>
  );
};
