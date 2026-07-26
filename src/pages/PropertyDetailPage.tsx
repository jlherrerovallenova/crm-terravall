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

  const numberToSpanishWords = (num: number): string => {
    const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (num === 0) return 'cero euros';
    if (num === 100) return 'cien mil euros';

    function convertGroup(n: number): string {
      let str = '';
      if (n >= 100) {
        if (n === 100) str += 'cien ';
        else str += hundreds[Math.floor(n / 100)] + ' ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)];
        if (n % 10 > 0) str += ' y ' + units[n % 10];
        str += ' ';
      } else if (n >= 10) {
        str += teens[n - 10] + ' ';
      } else if (n > 0) {
        str += units[n] + ' ';
      }
      return str.trim();
    }

    let result = '';
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;

    if (thousands > 0) {
      if (thousands === 1) result += 'ciento ';
      else result += convertGroup(thousands) + ' mil ';
    }
    if (remainder > 0) {
      result += convertGroup(remainder);
    }

    return (result.trim() + ' euros').toUpperCase();
  };

  const handlePrintEncargo = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedPriceNumber = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price);
    const priceInWords = numberToSpanishWords(property.price);

    let honorariosTexto = '';
    if (property.commission_value) {
      if (property.commission_type === 'porcentaje') {
        honorariosTexto = `${property.commission_value}% del precio de venta final`;
      } else {
        honorariosTexto = `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.commission_value)}`;
      }
    } else {
      honorariosTexto = '3.000 €';
    }

    const today = new Date();
    const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fechaTexto = `${today.getDate()} de ${monthsSpanish[today.getMonth()]} de ${today.getFullYear()}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Compromiso de Gestión de Venta con Exclusiva - TERRAVALL</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px 50px; color: #0f172a; line-height: 1.55; font-size: 13px; }
          .no-print { text-align: right; margin-bottom: 20px; }
          .btn-print { background: #8f1505; color: white; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
          .title { text-align: center; font-size: 16.5px; font-weight: 800; color: #8f1505; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.5px; border-bottom: 2px solid #8f1505; padding-bottom: 8px; }
          p { margin-bottom: 12px; text-align: justify; }
          .bold { font-weight: bold; }
          .stipulations { margin-top: 10px; }
          .property-details { background: #f8fafc; border-left: 3px solid #8f1505; padding: 10px 16px; margin: 10px 0; font-size: 12.5px; }
          .property-details div { margin-bottom: 3px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 130px; text-align: center; page-break-inside: avoid; }
          .signature-box { border-top: 1px solid #64748b; padding-top: 8px; font-weight: bold; font-size: 12px; color: #334155; }
          .gdpr-clause { font-size: 9.5px; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 10px; text-align: justify; line-height: 1.35; margin-top: 35px; page-break-inside: avoid; }
          @media print {
            body { margin: 25px 35px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" class="btn-print">Imprimir / Exportar PDF</button>
        </div>

        <div class="title">COMPROMISO DE GESTIÓN DE VENTA CON EXCLUSIVA</div>

        <p>
          <span class="bold">LA PARTE VENDEDORA:</span> ${property.owner_name || '____________________________________________'} con DNI <span class="bold">${property.owner_dni || '____________'}</span> y domicilio en <span class="bold">${property.owner_address || '________________________'}</span> en el municipio de <span class="bold">${property.owner_city || property.city || '____________'}</span> en la provincia de <span class="bold">${property.owner_province || property.province || '____________'}</span> C.P. <span class="bold">${property.owner_zipcode || property.zipcode || '____________'}</span>, que interviene como propietario/s.
        </p>

        <p>
          Y de otra, <span class="bold">Mª del Mar Rivas Brun</span>, en adelante TERRAVALL, con NIF nº 29.156.726-V y domicilio en Plaza Mayor 8, 1ºA de Valladolid, como Intermediario Inmobiliario, recibe ENCARGO DE GESTIÓN DE VENTA CON EXCLUSIVA, conforme a las siguientes:
        </p>

        <div class="stipulations">
          <div class="title" style="font-size: 14px; margin: 15px 0 10px 0; border: none; padding: 0; text-align: center;">ESTIPULACIONES</div>

          <p>
            <span class="bold">PRIMERO.- OBJETO.-</span> En virtud de este encargo, la propiedad autoriza a Mª del Mar Rivas Brun, en adelante TERRAVALL a realizar la intermediación inmobiliaria y gestión de venta de la finca detallada a continuación:
          </p>

          <div class="property-details">
            <div>· <span class="bold">DIRECCIÓN:</span> VIVIENDA sita en <span class="bold">${property.address_hidden}</span> en el municipio de <span class="bold">${property.city}</span> en la provincia de <span class="bold">${property.province}</span>.</div>
            <div>· <span class="bold">C.P.:</span> ${property.zipcode}</div>
            <div>· <span class="bold">CALIFICACIÓN ENERGÉTICA:</span> ${property.energy_certificate ? property.energy_certificate.replace('_', ' ').toUpperCase() : 'EN TRÁMITE'}</div>
          </div>

          <p>
            <span class="bold">SEGUNDA.- DURACIÓN:</span> La duración del presente encargo de venta con exclusiva es de <span class="bold">${property.exclusivity_months ? property.exclusivity_months + ' meses' : 'seis meses'}</span> a partir de la fecha del presente documento, que se entenderá tácitamente prorrogado por periodos mensuales si ninguna de las partes comunica su decisión de dar por terminado el contrato de forma expresa y por escrito a la otra al menos con quince días de antelación al vencimiento final del plazo inicial o de cualquiera de sus prórrogas.
          </p>

          <p>
            <span class="bold">TERCERA.-</span> Las condiciones generales del presente encargo son:
          </p>
          
          <p style="margin-left: 15px;">
            · <span class="bold">PRECIO OBJETIVO DEL INMUEBLE:</span> ${priceInWords} (${formattedPriceNumber}), honorarios incluidos.
          </p>
          <p style="margin-left: 15px;">
            · <span class="bold">HONORARIOS:</span> Los honorarios ascenderán a <span class="bold">${honorariosTexto} + 21% de IVA</span>.
          </p>
          <p style="margin-left: 15px;">
            · El propietario no podrá vender por sí mismo y de forma directa o con la intervención de otra agencia inmobiliaria, el inmueble citado a compradores que no hayan sido presentados por TERRAVALL, salvo acuerdo expreso entre las partes. Del mismo modo, el propietario se compromete a presentar a TERRAVALL, aquellas personas que durante la vigencia del encargo se hayan interesado directamente ante él aún sin intervención directa previa de la inmobiliaria, para la compra del inmueble objeto del contrato, a fin de que se realice la tramitación de venta, en cuyo caso abonará en concepto de honorarios, el 50% de los pactados en este documento.
          </p>
          <p style="margin-left: 15px;">
            · TERRAVALL queda autorizada a recibir señales/depósitos o pagos a cuenta, que quedarán a disposición de la parte vendedora, respetando las condiciones pactadas y previa autorización por escrito de la propiedad (vía e-mail) y a realizar a su cargo todo tipo de gestiones, publicidad o cualquier otro tipo de tareas encaminadas a la consecución del buen fin de la operación.
          </p>

          <p>
            <span class="bold">CUARTA.- GASTOS Y TRIBUTOS:</span> El inmueble se transmitirá libre de cargas y gravámenes, al corriente del pago de gastos de comunidad y libre de arrendatarios y ocupantes. Todos los gastos que se deriven de la compraventa serán a cuenta del comprador excepto gastos de plusvalía y honorarios de TERRAVALL.
          </p>

          <p>
            <span class="bold">QUINTA.- JURISDICCIÓN:</span> Para cualquier cuestión o litigio que pudiera surgir en la interpretación o por incumplimiento del presente documento, las partes contratantes se someten a los juzgados y tribunales de Valladolid.
          </p>

          <p style="margin-top: 20px;">
            Leído y conformes con todo cuanto antecede, las partes libremente firman el presente documento, por duplicado ejemplar y a un solo efecto, en el lugar y fecha indicados.
          </p>

          <p style="margin-top: 15px;" class="bold">
            En Valladolid, a ${fechaTexto}.
          </p>
        </div>

        <div class="signatures">
          <div class="signature-box">
            LA PARTE VENDEDORA
          </div>
          <div class="signature-box">
            Mª DEL MAR RIVAS BRUN (TERRAVALL)
          </div>
        </div>

        <div class="gdpr-clause">
          Mª DEL MAR RIVAS BRUN es la responsable del tratamiento de los datos personales proporcionados bajo su consentimiento y le informa de que estos datos serán tratados de conformidad con lo dispuesto en el Reglamento (UE) 2016/679 (GDPR) y la Ley Orgánica 3/2018 (LOPDGDD). No se comunicarán los datos a terceros, salvo obligación legal. Puede ejercer los derechos de acceso, rectificación, portabilidad y supresión dirigiéndose a Plaza Mayor, 8 1 A 47001 Valladolid o al e-mail: mar.terravall@hotmail.com
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
