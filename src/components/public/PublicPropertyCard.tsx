import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { PublicPropertyItem } from '@/pages/PublicPropertiesPage';

const currencyFormatter0 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

interface PublicPropertyCardProps {
  property: PublicPropertyItem;
}

export const PublicPropertyCard: React.FC<PublicPropertyCardProps> = ({ property }) => {
  const mainImg = property.property_media?.[0]?.url || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
  const feats = property.specific_features || {};

  return (
    <Link 
      to={`/web/propiedades/${property.id}`} 
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-colors duration-300 flex flex-col justify-between"
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
              {currencyFormatter0.format(property.price)}
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
};
