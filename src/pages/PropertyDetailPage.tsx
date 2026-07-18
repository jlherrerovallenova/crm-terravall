import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MapPin, Home, Tag, Info, Trash2 } from 'lucide-react';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);

      const { data: mediaData } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', id)
        .order('sort_order', { ascending: true });
      if (mediaData) setMedia(mediaData);
    } catch (error) {
      console.error('Error al cargar inmueble:', error);
      alert('Error al cargar el inmueble');
      navigate('/crm/inmuebles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Cargando inmueble...</div>;
  }

  if (!property) return null;

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este inmueble? Esta acción no se puede deshacer.")) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) {
        alert("Error al eliminar el inmueble");
        console.error(error);
      } else {
        navigate('/crm/inmuebles');
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/crm/inmuebles')} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} />
          Volver al listado
        </button>
        <div className="flex gap-2">
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2" onClick={handleDelete}>
            <Trash2 size={16} />
            Borrar Inmueble
          </Button>
          <Link to={`/crm/inmuebles/${id}/editar`}>
            <Button className="bg-primary hover:bg-primary/95 gap-2 text-white">
              <Edit size={16} />
              Editar Inmueble
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {media.length > 0 && (
          <div className="flex overflow-x-auto p-4 gap-4 bg-gray-900 snap-x">
            {media.map((item) => (
              <img key={item.id} src={item.url} alt="Inmueble" className="h-64 object-cover rounded-lg shrink-0 snap-center" />
            ))}
          </div>
        )}
        <div className="bg-gray-50/50 p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full capitalize">
                {property.operation === 'venta' ? 'Venta' : property.operation === 'alquiler' ? 'Alquiler' : 'Traspaso'}
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">
                {(() => {
                  const typeTranslations: Record<string, string> = { piso: 'Piso', chalet: 'Chalet', local: 'Local', oficina: 'Oficina', terreno: 'Terreno', nave: 'Nave Industrial' };
                  const subtypeTranslations: Record<string, string> = {
                    atico: 'Ático',
                    duplex: 'Dúplex',
                    estudio: 'Estudio',
                    adosado: 'Adosado',
                    independiente: 'Independiente',
                    nave_industrial: 'Industrial',
                    nave_comercial: 'Comercial'
                  };
                  const tType = typeTranslations[property.type] || property.type;
                  const tSub = property.subtype ? ` (${subtypeTranslations[property.subtype] || property.subtype})` : '';
                  return `${tType}${tSub}`;
                })()}
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                  property.condition === 'buen_estado' ? 'bg-green-50 text-green-700 border-green-200' : 
                  property.condition === 'obra_nueva' ? 'bg-primary/10 text-primary border-primary/20' : 
                  'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                {property.condition === 'buen_estado' ? 'Buen estado' : property.condition === 'obra_nueva' ? 'Obra nueva' : 'A reformar'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{property.title}</h1>
            <div className="flex items-center text-gray-500 gap-2 mt-3 text-sm">
              <MapPin size={16} />
              <span>{property.address_public}, {property.city} ({property.province})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary">{formatPrice(property.price)}</div>
            <div className="text-gray-500 text-sm mt-1">{property.area_built} m² construidos</div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={20} className="text-primary" />
                Descripción
              </h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-6 border border-gray-100">
                {property.description}
              </div>
            </section>

            <section>
               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home size={20} className="text-primary" />
                Características Específicas
              </h2>
              <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {(() => {
                    const featureLabels: Record<string, string> = {
                      floor: "Planta",
                      has_elevator: "Ascensor",
                      community_fees: "Gastos de comunidad",
                      has_terrace: "Terraza",
                      has_balcony: "Balcón",
                      orientation: "Orientación",
                      rooms: "Habitaciones",
                      bathrooms: "Aseos/Baños",
                      interior_exterior: "Interior/Exterior",
                      built_in_wardrobes: "Armarios empotrados",
                      air_conditioning: "Aire acondicionado",
                      has_storage_room: "Trastero",
                      has_pool: "Piscina",
                      has_garden: "Jardín",
                      has_parking: "Plaza de garaje",
                      parking_included: "Garaje incluido",
                      parking_price: "Precio del garaje",
                      accessible_exterior: "Acceso exterior adaptado",
                      wheelchair_accessible: "Adaptado para silla de ruedas",
                      heating_type: "Tipo de calefacción",
                      heating_fuel: "Combustible",
                      construction_year: "Año de construcción",
                      plot_area: "Metros de parcela/patio",
                      floors_count: "Nº de plantas",
                      garden_type: "Tipo de jardín",
                      facade_meters: "Metros de fachada",
                      smoke_extractor: "Salida de humos",
                      last_activity: "Última actividad",
                      layout: "Distribución",
                      shop_windows: "Nº de escaparates",
                      zoning: "Zonificación/Suelo",
                      buildable_area: "Edificabilidad máxima",
                      has_electricity: "Electricidad",
                      has_water: "Agua corriente",
                      has_gas: "Gas natural",
                      has_sewerage: "Alcantarillado",
                      activity: "Uso/Actividad",
                      height_free: "Altura libre",
                      loading_docks: "Muelles de carga",
                      cranes_count: "Puentes grúa",
                      has_heating: "Calefacción",
                      has_air_conditioning: "Aire acondicionado",
                      has_security_system: "Sistema de alarma",
                      has_fire_system: "Protección contra incendios (BIES)",
                      has_offices: "Oficinas integradas"
                    };

                    const translateValue = (key: string, val: any) => {
                      if (typeof val === 'boolean') return val ? 'Sí' : 'No';
                      if (Array.isArray(val)) return val.map(v => translateValue(key, v)).join(', ');
                      
                      const valTranslations: Record<string, string> = {
                        venta: 'Venta',
                        alquiler: 'Alquiler',
                        traspaso: 'Traspaso',
                        buen_estado: 'Buen estado',
                        a_reformar: 'A reformar',
                        obra_nueva: 'Obra nueva',
                        diáfano: 'Diáfano',
                        compartimentado: 'Compartimentado',
                        residencial: 'Residencial',
                        comercial: 'Comercial',
                        industrial: 'Industrial',
                        agrario: 'Agrario / Rústico',
                        almacen: 'Almacén / Archivo',
                        oficinas: 'Oficinas',
                        otros: 'Otros',
                        exact: 'Exacta',
                        street_only: 'Solo calle',
                        hidden: 'Oculta'
                      };
                      return valTranslations[String(val)] || String(val);
                    };

                    return Object.entries(property.specific_features).map(([key, value]) => {
                      if (value === undefined || value === null || value === '') return null;
                      return (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                          <span className="text-gray-500 font-medium">{featureLabels[key] || key.replace(/_/g, ' ')}</span>
                          <span className="font-semibold text-gray-900">
                            {translateValue(key, value)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                  {(!property.specific_features || Object.keys(property.specific_features).length === 0) && (
                    <div className="col-span-2 text-gray-400 text-sm italic">No hay características específicas detalladas.</div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Detalles Técnicos</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-500">Referencia</span>
                  <span className="font-bold text-primary uppercase">{property.internal_reference || '-'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">M² Útiles</span>
                  <span className="font-medium">{property.area_useful} m²</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">M² Construidos</span>
                  <span className="font-medium">{property.area_built} m²</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Certificado Energ.</span>
                  <span className="font-medium uppercase">{property.energy_certificate.replace('_', ' ')}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Dirección Privada</span>
                  <span className="font-medium text-right max-w-[150px] truncate" title={property.address_hidden}>
                    {property.address_hidden}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-500">Código Postal</span>
                  <span className="font-medium">{property.zipcode}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
