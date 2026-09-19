import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Filter } from 'lucide-react';
import type { PropertyRow } from '@/types/database.types';
import { PublicPropertyCard } from '@/components/public/PublicPropertyCard';
import { PublicFilterPanel } from '@/components/public/PublicFilterPanel';

export type PublicPropertyItem = PropertyRow & {
  property_media?: { url: string }[] | null;
};

export const PublicPropertiesPage = () => {
  const [properties, setProperties] = useState<PublicPropertyItem[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PublicPropertyItem[]>([]);
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

  const hasActiveFilters = Boolean(operationFilter !== 'todos' || typeFilter !== 'todos' || cityFilter !== 'todos' || minPriceFilter || maxPriceFilter || roomsFilter !== 'todos' || keywordFilter !== '');

  return (
    <div className="bg-slate-50/50 min-h-screen pt-8 pb-24 font-sans">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-serif font-medium text-slate-900 tracking-tight">Catálogo de Inmuebles</h1>
          <p className="text-slate-500 text-sm mt-1.5">Descubre viviendas y locales en venta y alquiler en Valladolid y provincia.</p>
        </div>

        {/* Filter Panel Box */}
        <PublicFilterPanel
          keywordFilter={keywordFilter}
          operationFilter={operationFilter}
          typeFilter={typeFilter}
          cityFilter={cityFilter}
          minPriceFilter={minPriceFilter}
          maxPriceFilter={maxPriceFilter}
          roomsFilter={roomsFilter}
          availableCities={availableCities}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredProperties.length}
          totalCount={properties.length}
          updateParam={updateParam}
          clearAllFilters={clearAllFilters}
        />

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
              <button onClick={clearAllFilters} className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition-colors">
                Restablecer Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map(property => (
              <PublicPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
