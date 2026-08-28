import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, Filter, MapPin, Tag, BedDouble, Home, RotateCcw } from 'lucide-react';

export const PublicPropertiesPage = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const operationFilter = searchParams.get('operation') || 'todos';
  const typeFilter = searchParams.get('type') || 'todos';
  const cityFilter = searchParams.get('city') || 'todos';
  const minPriceFilter = searchParams.get('minPrice') || '';
  const maxPriceFilter = searchParams.get('maxPrice') || '';
  const roomsFilter = searchParams.get('rooms') || 'todos';
  const keywordFilter = searchParams.get('q') || '';

  // Dynamic Cities list from published database
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, property_media(url)')
      .eq('publish_web', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Error al cargar propiedades públicas:", error);
        if (data) {
          setProperties(data);
          const cities = Array.from(new Set(data.flatMap((p: any) => p.city ? [p.city] : []))) as string[];
          setAvailableCities(cities);
        }
        setLoading(false);
      });
  }, []);

  // Filter properties client-side dynamically
  useEffect(() => {
    let result = [...properties];

    if (operationFilter !== 'todos') {
      result = result.filter(p => p.operation === operationFilter);
    }

    if (typeFilter !== 'todos') {
      result = result.filter(p => p.type === typeFilter);
    }

    if (cityFilter !== 'todos') {
      result = result.filter(p => p.city === cityFilter);
    }

    if (minPriceFilter) {
      result = result.filter(p => p.price >= Number(minPriceFilter));
    }

    if (maxPriceFilter) {
      result = result.filter(p => p.price <= Number(maxPriceFilter));
    }

    if (roomsFilter !== 'todos') {
      const minRooms = Number(roomsFilter);
      result = result.filter(p => (p.specific_features?.rooms || 0) >= minRooms);
    }

    if (keywordFilter.trim() !== '') {
      const q = keywordFilter.toLowerCase();
      result = result.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.address_public && p.address_public.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.internal_reference && p.internal_reference.toLowerCase().includes(q))
      );
    }

    setFilteredProperties(result);
  }, [properties, operationFilter, typeFilter, cityFilter, minPriceFilter, maxPriceFilter, roomsFilter, keywordFilter]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'todos' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = operationFilter !== 'todos' || typeFilter !== 'todos' || cityFilter !== 'todos' || minPriceFilter || maxPriceFilter || roomsFilter !== 'todos' || keywordFilter !== '';

  return (
    <div className="bg-slate-50/50 min-h-screen pt-8 pb-24 font-sans">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-serif font-medium text-slate-900 tracking-tight">Catálogo de Inmuebles</h1>
          <p className="text-slate-500 text-sm mt-1.5">Descubre viviendas y locales en venta y alquiler en Valladolid y provincia.</p>
        </div>

        {/* Filter Panel Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-10 space-y-5">
          
          {/* Top Bar Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Search size={12} className="text-primary" />
                Buscar por palabra o ref.
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej. Ático, Centro, TRV-0001..." 
                  value={keywordFilter}
                  onChange={(e) => updateParam('q', e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Operación */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Tag size={12} className="text-primary" />
                Operación
              </label>
              <select
                value={operationFilter}
                onChange={(e) => updateParam('operation', e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="todos">Todas las Operaciones</option>
                <option value="venta">Venta / Compra</option>
                <option value="alquiler">Alquiler</option>
              </select>
            </div>

            {/* Tipo de Inmueble */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Home size={12} className="text-primary" />
                Tipo de Propiedad
              </label>
              <select
                value={typeFilter}
                onChange={(e) => updateParam('type', e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="todos">Todos los Tipos</option>
                <option value="piso">Pisos y Apartamentos</option>
                <option value="chalet">Chalets y Casas</option>
                <option value="local">Locales Comerciales</option>
                <option value="oficina">Oficinas</option>
                <option value="terreno">Terrenos / Parcelas</option>
                <option value="nave">Naves Industriales</option>
              </select>
            </div>

            {/* Municipio */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} className="text-primary" />
                Municipio
              </label>
              <select
                value={cityFilter}
                onChange={(e) => updateParam('city', e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="todos">Todos los Municipios</option>
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Secondary Filters: Price Range & Rooms */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            
            {/* Precio Min / Max */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rango de Precio (€)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Precio Mínimo (€)" 
                  value={minPriceFilter}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none focus:border-primary"
                />
                <span className="text-slate-400 font-semibold text-xs">-</span>
                <input 
                  type="number" 
                  placeholder="Precio Máximo (€)" 
                  value={maxPriceFilter}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Habitaciones mínimas & Reset */}
            <div className="flex items-end gap-3">
              <div className="space-y-1 w-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BedDouble size={12} className="text-primary" />
                  Habitaciones
                </label>
                <select
                  value={roomsFilter}
                  onChange={(e) => updateParam('rooms', e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-800 outline-none focus:border-primary cursor-pointer"
                >
                  <option value="todos">Cualquiera</option>
                  <option value="1">1+ habitación</option>
                  <option value="2">2+ habitaciones</option>
                  <option value="3">3+ habitaciones</option>
                  <option value="4">4+ habitaciones</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="h-10 px-3.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  title="Limpiar todos los filtros"
                >
                  <RotateCcw size={14} />
                  Limpiar
                </button>
              )}
            </div>

          </div>

          {/* Results Summary Counter */}
          <div className="flex justify-between items-center text-xs text-slate-500 pt-2 font-medium">
            <span>Mostrando <strong className="text-slate-900">{filteredProperties.length}</strong> propiedades de {properties.length} en total</span>
          </div>
        </div>

        {/* Grid Results */}
        {loading ? (
          <div className="flex justify-center items-center py-32 text-slate-400">
            <span className="text-xs uppercase tracking-widest font-semibold animate-pulse">Cargando catálogo...</span>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-24 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center p-8">
            <Filter size={40} className="text-slate-300 mb-3" />
            <h3 className="text-xl font-serif font-semibold text-slate-800 mb-1">No se encontraron inmuebles</h3>
            <p className="text-slate-500 text-sm max-w-md mb-6">No hay propiedades disponibles con los filtros seleccionados. Prueba a ajustar el precio o el municipio.</p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition-all">
                Restablecer Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map(property => {
              const mainImg = property.property_media?.[0]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
              const feats = property.specific_features || {};

              return (
                <Link 
                  to={`/web/propiedades/${property.id}`} 
                  key={property.id} 
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container */}
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                      <img 
                        src={mainImg} 
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      />
                      
                      {/* Operation Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-full tracking-wider shadow-sm">
                          {property.operation}
                        </span>
                        {property.internal_reference && (
                          <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase shadow-sm">
                            {property.internal_reference}
                          </span>
                        )}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-white/50">
                        <span className="text-base font-extrabold text-slate-900">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)}
                        </span>
                      </div>
                    </div>

                    {/* Info Body */}
                    <div className="p-6">
                      <div className="flex items-center text-xs font-semibold text-primary mb-1 gap-1">
                        <MapPin size={13} />
                        <span>{property.city}, {property.province}</span>
                      </div>

                      <h3 className="font-serif text-xl font-medium text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-3">
                        {property.title || `${property.type} en ${property.city}`}
                      </h3>

                      {/* Specs Icons */}
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-3 border-t border-slate-100">
                        <span><strong>{property.area_built}</strong> m²</span>
                        {feats.rooms !== undefined && (
                          <span>• <strong>{feats.rooms}</strong> habs.</span>
                        )}
                        {feats.bathrooms !== undefined && (
                          <span>• <strong>{feats.bathrooms}</strong> baños</span>
                        )}
                        {feats.has_parking && (
                          <span>• Garaje</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Bar */}
                  <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <span>Ver ficha completa</span>
                    <span>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
