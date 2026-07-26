import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MapPin, Home, Tag, Info, Trash2, FileSignature, Printer, User, Percent, Clock } from 'lucide-react';

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

  const handlePrintEncargo = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Documento de Encargo de Venta - Terravall</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-b: 2px solid #8f1505; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #8f1505; font-size: 24px; margin: 0 0 5px 0; text-transform: uppercase; }
          .header p { margin: 0; font-size: 14px; color: #64748b; }
          .section { margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
          .section-title { font-weight: bold; font-size: 16px; color: #8f1505; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; }
          .full { grid-column: span 2; }
          .label { font-weight: bold; color: #475569; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; text-align: center; }
          .signature-box { border-top: 1px solid #94a3b8; padding-top: 10px; font-size: 13px; font-weight: bold; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #8f1505; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Imprimir Documento</button>
        </div>

        <div class="header">
          <h1>TERRAVALL SERVICIOS INMOBILIARIOS</h1>
          <p>DOCUMENTO DE ENCARGO DE VENTA EN EXCLUSIVA</p>
        </div>

        <div class="section">
          <div class="section-title">1. DATOS DEL PROPIETARIO / MANDANTE</div>
          <div class="grid">
            <div class="full"><span class="label">Propietario/s:</span> ${property.owner_name || '---------------------------------------------'}</div>
            <div><span class="label">DNI/NIF:</span> ${property.owner_dni || '------------'}</div>
            <div><span class="label">Teléfono:</span> ${property.owner_phone || '------------'}</div>
            <div class="full"><span class="label">Domicilio habitual:</span> ${property.owner_address || '---------------------------------------------'}</div>
            <div><span class="label">Municipio / Provincia:</span> ${property.owner_city || '------------'}, ${property.owner_province || '------------'}</div>
            <div><span class="label">Código Postal:</span> ${property.owner_zipcode || '------------'}</div>
            <div class="full"><span class="label">Email:</span> ${property.owner_email || '------------'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. DATOS DEL INMUEBLE OBJETO DE VENTA</div>
          <div class="grid">
            <div><span class="label">Referencia Interna:</span> ${property.internal_reference || 'TRV-0000'}</div>
            <div><span class="label">Tipo de Inmueble:</span> ${property.type.toUpperCase()}</div>
            <div class="full"><span class="label">Dirección del inmueble:</span> ${property.address_hidden}, ${property.city} (${property.zipcode})</div>
            <div><span class="label">Superficie construida:</span> ${property.area_built} m²</div>
            <div><span class="label">Superficie útil:</span> ${property.area_useful} m²</div>
            <div class="full"><span class="label">Precio de Venta fijado:</span> ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(property.price)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. CONDICIONES DEL ENCARGO</div>
          <div class="grid">
            <div><span class="label">Comisión convenida:</span> ${
              property.commission_value 
                ? (property.commission_type === 'porcentaje' ? `${property.commission_value}% del precio de venta final` : `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(property.commission_value)} (Fija)`) 
                : 'A convenir'
            }</div>
            <div><span class="label">Duración exclusiva:</span> ${property.exclusivity_months ? `${property.exclusivity_months} meses` : '6 meses (estándar)'}</div>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
            El propietario encarga a TERRAVALL SERVICIOS INMOBILIARIOS la gestión de venta de la finca descrita en las condiciones estipuladas, autorizando la difusión publicitaria en medios web y portales inmobiliarios.
          </p>
        </div>

        <div class="signatures">
          <div class="signature-box">
            Firma del/los Propietario/s
          </div>
          <div class="signature-box">
            Por TERRAVALL INMOBILIARIA
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
          <Button variant="outline" className="text-slate-700 hover:bg-slate-50 border-slate-200 gap-2" onClick={handlePrintEncargo}>
            <Printer size={16} className="text-primary" />
            Imprimir Encargo de Venta
          </Button>
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
