import React from 'react';
import { Search, MapPin, Tag, BedDouble, Home, RotateCcw } from 'lucide-react';

interface PublicFilterPanelProps {
  keywordFilter: string;
  operationFilter: string;
  typeFilter: string;
  cityFilter: string;
  minPriceFilter: string;
  maxPriceFilter: string;
  roomsFilter: string;
  availableCities: string[];
  hasActiveFilters: boolean;
  filteredCount: number;
  totalCount: number;
  updateParam: (key: string, value: string) => void;
  clearAllFilters: () => void;
}

export const PublicFilterPanel: React.FC<PublicFilterPanelProps> = ({
  keywordFilter,
  operationFilter,
  typeFilter,
  cityFilter,
  minPriceFilter,
  maxPriceFilter,
  roomsFilter,
  availableCities,
  hasActiveFilters,
  filteredCount,
  totalCount,
  updateParam,
  clearAllFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-10 space-y-5">
      {/* Top Bar Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-1">
          <label htmlFor="public-filter-search" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Search size={12} className="text-primary" />
            Buscar por palabra o ref.
          </label>
          <div className="relative">
            <input 
              id="public-filter-search"
              type="text" 
              aria-label="Buscar por palabra o referencia"
              placeholder="Ej. Ático, Centro, TRV-0001..." 
              value={keywordFilter}
              onChange={(e) => updateParam('q', e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Operación */}
        <div className="space-y-1">
          <label htmlFor="public-filter-operation" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Tag size={12} className="text-primary" />
            Operación
          </label>
          <select
            id="public-filter-operation"
            aria-label="Operación"
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
          <label htmlFor="public-filter-type" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Home size={12} className="text-primary" />
            Tipo de Propiedad
          </label>
          <select
            id="public-filter-type"
            aria-label="Tipo de Propiedad"
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
          <label htmlFor="public-filter-city" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            Municipio
          </label>
          <select
            id="public-filter-city"
            aria-label="Municipio"
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
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Rango de Precio (€)</span>
          <div className="flex items-center gap-2">
            <input 
              id="public-filter-min-price"
              type="number" 
              aria-label="Precio Mínimo en euros"
              placeholder="Precio Mínimo (€)" 
              value={minPriceFilter}
              onChange={(e) => updateParam('minPrice', e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-medium text-slate-800 outline-none focus:border-primary"
            />
            <span className="text-slate-400 font-semibold text-xs">-</span>
            <input 
              id="public-filter-max-price"
              type="number" 
              aria-label="Precio Máximo en euros"
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
            <label htmlFor="public-filter-rooms" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <BedDouble size={12} className="text-primary" />
              Habitaciones
            </label>
            <select
              id="public-filter-rooms"
              aria-label="Habitaciones mínimas"
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
        <span>Mostrando <strong className="text-slate-900">{filteredCount}</strong> propiedades de {totalCount} en total</span>
      </div>
    </div>
  );
};
