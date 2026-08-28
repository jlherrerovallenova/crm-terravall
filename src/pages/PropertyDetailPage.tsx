import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, MapPin, Home, Info, Trash2, Printer, FileText, ChevronLeft, ChevronRight, X, Maximize2, Download } from 'lucide-react';
import { MortgageCalculator } from '@/components/MortgageCalculator';
import { ArrasContractModal } from '@/components/ArrasContractModal';
import { RentalContractModal } from '@/components/RentalContractModal';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import { numberToSpanishWords } from '@/lib/utils';
import { exportEncargoToDocx } from '@/utils/encargoDocx';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArrasModalOpen, setIsArrasModalOpen] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && media.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % media.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && media.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + media.length) % media.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, media]);

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

  // numberToSpanishWords importada desde @/lib/utils (versión correcta)

  const handlePrintEncargo = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedPriceNumber = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price);
    const priceInWords = numberToSpanishWords(property.price);

    let honorariosTexto = '';
    let calculoTotalIvaHtml = '';

    if (property.commission_value) {
      if (property.commission_type === 'porcentaje') {
        honorariosTexto = `${property.commission_value}% del precio de venta final`;
        if (property.price && property.price > 0) {
          const totalConIva = property.price * (property.commission_value / 100) * 1.21;
          const formattedTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalConIva);
          calculoTotalIvaHtml = ` (total <span class="bold">${formattedTotal}</span> IVA incluido)`;
        }
      } else {
        honorariosTexto = `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.commission_value)}`;
        const totalConIva = property.commission_value * 1.21;
        const formattedTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalConIva);
        calculoTotalIvaHtml = ` (total <span class="bold">${formattedTotal}</span> IVA incluido)`;
      }
    } else {
      honorariosTexto = '3.000 €';
      const totalConIva = 3000 * 1.21;
      const formattedTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalConIva);
      calculoTotalIvaHtml = ` (total <span class="bold">${formattedTotal}</span> IVA incluido)`;
    }

    const today = new Date();
    const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fechaTexto = `${today.getDate()} de ${monthsSpanish[today.getMonth()]} de ${today.getFullYear()}`;

    const parseOwnersList = (prop: any) => {
      if (!prop) return [];

      const rawName = prop.owner_name || '';
      const rawDni = prop.owner_dni || '';

      // Construir dirección: priorizar campos desglosados, fallback a owner_address legacy
      const buildAddress = (streetField: string, numberField: string, floorField: string, addressLegacy: string) => {
        const parts = [streetField, numberField, floorField].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : (addressLegacy || '');
      };

      const rawAddress = buildAddress(
        prop.owner_street || '',
        prop.owner_number || '',
        prop.owner_floor_letter || '',
        prop.owner_address || ''
      );
      const rawZipcode = prop.owner_zipcode || prop.zipcode || '';
      const rawCity = prop.owner_city || prop.city || '';
      const rawProvince = prop.owner_province || prop.province || '';

      // Soporte para propietario 2 (campos desglosados o legacy)
      if (prop.has_owner2 && prop.owner2_name) {
        const addr2 = buildAddress(
          prop.owner2_street || '',
          prop.owner2_number || '',
          prop.owner2_floor_letter || '',
          prop.owner2_address || ''
        );
        const useSameAddress = prop.seller2_same_address !== false;
        return [
          {
            name: rawName,
            dni: rawDni,
            address: rawAddress,
            zipcode: rawZipcode,
            city: rawCity,
            province: rawProvince
          },
          {
            name: prop.owner2_name,
            dni: prop.owner2_dni || '',
            address: useSameAddress ? rawAddress : addr2,
            zipcode: useSameAddress ? rawZipcode : (prop.owner2_zipcode || rawZipcode),
            city: useSameAddress ? rawCity : (prop.owner2_city || rawCity),
            province: useSameAddress ? rawProvince : (prop.owner2_province || rawProvince)
          }
        ];
      }

      return [{
        name: rawName,
        dni: rawDni,
        address: rawAddress,
        zipcode: rawZipcode,
        city: rawCity,
        province: rawProvince
      }];
    };

    const owners = parseOwnersList(property);
    const isMultipleOwners = owners.length > 1;

    let specificFeaturesObj = property.specific_features;
    if (typeof specificFeaturesObj === 'string') {
      try {
        specificFeaturesObj = JSON.parse(specificFeaturesObj);
      } catch (e) {
        specificFeaturesObj = {};
      }
    }
    const savedIncludes = specificFeaturesObj?.owner_includes || [];

    const buildOwnerPhrase = (o: any, idx: number) => {
      const inc = savedIncludes[idx] || {
        includeAddress: true,
        includeZipcode: true,
        includeCity: true,
        includeProvince: true,
      };

      const parts: string[] = [];

      // Nombre y DNI (Obligatorios)
      parts.push(`<span class="bold">${o.name || '____________________________________________'}</span>, DNI <span class="bold">${o.dni || '____________'}</span>`);

      // Dirección
      if (inc.includeAddress !== false) {
        parts.push(`domicilio en <span class="bold">${o.address || '________________________'}</span>`);
      }

      // Código Postal
      if (inc.includeZipcode !== false) {
        parts.push(`C.P. <span class="bold">${o.zipcode || property.zipcode || '____________'}</span>`);
      }

      // Municipio
      if (inc.includeCity !== false) {
        const ownerCity = o.city || property.city || '____________';
        parts.push(`en el municipio de <span class="bold">${ownerCity}</span>`);
      }

      // Provincia
      if (inc.includeProvince !== false) {
        const ownerProvince = o.province || property.province || '____________';
        parts.push(`en la provincia de <span class="bold">${ownerProvince}</span>`);
      }

      return parts.join(', ');
    };

    let parteVendedoraHtml = '';
    if (isMultipleOwners) {
      const ownersText = owners.map((o: any, idx: number) => buildOwnerPhrase(o, idx)).join('; ');
      parteVendedoraHtml = `
        <p>
          <span class="bold">LA PARTE VENDEDORA:</span> ${ownersText}, que intervienen como propietarios.
        </p>
      `;
    } else {
      const o = owners[0] || {};
      const ownerText = buildOwnerPhrase(o, 0);
      parteVendedoraHtml = `
        <p>
          <span class="bold">LA PARTE VENDEDORA:</span> ${ownerText}, que interviene como propietario.
        </p>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Compromiso de Gestión de Venta con Exclusiva - TERRAVALL</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            color: #0f172a; 
            line-height: 1.4; 
            font-size: 11.5px; 
          }
          .no-print { text-align: right; margin-bottom: 15px; }
          .btn-print { background: #8f1505; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #8f1505; padding-bottom: 8px; margin-bottom: 12px; }
          .logo { height: 50px; width: auto; max-width: 320px; margin-bottom: 4px; }
          .title-text { font-size: 14.5px; font-weight: normal; color: #8f1505; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
          p { margin-bottom: 8px; text-align: justify; }
          .bold { font-weight: bold; }
          .stipulations { margin-top: 6px; }
          .property-details { background: #f8fafc; border-left: 3px solid #8f1505; padding: 6px 12px; margin: 6px 0; font-size: 11px; }
          .property-details div { margin-bottom: 2px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; page-break-inside: avoid; }
          .signature-box { border-top: 1px solid #64748b; padding-top: 6px; font-weight: bold; font-size: 11px; color: #334155; }
          .gdpr-clause { font-size: 8.5px; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: justify; line-height: 1.3; margin-top: 18px; page-break-inside: avoid; }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" class="btn-print">Imprimir / Exportar PDF</button>
        </div>

        <div class="header">
          <img src="${TERRAVALL_LOGO_BASE64}" alt="TERRAVALL" class="logo" />
          <div class="title-text">COMPROMISO DE GESTIÓN DE VENTA CON EXCLUSIVA</div>
        </div>

        ${parteVendedoraHtml}

        <p>
          Y de otra, <span class="bold">TERRAVALL 27 S.L.</span>, en adelante TERRAVALL, con CIF B95936567 y domicilio en Plaza Mayor 8, 1ºA de Valladolid, como Intermediario Inmobiliario, recibe ENCARGO DE GESTIÓN DE VENTA CON EXCLUSIVA, conforme a las siguientes:
        </p>

        <div class="stipulations">
          <div class="title" style="font-size: 13px; margin: 10px 0 6px 0; border: none; padding: 0; text-align: center;">ESTIPULACIONES</div>

          <p>
            <span class="bold">PRIMERO.- OBJETO.-</span> En virtud de este encargo, la propiedad autoriza a TERRAVALL a realizar la intermediación inmobiliaria y gestión de venta de la finca detallada a continuación:
          </p>

          <div class="property-details">
            <div>· <span class="bold">DIRECCIÓN:</span> VIVIENDA sita en <span class="bold">${property.address_hidden}</span> en el municipio de <span class="bold">${property.city}</span> en la provincia de <span class="bold">${property.province}</span>.</div>
            <div>· <span class="bold">C.P.:</span> ${property.zipcode}</div>
            <div>· <span class="bold">CALIFICACIÓN ENERGÉTICA:</span> <span class="notranslate" translate="no">${property.energy_certificate ? property.energy_certificate.replace('_', ' ').toUpperCase() : 'EN TRÁMITE'}</span></div>
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
            · <span class="bold">HONORARIOS:</span> Los honorarios ascenderán a <span class="bold">${honorariosTexto} + 21% de IVA</span>${calculoTotalIvaHtml}.
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

          <p style="margin-top: 12px;">
            Leído y conformes con todo cuanto antecede, las partes libremente firman el presente documento, por duplicado ejemplar y a un solo efecto, en el lugar y fecha indicados.
          </p>

          <p style="margin-top: 8px;" class="bold">
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="text-slate-700 hover:bg-slate-50 border-slate-200 gap-2 shadow-sm" onClick={() => setIsArrasModalOpen(true)}>
            <FileText size={16} className="text-primary" />
            Generar Contrato de Arras
          </Button>
          <Button variant="outline" className="text-slate-700 hover:bg-slate-50 border-slate-200 gap-2 shadow-sm" onClick={() => setIsRentalModalOpen(true)}>
            <FileText size={16} className="text-emerald-600" />
            Generar Contrato de Alquiler
          </Button>
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
          <div className="relative group">
            <div className="flex overflow-x-auto p-4 gap-4 bg-slate-950 snap-x">
              {media.map((item, index) => (
                <div 
                  key={item.id} 
                  onClick={() => openLightbox(index)}
                  className="relative h-64 rounded-lg overflow-hidden shrink-0 snap-center cursor-pointer group/img border border-slate-800 transition-all hover:border-primary"
                  title="Haz clic para ver a pantalla completa"
                >
                  <img src={item.url} alt={`Inmueble - Foto ${index + 1}`} className="h-full w-auto object-cover group-hover/img:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                    <Maximize2 size={16} />
                    Ampliación
                  </div>
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-white/10">
                    {index + 1} / {media.length}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-2 right-4 text-[10px] text-slate-400 font-medium hidden sm:block pointer-events-none bg-slate-900/60 px-2 py-1 rounded">
              Haz clic en cualquier imagen para abrir la galería a pantalla completa
            </div>
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
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-6 border border-gray-100 text-justify">
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

                    const translateValue = (key: string, val: any): string => {
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

                    if (!property.specific_features || Object.keys(property.specific_features).length === 0) return null;
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
                  <span className="font-medium uppercase notranslate" translate="no">{(property.energy_certificate || 'en_tramite').replace('_', ' ')}</span>
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

            {/* MORTGAGE & EXPENSES CALCULATOR */}
            <MortgageCalculator price={property.price} isNewWork={property.condition === 'obra_nueva'} />
          </div>
        </div>
      </div>

      <ArrasContractModal
        isOpen={isArrasModalOpen}
        onClose={() => setIsArrasModalOpen(false)}
        property={property}
        onSaveSuccess={fetchProperty}
      />

      <RentalContractModal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        property={property}
        onSaveSuccess={fetchProperty}
      />

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && media.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={closeLightbox}
        >
          {/* Top Control Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-50">
            <span className="text-xs font-bold tracking-widest uppercase bg-slate-900/80 px-4 py-1.5 rounded-full border border-white/20">
              Foto {lightboxIndex + 1} de {media.length} — {property.title}
            </span>
            <button 
              onClick={closeLightbox}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X size={24} />
            </button>
          </div>

          {/* Previous Arrow Button */}
          {media.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors cursor-pointer z-50"
              title="Foto anterior (Flecha izquierda)"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Main Image View */}
          <div className="max-w-6xl max-h-[85vh] flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
            <img 
              src={media[lightboxIndex]?.url} 
              alt={`Foto ${lightboxIndex + 1}`} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Next Arrow Button */}
          {media.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/30 text-white transition-colors cursor-pointer z-50"
              title="Foto siguiente (Flecha derecha)"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
