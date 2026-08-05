import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const PublicHomePage = () => {
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('publish_web', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setFeatured(data);
      });
  }, []);

  return (
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, Home, MapPin, Tag } from 'lucide-react';

export const PublicHomePage = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  // Hero Search state
  const [searchOperation, setSearchOperation] = useState<string>('todos');
  const [searchType, setSearchType] = useState<string>('todos');
  const [searchCity, setSearchCity] = useState<string>('todos');

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('publish_web', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setFeatured(data.slice(0, 6));
          const uniqueCities = Array.from(new Set(data.map(p => p.city).filter(Boolean))) as string[];
          setCities(uniqueCities);
        }
      });
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchOperation !== 'todos') params.set('operation', searchOperation);
    if (searchType !== 'todos') params.set('type', searchType);
    if (searchCity !== 'todos') params.set('city', searchCity);
    navigate(`/web/propiedades?${params.toString()}`);
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* HERO SECTION WITH LUXURY SEARCH BAR */}
      <section className="relative min-h-[85vh] w-full border-b border-primary/20 flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 p-4 md:p-8 pb-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Terravall Inmuebles" 
            className="w-full h-full object-cover filter brightness-[0.75]"
          />
        </div>
        
        {/* Title */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center p-6 text-white max-w-4xl mx-auto pt-16">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold mb-3 text-white/90 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-xs border border-white/20">
            Terravall Inmobiliaria • Valladolid
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-medium text-white mb-6 drop-shadow-md leading-tight">
            Encuentra tu hogar ideal
          </h1>
          <p className="text-sm md:text-base font-light text-white/90 tracking-widest uppercase max-w-xl drop-shadow">
            La mejor cartera de viviendas, chalets y locales comerciales
          </p>
        </div>

        {/* Dynamic Search Bar Container */}
        <div className="relative z-20 max-w-5xl mx-auto w-full px-4 pb-12">
          <form 
            onSubmit={handleHeroSearch} 
            className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end"
          >
            {/* Operation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag size={12} className="text-primary" />
                Operación
              </label>
              <select
                value={searchOperation}
                onChange={(e) => setSearchOperation(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="todos">Comprar o Alquilar</option>
                <option value="venta">Comprar (Venta)</option>
                <option value="alquiler">Alquilar (Alquiler)</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Home size={12} className="text-primary" />
                Tipo de Inmueble
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="todos">Todos los tipos</option>
                <option value="piso">Pisos y Apartamentos</option>
                <option value="chalet">Chalets y Casas</option>
                <option value="local">Locales Comerciales</option>
                <option value="oficina">Oficinas</option>
                <option value="terreno">Terrenos / Parcelas</option>
                <option value="nave">Naves Industriales</option>
              </select>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} className="text-primary" />
                Municipio
              </label>
              <select
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="todos">Cualquier población</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Submit Search Button */}
            <div>
              <button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                <Search size={18} />
                Buscar Inmuebles
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="py-24 md:py-40 max-w-screen-xl mx-auto px-6 text-center border-b border-primary/20">
        <h2 className="text-3xl md:text-5xl font-serif text-primary leading-tight max-w-4xl mx-auto text-balance">
          Nuestra colección representa una cuidada selección de viviendas que destacan por su integridad arquitectónica y diseño atemporal.
        </h2>
        <Link to="/web/propiedades" className="inline-block mt-16 pb-2 border-b border-primary text-primary text-xs uppercase tracking-[0.2em] font-bold hover:opacity-70 transition-opacity">
          Explorar Colección
        </Link>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="py-24 max-w-screen-2xl mx-auto px-6">
        <div className="flex justify-between items-end mb-16 border-b border-primary/20 pb-4">
          <h2 className="text-xl md:text-3xl font-serif text-primary">Ventas Destacadas</h2>
          <Link to="/web/propiedades" className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary hover:opacity-70 transition-opacity">
            Ver todas
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
          {featured.map(property => (
            <Link to={`/web/propiedades/${property.id}`} key={property.id} className="group block">
              <div className="aspect-[4/3] overflow-hidden mb-6 bg-gray-100">
                <img 
                  src={property.property_media?.[0]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'} 
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-serif text-2xl text-primary">
                    {property.title || `${property.type} en ${property.city}`}
                  </h3>
                  <span className="text-sm font-bold text-primary whitespace-nowrap ml-4">
                    {property.price.toLocaleString()} €
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-primary/70">
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
