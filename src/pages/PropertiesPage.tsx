import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, Home, MapPin, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_media(url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error al cargar inmuebles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("¿Seguro que deseas eliminar este inmueble?")) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (!error) {
        setProperties(properties.filter(p => p.id !== id));
      } else {
        alert("Error al eliminar el inmueble");
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const formatType = (type: string) => {
    const types: Record<string, string> = { piso: 'Piso', chalet: 'Chalet', local: 'Local', oficina: 'Oficina', terreno: 'Terreno', nave: 'Nave Industrial' };
    return types[type] || type;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Cargando inmuebles...</div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Listado de Inmuebles</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona tu cartera de propiedades.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/crm/inmuebles/nuevo">
            <Button className="gap-2 bg-primary hover:bg-primary/95 text-white">
              <Plus size={18} />
              Añadir Inmueble
            </Button>
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Home size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inmuebles todavía</h3>
          <p className="text-gray-500 max-w-sm mb-6">Empieza a nutrir tu cartera creando tu primera propiedad para publicar en Idealista y en tu web.</p>
          <Link to="/crm/inmuebles/nuevo">
            <Button variant="outline">Añadir Inmueble</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Inmueble</th>
                  <th className="px-6 py-4 font-medium">Ubicación</th>
                  <th className="px-6 py-4 font-medium">Operación / Precio</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Publicación</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 shrink-0">
                          {property.property_media?.[0]?.url ? (
                            <img src={property.property_media[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Home size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate max-w-[250px]" title={property.title}>
                            {property.title}
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-1.5">
                            {property.internal_reference && <span className="font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded text-[10px] uppercase border border-primary/10">{property.internal_reference}</span>}
                            <span>{formatType(property.type)} • {property.area_built} m²</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-600 gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate max-w-[200px]">{property.address_public}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{formatPrice(property.price)}</span>
                          <div className="flex items-center text-xs text-primary font-medium mt-0.5 gap-1 capitalize">
                            <Tag size={12} />
                            {property.operation}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        property.condition === 'buen_estado' ? 'bg-green-50 text-green-700 border-green-200' : 
                        property.condition === 'obra_nueva' ? 'bg-primary/10 text-primary border-primary/20' : 
                        'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {property.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {property.publish_web && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Web</span>}
                        {property.publish_idealista && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-[#e6f54c]/30 text-lime-800 border border-[#e6f54c]">Idealista</span>}
                        {property.publish_fotocasa && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">Fotocasa</span>}
                        {(!property.publish_web && !property.publish_idealista && !property.publish_fotocasa) && <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">No publicado</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Link to={`/crm/inmuebles/${property.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">Ver</Button>
                        </Link>
                        <button onClick={(e) => handleDelete(property.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50" title="Borrar Inmueble">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
