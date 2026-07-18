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
          <h1 className="text-2xl font-bold text-gray-900">Listado de Inmuebles</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tu cartera de propiedades.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={async () => {
            const properties = [
              { type: 'piso', operation: 'venta', subtype: 'atico', price: 320000, address_hidden: 'Calle de Santiago 15, 5ºB', address_public: 'Centro', city: 'Valladolid', province: 'Valladolid', zipcode: '47001', hide_exact_address: false, area_built: 120, area_useful: 105, condition: 'buen_estado', title: 'Espectacular Ático en pleno Centro de Valladolid', description: 'Extraordinario ático situado en la prestigiosa Calle Santiago. Cuenta con una gran terraza orientada al sur. Dispone de 3 amplios dormitorios, 2 baños completos y un enorme salón. Plaza de garaje incluida. ¡No deje pasar la oportunidad de vivir en pleno centro de la ciudad!', specific_features: {floor: 5, has_elevator: true, rooms: 3, bathrooms: 2, has_parking: true} },
              { type: 'piso', operation: 'venta', price: 185000, address_hidden: 'Paseo de Zorrilla 88, 3ºA', address_public: 'Paseo de Zorrilla', city: 'Valladolid', province: 'Valladolid', zipcode: '47006', hide_exact_address: false, area_built: 95, area_useful: 82, condition: 'a_reformar', title: 'Piso amplio y luminoso en Paseo de Zorrilla', description: 'Excelente piso situado en una de las mejores zonas del Paseo de Zorrilla, frente a El Corte Inglés. Excelente altura y luz natural todo el día. Dispone de 4 dormitorios y necesita actualización, ideal para hacerlo a tu gusto. Finca con ascensor.', specific_features: {floor: 3, has_elevator: true, rooms: 4, bathrooms: 1, has_parking: false} },
              { type: 'chalet', operation: 'venta', subtype: 'adosado', price: 450000, address_hidden: 'Calle Hernando de Acuña 42', address_public: 'Parquesol', city: 'Valladolid', province: 'Valladolid', zipcode: '47014', hide_exact_address: true, area_built: 280, area_useful: 245, condition: 'buen_estado', title: 'Exclusivo Chalet Adosado en Parquesol', description: 'Estupendo chalet adosado en Parquesol. 4 plantas, amplio salón con acceso al jardín, 4 dormitorios en la primera planta y buhardilla acondicionada. Bodega equipada con chimenea. Urbanización con zonas comunes, piscina y pistas deportivas. Calidades inmejorables.', specific_features: {plot_area: 150, floors_count: 4, rooms: 5, bathrooms: 4, has_pool: true} },
              { type: 'piso', operation: 'alquiler', price: 950, address_hidden: 'Calle Duque de la Victoria 5, 2ºC', address_public: 'Centro - Plaza Mayor', city: 'Valladolid', province: 'Valladolid', zipcode: '47001', hide_exact_address: true, area_built: 85, area_useful: 75, condition: 'obra_nueva', title: 'Precioso piso de diseño a estrenar junto a la Plaza Mayor', description: 'Vivienda recién reformada de forma integral. Diseño moderno y calidades de lujo. Suelo radiante, cocina integrada, 2 habitaciones y 1 baño. Un espacio único en el centro histórico de la ciudad. Ideal para parejas o profesionales.', specific_features: {floor: 2, has_elevator: true, rooms: 2, bathrooms: 1, has_parking: false} },
              { type: 'chalet', operation: 'venta', subtype: 'independiente', price: 590000, address_hidden: 'Camino de la Flecha 18', address_public: 'Covaresa', city: 'Valladolid', province: 'Valladolid', zipcode: '47008', hide_exact_address: false, area_built: 350, area_useful: 310, condition: 'buen_estado', title: 'Impresionante Chalet Independiente en Covaresa', description: 'Exclusiva propiedad en Covaresa. Chalet independiente sobre parcela de 800m2 con jardín privado y piscina. Salón a doble altura, 5 dormitorios y 4 baños completos. Garaje para 3 vehículos. Total privacidad en un entorno privilegiado de la ciudad.', specific_features: {plot_area: 800, floors_count: 2, rooms: 5, bathrooms: 4, has_pool: true} },
              { type: 'piso', operation: 'venta', price: 215000, address_hidden: 'Calle Mieses 12, 1ºA', address_public: 'Villa del Prado', city: 'Valladolid', province: 'Valladolid', zipcode: '47014', hide_exact_address: false, area_built: 110, area_useful: 90, condition: 'buen_estado', title: 'Magnífico piso familiar en Villa del Prado', description: 'Vivienda lista para entrar a vivir en una de las zonas de mayor expansión. Luminoso salón, 3 dormitorios, 2 baños. Urbanización cerrada con piscina y pádel. Incluye garaje y trastero. Ubicación excepcional junto a espacios verdes.', specific_features: {floor: 1, has_elevator: true, rooms: 3, bathrooms: 2, has_parking: true, has_pool: true} },
              { type: 'piso', operation: 'venta', price: 155000, address_hidden: 'Calle Cigüeña 22, 4ºD', address_public: 'Pajarillos', city: 'Valladolid', province: 'Valladolid', zipcode: '47012', hide_exact_address: false, area_built: 85, area_useful: 75, condition: 'buen_estado', title: 'Acogedor piso exterior en zona consolidada', description: 'Excelente distribución con 3 dormitorios, baño reformado, amplia cocina y terraza cerrada. Finca dotada de ascensor. Zona inmejorable con todos los servicios, comercios, colegios y parques. Muy buena oportunidad de inversión o primera vivienda.', specific_features: {floor: 4, has_elevator: true, rooms: 3, bathrooms: 1, has_parking: false} },
              { type: 'piso', operation: 'venta', subtype: 'duplex', price: 280000, address_hidden: 'Calle Monasterio de Yuste 8', address_public: 'Huerta del Rey', city: 'Valladolid', province: 'Valladolid', zipcode: '47014', hide_exact_address: true, area_built: 140, area_useful: 125, condition: 'buen_estado', title: 'Espectacular Dúplex en Huerta del Rey', description: 'Dúplex de amplias dimensiones con vistas despejadas. 4 dormitorios y 3 baños. Construcción moderna, buenas calidades. Dispone de dos plazas de aparcamiento y un generoso trastero. Perfecto para familias que buscan espacio y comodidad a un paso del centro.', specific_features: {floor: 6, has_elevator: true, rooms: 4, bathrooms: 3, has_parking: true} },
              { type: 'chalet', operation: 'alquiler', subtype: 'adosado', price: 1200, address_hidden: 'Calle del Pinar 14', address_public: 'Pinar de Jalón', city: 'Valladolid', province: 'Valladolid', zipcode: '47013', hide_exact_address: true, area_built: 200, area_useful: 175, condition: 'buen_estado', title: 'Chalet Adosado de reciente construcción en Pinar de Jalón', description: 'Se alquila adosado sin amueblar. 4 dormitorios, buhardilla acondicionada y bonito jardín trasero de uso privativo. Sótano con garaje para dos coches. Urbanización muy tranquila que dispone de piscina. Muy buenas conexiones por ronda exterior.', specific_features: {plot_area: 120, floors_count: 3, rooms: 4, bathrooms: 3, has_pool: true} },
              { type: 'piso', operation: 'venta', price: 350000, address_hidden: 'Acera de Recoletos 10, 2º Izda', address_public: 'Acera de Recoletos', city: 'Valladolid', province: 'Valladolid', zipcode: '47004', hide_exact_address: false, area_built: 160, area_useful: 140, condition: 'a_reformar', title: 'Gran piso señorial con vistas al Campo Grande', description: 'Vivienda exclusiva situada en la mejor calle de Valladolid. Balcones orientados directamente a Campo Grande. Suelos de madera original y altos techos con molduras. Más de 150m2 para poder actualizar y convertir en una residencia espectacular.', specific_features: {floor: 2, has_elevator: true, rooms: 5, bathrooms: 2, has_parking: false} }
            ];
            
            setLoading(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                alert("Debes iniciar sesión para insertar datos");
                return;
              }
              const { error } = await supabase.from('properties').insert(
                properties.map(p => ({ ...p, user_id: session.user.id }))
              );
              if (error) alert("Error: " + error.message);
              else fetchProperties();
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          }} className="bg-emerald-600 hover:bg-emerald-700">
            Generar 10 pisos de prueba
          </Button>
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
