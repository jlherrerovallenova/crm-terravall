import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, TrendingUp, ArrowUpRight } from 'lucide-react';
import { formatPrice, formatType } from '@/lib/utils';
import type { PropertyRow } from '@/types/database.types';

export interface RecentPropertyItem {
  id: string;
  title: string;
  type: PropertyRow['type'];
  operation: PropertyRow['operation'];
  price: number;
  address_public: string | null;
  area_built: number;
  condition: PropertyRow['condition'];
  created_at: string;
  internal_reference: string | null;
  property_media?: { url: string }[] | null;
}

export const DashboardRecentList: React.FC<{ recentProperties: RecentPropertyItem[] }> = ({ recentProperties }) => {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-slate-400" />
          Últimas Propiedades Registradas
        </h3>
        <Link to="/crm/inmuebles" className="text-xs font-semibold text-primary hover:text-primary/90 flex items-center gap-0.5 cursor-pointer">
          Ver todo el catálogo
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {recentProperties.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <Home size={32} className="text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">No hay inmuebles registrados</p>
          <p className="text-xs text-slate-400 mt-1">Comienza añadiendo una nueva propiedad a tu cartera.</p>
          <Link to="/crm/inmuebles/nuevo" className="mt-4">
            <button className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer">
              Añadir Inmueble
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-slate-100">
          {recentProperties.map((property) => (
            <div key={property.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/40 rounded-lg px-2 -mx-2 transition-colors">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                  {property.property_media?.[0]?.url ? (
                    <img src={property.property_media[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate" title={property.title}>
                    {property.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                    {property.internal_reference && <span className="font-semibold text-primary bg-primary/5 px-1 py-0.5 rounded text-[10px] uppercase border border-primary/10 mr-1">{property.internal_reference}</span>}
                    <span className="font-medium text-slate-700">{formatType(property.type)}</span>
                    <span>•</span>
                    <span>{property.area_built} m²</span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">{property.address_public}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-955">{formatPrice(property.price)}</div>
                  <div className="text-[10px] font-bold text-primary capitalize mt-0.5 inline-flex items-center px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">
                    {property.operation}
                  </div>
                </div>
                <Link 
                  to={`/crm/inmuebles/${property.id}`} 
                  aria-label={`Ver detalle de ${property.title}`}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
