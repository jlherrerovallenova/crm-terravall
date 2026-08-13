import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import { formatPrice, numberToSpanishWords } from '@/lib/utils';
import { 
  Calculator, 
  TrendingUp, 
  Building2, 
  MapPin, 
  User, 
  Sparkles, 
  Printer, 
  Plus, 
  History, 
  FileText, 
  ArrowRight, 
  Trash2, 
  CheckCircle,
  Eye
} from 'lucide-react';

export interface ValuationData {
  id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  property_type: string;
  city: string;
  province: string;
  zipcode?: string;
  address?: string;
  area_built: number;
  area_useful?: number;
  rooms: number;
  bathrooms: number;
  condition: 'buen_estado' | 'a_reformar' | 'obra_nueva';
  has_elevator: boolean;
  has_parking: boolean;
  has_terrace: boolean;
  has_pool: boolean;
  price_min: number;
  price_target: number;
  price_max: number;
  rent_target?: number;
  price_per_m2: number;
  ai_opinion?: string;
  agent_name?: string;
  created_at?: string;
}

export const ValuationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'nueva' | 'resultado' | 'historial'>('nueva');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<ValuationData[]>([]);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [propertyType, setPropertyType] = useState('piso');
  const [city, setCity] = useState('Valladolid');
  const [province, setProvince] = useState('Valladolid');
  const [zipcode, setZipcode] = useState('');
  const [address, setAddress] = useState('');
  const [areaBuilt, setAreaBuilt] = useState<number | ''>(90);
  const [areaUseful, setAreaUseful] = useState<number | ''>(80);
  const [rooms, setRooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [condition, setCondition] = useState<'buen_estado' | 'a_reformar' | 'obra_nueva'>('buen_estado');
  const [hasElevator, setHasElevator] = useState(true);
  const [hasParking, setHasParking] = useState(false);
  const [hasTerrace, setHasTerrace] = useState(false);
  const [hasPool, setHasPool] = useState(false);

  // Result State
  const [currentValuation, setCurrentValuation] = useState<ValuationData | null>(null);

  useEffect(() => {
    fetchValuationHistory();
  }, []);

  const fetchValuationHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHistory(data as ValuationData[]);
      }
    } catch (e) {
      console.warn('Error cargando historial de valoraciones:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCalculateValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !city || !province || !areaBuilt || Number(areaBuilt) <= 0) {
      alert('Por favor, rellena los campos obligatorios (*)');
      return;
    }

    setLoading(true);
    const builtM2 = Number(areaBuilt);

    try {
      // 1. Consultar precio medio por m2 en propiedades existentes en la zona (Supabase)
      let basePricePerM2 = 1650; // Referencia por defecto si no hay propiedades comparables

      const { data: areaProperties } = await supabase
        .from('properties')
        .select('price, area_built')
        .eq('city', city)
        .eq('type', propertyType);

      if (areaProperties && areaProperties.length > 0) {
        const totalP = areaProperties.reduce((acc, curr) => acc + (curr.price / (curr.area_built || 1)), 0);
        basePricePerM2 = Math.round(totalP / areaProperties.length);
      }

      // 2. Ajustes según características del inmueble
      let multiplier = 1.0;
      if (condition === 'obra_nueva') multiplier += 0.15;
      if (condition === 'a_reformar') multiplier -= 0.20;
      if (hasElevator) multiplier += 0.05;
      if (hasParking) multiplier += 0.08;
      if (hasTerrace) multiplier += 0.05;
      if (hasPool) multiplier += 0.08;

      const finalPricePerM2 = Math.round(basePricePerM2 * multiplier);
      const targetPrice = Math.round(builtM2 * finalPricePerM2);
      const minPrice = Math.round(targetPrice * 0.90);
      const maxPrice = Math.round(targetPrice * 1.10);
      const rentEstimate = Math.round(targetPrice * 0.0045); // ~5.4% bruto anual

      // 3. Generar opinión comercial con Gemini AI
      let aiOpinion = '';
      try {
        const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          const prompt = `
Actúa como un experto tasador inmobiliario senior de Terravall en ${city} (${province}).
Redacta un informe ejecutivo de valoración de mercado breve y persuasivo (3 párrafos) para presentar al propietario ${clientName}.
Datos del inmueble a valorar:
- Tipo: ${propertyType.toUpperCase()} de ${builtM2} m² construidos en ${city}.
- Estado: ${condition.replace('_', ' ')}.
- Características: ${rooms} hab, ${bathrooms} baños, ${hasElevator ? 'con ascensor' : 'sin ascensor'}, ${hasParking ? 'garaje' : ''}, ${hasTerrace ? 'terraza' : ''}.
- Precio recomendado objetivo: ${formatPrice(targetPrice)} (${finalPricePerM2} €/m²).
- Rango de mercado: Entre ${formatPrice(minPrice)} y ${formatPrice(maxPrice)}.

Instrucciones:
1. Explica brevemente la idoneidad del precio sugerido basándote en la zona y las ventajas del inmueble.
2. Sugiere una estrategia de comercialización efectiva.
3. Escribe en tono profesional, formal y elegante en español. Devuelve únicamente el texto del informe.
`;
          const res = await fetch(`/api-gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          if (res.ok) {
            const dataRes = await res.json();
            aiOpinion = dataRes?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          }
        }
      } catch (e) {
        console.warn('Error llamando a Gemini para valoración:', e);
      }

      if (!aiOpinion) {
        aiOpinion = `Basándonos en el análisis comparativo del mercado residencial de ${city}, este ${propertyType} de ${builtM2} m² presenta un valor objetivo óptimo de ${formatPrice(targetPrice)} (${finalPricePerM2} €/m²). El rango de comercialización sugerido se sitúa entre ${formatPrice(minPrice)} para ventas de oportunidad rápida y ${formatPrice(maxPrice)} como precio de salida inicial.`;
      }

      const valuationObj: ValuationData = {
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        property_type: propertyType,
        city,
        province,
        zipcode,
        address,
        area_built: builtM2,
        area_useful: Number(areaUseful) || builtM2,
        rooms,
        bathrooms,
        condition,
        has_elevator: hasElevator,
        has_parking: hasParking,
        has_terrace: hasTerrace,
        has_pool: hasPool,
        price_min: minPrice,
        price_target: targetPrice,
        price_max: maxPrice,
        rent_target: rentEstimate,
        price_per_m2: finalPricePerM2,
        ai_opinion: aiOpinion,
        created_at: new Date().toISOString()
      };

      // 4. Guardar valoración en Supabase
      try {
        const { data: savedData, error: saveErr } = await supabase
          .from('property_valuations')
          .insert([valuationObj])
          .select()
          .single();

        if (!saveErr && savedData) {
          valuationObj.id = savedData.id;
        }
      } catch (e) {
        console.warn('No se pudo guardar en Supabase:', e);
      }

      setCurrentValuation(valuationObj);
      setActiveTab('resultado');
      fetchValuationHistory();
    } catch (err: any) {
      alert('Error calculando la valoración: ' + (err.message || 'Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintValuationReport = (val: ValuationData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateFormatted = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe de Valoración de Mercado - TERRAVALL</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
          .no-print { text-align: right; margin-bottom: 15px; }
          .btn-print { background: #8f1505; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; }
          .header { display: flex; justify-content: space-between; items-center; border-bottom: 2px solid #8f1505; padding-bottom: 10px; margin-bottom: 20px; }
          .logo { height: 45px; }
          .doc-title { text-align: right; }
          .doc-title h1 { color: #8f1505; margin: 0; font-size: 16px; text-transform: uppercase; }
          .doc-title p { margin: 0; color: #64748b; font-size: 11px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 13px; font-weight: bold; color: #8f1505; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .card { bg-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
          .kpi-box { background: #f1f5f9; border-radius: 8px; padding: 10px; text-align: center; border: 1px solid #cbd5e1; }
          .kpi-box.target { background: #fef2f2; border-color: #fca5a5; }
          .kpi-val { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .kpi-box.target .kpi-val { color: #8f1505; font-size: 18px; }
          .kpi-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          p { margin-top: 0; text-align: justify; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; pt: 10px; font-size: 10px; color: #64748b; text-align: center; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; }
          .sig-box { border-top: 1px solid #64748b; padding-top: 6px; font-weight: bold; font-size: 11px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" class="btn-print">Imprimir / Exportar a PDF</button>
        </div>

        <div class="header">
          <img src="${TERRAVALL_LOGO_BASE64}" alt="TERRAVALL" class="logo" />
          <div class="doc-title">
            <h1>INFORME DE VALORACIÓN DE MERCADO</h1>
            <p>Análisis Comparativo (ACM) — Terravall Inmobiliaria</p>
            <p>Fecha: ${dateFormatted}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. Datos del Solicitante y Ubicación</div>
          <div class="grid-2">
            <div class="card">
              <div><strong>Propietario / Cliente:</strong> ${val.client_name}</div>
              <div><strong>Teléfono:</strong> ${val.client_phone || '-'}</div>
              <div><strong>Email:</strong> ${val.client_email || '-'}</div>
            </div>
            <div class="card">
              <div><strong>Ubicación:</strong> ${val.address || 'Sin especificar'}, ${val.city} (${val.province})</div>
              <div><strong>Código Postal:</strong> ${val.zipcode || '-'}</div>
              <div><strong>Tipo de Inmuebles:</strong> ${val.property_type.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Características Técnicas del Inmueble</div>
          <div class="card">
            <div class="grid-2">
              <div>
                <div>· <strong>Superficie construida:</strong> ${val.area_built} m²</div>
                <div>· <strong>Superficie útil:</strong> ${val.area_useful || val.area_built} m²</div>
                <div>· <strong>Habitaciones:</strong> ${val.rooms}</div>
                <div>· <strong>Baños / Aseos:</strong> ${val.bathrooms}</div>
              </div>
              <div>
                <div>· <strong>Estado:</strong> ${val.condition.replace('_', ' ').toUpperCase()}</div>
                <div>· <strong>Ascensor:</strong> ${val.has_elevator ? 'SÍ' : 'NO'}</div>
                <div>· <strong>Garaje:</strong> ${val.has_parking ? 'SÍ' : 'NO'}</div>
                <div>· <strong>Terraza / Balcón:</strong> ${val.has_terrace ? 'SÍ' : 'NO'}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Resultados del Análisis Comparativo de Mercado (ACM)</div>
          <div class="kpi-container">
            <div class="kpi-box">
              <div class="kpi-lbl">Precio Mínimo</div>
              <div class="kpi-val">${formatPrice(val.price_min)}</div>
            </div>
            <div class="kpi-box target">
              <div class="kpi-lbl">Valor Objetivo Sugerido</div>
              <div class="kpi-val">${formatPrice(val.price_target)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Precio Máximo</div>
              <div class="kpi-val">${formatPrice(val.price_max)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Est. Alquiler/mes</div>
              <div class="kpi-val">${val.rent_target ? formatPrice(val.rent_target) : '-'}</div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 8px; font-weight: bold; color: #475569;">
            Precio medio de valoración: ${val.price_per_m2} €/m²
          </div>
        </div>

        <div class="section">
          <div class="section-title">4. Argumentación Comercial e Informe Técnico</div>
          <div class="card" style="background: #ffffff; border-left: 3px solid #8f1505;">
            <p>${val.ai_opinion}</p>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            PROPIETARIO / SOLICITANTE
          </div>
          <div class="sig-box">
            TERRAVALL INMOBILIARIA
          </div>
        </div>

        <div class="footer">
          Terravall 27 S.L. · Plaza Mayor 8, 1ºA, 47001 Valladolid · Tel: 983 12 34 56 · info@terravall.com
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleConvertToProperty = (val: ValuationData) => {
    navigate('/crm/inmuebles/nuevo', {
      state: {
        prefillValuation: {
          title: `${val.property_type.toUpperCase()} en ${val.city} - ${val.area_built} m²`,
          type: val.property_type,
          price: val.price_target,
          city: val.city,
          province: val.province,
          zipcode: val.zipcode,
          address_hidden: val.address || `${val.city}`,
          area_built: val.area_built,
          area_useful: val.area_useful,
          condition: val.condition,
          owner_name: val.client_name,
          owner_phone: val.client_phone,
          owner_email: val.client_email,
          description: val.ai_opinion || '',
          specific_features: {
            rooms: val.rooms,
            bathrooms: val.bathrooms,
            has_elevator: val.has_elevator,
            has_parking: val.has_parking,
            has_terrace: val.has_terrace,
            has_pool: val.has_pool
          }
        }
      }
    });
  };

  const handleDeleteValuation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar esta valoración del historial?')) return;

    try {
      await supabase.from('property_valuations').delete().eq('id', id);
      setHistory(history.filter(h => h.id !== id));
    } catch (err) {
      alert('Error eliminando la valoración');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="text-primary" size={28} />
            Módulo de Valoraciones (ACM)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Calcula el valor de mercado comparativo de cualquier inmueble y genera informes corporativos de valoración.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('nueva')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nueva' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus size={14} />
            Nueva Valoración
          </button>
          {currentValuation && (
            <button
              onClick={() => setActiveTab('resultado')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'resultado' ? 'bg-white text-primary font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className="text-primary" />
              Ver Resultado
            </button>
          )}
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'historial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={14} />
            Historial ({history.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Nueva Valoración Form */}
      {activeTab === 'nueva' && (
        <form onSubmit={handleCalculateValuation} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 max-w-4xl">
          {/* Section 1: Cliente/Propietario */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-primary" />
              1. Datos del Solicitante / Propietario
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pedro Martínez"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="600 00 00 00"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ubicación */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              2. Ubicación del Inmueble
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección / Calle</label>
                <input
                  type="text"
                  placeholder="Ej. Calle Santiago 12"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio *</label>
                <input
                  type="text"
                  required
                  placeholder="Valladolid"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provincia *</label>
                <input
                  type="text"
                  required
                  placeholder="Valladolid"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Datos Técnicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              3. Características del Inmueble
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Inmueble *</label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="piso">Piso / Apartamento</option>
                  <option value="chalet">Chalet / Casa</option>
                  <option value="local">Local Comercial</option>
                  <option value="oficina">Oficina</option>
                  <option value="terreno">Terreno / Parcela</option>
                  <option value="nave">Nave Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">M² Construidos *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={areaBuilt}
                  onChange={e => setAreaBuilt(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">M² Útiles</label>
                <input
                  type="number"
                  min={1}
                  value={areaUseful}
                  onChange={e => setAreaUseful(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Habitaciones</label>
                <input
                  type="number"
                  min={0}
                  value={rooms}
                  onChange={e => setRooms(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Baños</label>
                <input
                  type="number"
                  min={0}
                  value={bathrooms}
                  onChange={e => setBathrooms(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Conservación</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="buen_estado">Buen estado</option>
                  <option value="obra_nueva">Obra nueva</option>
                  <option value="a_reformar">A reformar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasElevator} onChange={e => setHasElevator(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Ascensor
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Plaza de Garaje
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasTerrace} onChange={e => setHasTerrace(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Terraza / Balcón
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasPool} onChange={e => setHasPool(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Piscina
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {loading ? 'Calculando Valoración con IA...' : 'Calcular Valoración de Mercado & Informe'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Resultado de Valoración */}
      {activeTab === 'resultado' && currentValuation && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Mínimo de Mercado</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_min)}</div>
              <p className="text-[11px] text-slate-500">Venta rápida / Oportunidad</p>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-xs space-y-1 relative overflow-hidden">
              <div className="absolute right-3 top-3 text-primary/20">
                <Sparkles size={40} />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Valor Objetivo Sugerido</span>
              <div className="text-3xl font-black text-primary">{formatPrice(currentValuation.price_target)}</div>
              <p className="text-[11px] text-primary/80 font-medium">Precio óptimo de captación ({currentValuation.price_per_m2} €/m²)</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Máximo de Salida</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_max)}</div>
              <p className="text-[11px] text-slate-500">Margen máximo de negociación</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alquiler Mensual Estimado</span>
              <div className="text-2xl font-extrabold text-slate-900">{currentValuation.rent_target ? formatPrice(currentValuation.rent_target) : '-'} / mes</div>
              <p className="text-[11px] text-slate-500">Rentabilidad ~5.4% bruto</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="font-bold text-base">Informe de Valoración Generado</h3>
              <p className="text-xs text-slate-400 mt-0.5">Puedes imprimir el informe oficial para el cliente o convertirlo en una propiedad en el CRM.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handlePrintValuationReport(currentValuation)}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Printer size={16} className="text-primary" />
                Imprimir Informe PDF (A4)
              </button>
              <button
                onClick={() => handleConvertToProperty(currentValuation)}
                className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <ArrowRight size={16} />
                Convertir en Inmueble del CRM
              </button>
            </div>
          </div>

          {/* AI Report Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              Argumentación Comercial e Informe de IA
            </h3>
            <div className="text-slate-700 leading-relaxed text-sm text-justify whitespace-pre-wrap bg-slate-50/70 p-6 rounded-xl border border-slate-150">
              {currentValuation.ai_opinion}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Historial */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Historial de Valoraciones Realizadas</h3>
            <span className="text-xs text-slate-500 font-medium">{history.length} valoraciones registradas</span>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400 text-xs">Cargando historial de valoraciones...</div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <FileText size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No hay valoraciones guardadas aún</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Crea una nueva valoración para empezar a nutrir tu historial.</p>
              <button
                onClick={() => setActiveTab('nueva')}
                className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl"
              >
                Nueva Valoración
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Propietario</th>
                    <th className="px-6 py-3">Inmueble</th>
                    <th className="px-6 py-3">Ubicación</th>
                    <th className="px-6 py-3">Precio Objetivo</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {history.map((item) => (
                    <tr 
                      key={item.id}
                      onClick={() => { setCurrentValuation(item); setActiveTab('resultado'); }}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.client_name}</td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold capitalize text-slate-800">{item.property_type}</span> • {item.area_built} m²
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{item.city} ({item.province})</td>
                      <td className="px-6 py-4 font-bold text-primary">{formatPrice(item.price_target)}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setCurrentValuation(item); setActiveTab('resultado'); }}
                            className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Ver valoración"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handlePrintValuationReport(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Imprimir Informe PDF"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={e => handleDeleteValuation(item.id!, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar valoración"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
