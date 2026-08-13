import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import { formatPrice } from '@/lib/utils';
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
  Eye,
  Percent,
  Clock,
  Layers,
  FileCheck2,
  HelpCircle
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
  cadastral_reference?: string;
  year_built?: number;
  area_built: number;
  area_useful?: number;
  rooms: number;
  bathrooms: number;
  condition: 'buen_estado' | 'a_reformar' | 'obra_nueva';
  has_elevator: boolean;
  has_parking: boolean;
  has_terrace: boolean;
  has_pool: boolean;
  has_storage?: boolean;
  has_heating?: boolean;
  price_min: number;
  price_target: number;
  price_max: number;
  rent_target?: number;
  price_per_m2: number;
  gross_yield?: number;
  per_years?: number;
  ai_opinion?: string;
  agent_name?: string;
  comparable_properties?: any[];
  coefficients?: {
    state: number;
    elevator: number;
    parking: number;
    terrace: number;
    pool: number;
    storage: number;
    heating: number;
    totalMultiplier: number;
  };
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
  const [cadastralReference, setCadastralReference] = useState('');
  const [yearBuilt, setYearBuilt] = useState<number | ''>(2005);
  const [areaBuilt, setAreaBuilt] = useState<number | ''>(95);
  const [areaUseful, setAreaUseful] = useState<number | ''>(85);
  const [rooms, setRooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [condition, setCondition] = useState<'buen_estado' | 'a_reformar' | 'obra_nueva'>('buen_estado');
  const [hasElevator, setHasElevator] = useState(true);
  const [hasParking, setHasParking] = useState(true);
  const [hasTerrace, setHasTerrace] = useState(true);
  const [hasPool, setHasPool] = useState(false);
  const [hasStorage, setHasStorage] = useState(true);
  const [hasHeating, setHasHeating] = useState(true);

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
      // 1. Obtener inmuebles testigo comparables de Supabase
      let basePricePerM2 = 1680; // Precio m2 base regional si no hay suficientes testigos
      let witnessProperties: any[] = [];

      const { data: areaProperties } = await supabase
        .from('properties')
        .select('id, title, price, area_built, address_public, city, type, condition')
        .eq('city', city)
        .eq('type', propertyType)
        .limit(4);

      if (areaProperties && areaProperties.length > 0) {
        witnessProperties = areaProperties;
        const totalP = areaProperties.reduce((acc, curr) => acc + (curr.price / (curr.area_built || 1)), 0);
        basePricePerM2 = Math.round(totalP / areaProperties.length);
      }

      // 2. Coeficientes Técnicos de Ponderación (Normativa de Valoración ECO)
      const coeffState = condition === 'obra_nueva' ? 0.15 : condition === 'a_reformar' ? -0.20 : 0.0;
      const coeffElevator = hasElevator ? 0.05 : (propertyType === 'piso' ? -0.05 : 0.0);
      const coeffParking = hasParking ? 0.08 : 0.0;
      const coeffTerrace = hasTerrace ? 0.05 : 0.0;
      const coeffPool = hasPool ? 0.08 : 0.0;
      const coeffStorage = hasStorage ? 0.03 : 0.0;
      const coeffHeating = hasHeating ? 0.04 : 0.0;

      const totalMultiplier = 1.0 + coeffState + coeffElevator + coeffParking + coeffTerrace + coeffPool + coeffStorage + coeffHeating;

      const finalPricePerM2 = Math.round(basePricePerM2 * totalMultiplier);
      const targetPrice = Math.round(builtM2 * finalPricePerM2);
      const minPrice = Math.round(targetPrice * 0.90);
      const maxPrice = Math.round(targetPrice * 1.10);
      const rentEstimate = Math.round(targetPrice * 0.0046); // ~5.5% bruto anual

      // Métricas de inversión
      const grossYield = Number((((rentEstimate * 12) / targetPrice) * 100).toFixed(2));
      const perYears = Number((targetPrice / (rentEstimate * 12)).toFixed(1));

      // 3. Generar Dictamen Técnico de IA Gemini en 5 Puntos Clave
      let aiOpinion = '';
      try {
        const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          const prompt = `
Actúa como un tasador homologado senior y director de valoración de Terravall Inmobiliaria en ${city} (${province}).
Genera un Dictamen Técnico de Tasación de Mercado exhaustivo estructurado exactamente en los siguientes 5 puntos numéricos en español:

1. ANÁLISIS FÍSICO Y ESTADO DE CONSERVACIÓN:
Evalúa este ${propertyType.toUpperCase()} de ${builtM2} m² construidos (${areaUseful || builtM2} m² útiles) construido en el año ${yearBuilt || '2000'}. Destaca el estado de conservación (${condition.replace('_', ' ')}) y sus equipamientos (${hasElevator ? 'ascensor' : 'sin ascensor'}, ${hasParking ? 'garaje' : ''}, ${hasTerrace ? 'terraza' : ''}, ${hasStorage ? 'trastero' : ''}).

2. ANÁLISIS DEL MERCADO LOCAL EN ${city.toUpperCase()}:
Describe la coyuntura del mercado residencial de ${city} (${province}), nivel de demanda compradora y liquidez en la zona.

3. JUSTIFICACIÓN DEL VALOR ADOPTADO Y COEFICIENTES:
Justifica técnicamente el precio objetivo adoptado de ${formatPrice(targetPrice)} (${finalPricePerM2} €/m²), explicando los coeficientes aplicados (ajuste por estado, ascensor, garaje y extras). Menciona la horquilla de mercado entre ${formatPrice(minPrice)} (mínimo de oportunidad) y ${formatPrice(maxPrice)} (máximo de salida).

4. ESTUDIO FINANCIERO Y RENTABILIDAD PARA INVERSORES:
Analiza la rentabilidad estimada por alquiler (${formatPrice(rentEstimate)}/mes, ${grossYield}% bruto anual, PER ${perYears} años) e idoneidad para inversión patrimonial.

5. CONCLUSIÓN Y DICTAMEN FINAL DEL TASADOR:
Emite una recomendación final de fijación de precio de salida y plazo estimado de venta (entre 60 y 90 días).

Escribe de forma técnica, limpia y profesional. Retorna únicamente el texto estructurado con los 5 títulos en mayúsculas.
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
        console.warn('Error en llamada a Gemini para tasación:', e);
      }

      if (!aiOpinion) {
        aiOpinion = `
1. ANÁLISIS FÍSICO Y ESTADO DE CONSERVACIÓN:
El inmueble analizado corresponde a un ${propertyType.toUpperCase()} de ${builtM2} m² construidos (${areaUseful || builtM2} m² útiles), edificado en ${yearBuilt || '2005'}. Se encuentra en estado de ${condition.replace('_', ' ')} y dispone de ${rooms} dormitorios, ${bathrooms} baños${hasElevator ? ', ascensor' : ''}${hasParking ? ', garaje' : ''}${hasTerrace ? ' y terraza' : ''}.

2. ANÁLISIS DEL MERCADO LOCAL EN ${city.toUpperCase()}:
El mercado residencial en ${city} muestra un dinamismo estable con demanda sostenida para inmuebles de esta tipología.

3. JUSTIFICACIÓN DEL VALOR ADOPTADO Y COEFICIENTES:
Se adopta un Valor Objetivo Recomendado de ${formatPrice(targetPrice)} (${finalPricePerM2} €/m²). La horquilla de valoración comprende un mínimo de ${formatPrice(minPrice)} y un valor de salida máximo de ${formatPrice(maxPrice)}.

4. ESTUDIO FINANCIERO Y RENTABILIDAD PARA INVERSORES:
Se estima una renta de alquiler de ${formatPrice(rentEstimate)}/mes, ofreciendo una rentabilidad bruta del ${grossYield}% anual y un PER de ${perYears} años.

5. CONCLUSIÓN Y DICTAMEN FINAL DEL TASADOR:
Se aconseja fijar el precio inicial de salida en ${formatPrice(targetPrice)}, estimando un plazo medio de comercialización de 60 a 90 días.
`.trim();
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
        cadastral_reference: cadastralReference,
        year_built: Number(yearBuilt) || 2005,
        area_built: builtM2,
        area_useful: Number(areaUseful) || builtM2,
        rooms,
        bathrooms,
        condition,
        has_elevator: hasElevator,
        has_parking: hasParking,
        has_terrace: hasTerrace,
        has_pool: hasPool,
        has_storage: hasStorage,
        has_heating: hasHeating,
        price_min: minPrice,
        price_target: targetPrice,
        price_max: maxPrice,
        rent_target: rentEstimate,
        price_per_m2: finalPricePerM2,
        gross_yield: grossYield,
        per_years: perYears,
        ai_opinion: aiOpinion,
        comparable_properties: witnessProperties,
        coefficients: {
          state: Math.round(coeffState * 100),
          elevator: Math.round(coeffElevator * 100),
          parking: Math.round(coeffParking * 100),
          terrace: Math.round(coeffTerrace * 100),
          pool: Math.round(coeffPool * 100),
          storage: Math.round(coeffStorage * 100),
          heating: Math.round(coeffHeating * 100),
          totalMultiplier: Number((totalMultiplier * 100).toFixed(1))
        },
        created_at: new Date().toISOString()
      };

      // 4. Guardar en Supabase
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
      alert('Error calculando la tasación: ' + (err.message || 'Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintValuationReport = (val: ValuationData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateFormatted = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const comparables = val.comparable_properties || [];
    const coeffs = val.coefficients || { state: 0, elevator: 0, parking: 0, terrace: 0, pool: 0, storage: 0, heating: 0, totalMultiplier: 100 };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe de Tasación y Valoración Inmobiliaria - TERRAVALL</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.45; }
          .no-print { text-align: right; margin-bottom: 15px; }
          .btn-print { background: #8f1505; color: white; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8f1505; padding-bottom: 12px; margin-bottom: 18px; }
          .logo { height: 48px; }
          .doc-title { text-align: right; }
          .doc-title h1 { color: #8f1505; margin: 0; font-size: 17px; text-transform: uppercase; font-weight: 800; letter-spacing: -0.5px; }
          .doc-title p { margin: 2px 0 0 0; color: #64748b; font-size: 11px; font-weight: 500; }
          .section { margin-bottom: 18px; page-break-inside: avoid; }
          .section-title { font-size: 12px; font-weight: bold; color: #8f1505; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; tracking: 0.5px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
          .kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 12px 0; }
          .kpi-box { background: #f1f5f9; border-radius: 8px; padding: 10px; text-align: center; border: 1px solid #cbd5e1; }
          .kpi-box.target { background: #fef2f2; border-color: #fca5a5; }
          .kpi-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; }
          .kpi-box.target .kpi-val { color: #8f1505; font-size: 17px; }
          .kpi-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          table { w-full; width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 6px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: bold; }
          td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; }
          p { margin: 0 0 8px 0; text-align: justify; }
          .ai-box { background: #fafafa; border-left: 3px solid #8f1505; padding: 10px 14px; border-radius: 4px; font-size: 10.5px; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; pt: 8px; font-size: 9.5px; color: #64748b; text-align: center; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 35px; text-align: center; page-break-inside: avoid; }
          .sig-box { border-top: 1px solid #64748b; padding-top: 5px; font-weight: bold; font-size: 10px; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background: #e2e8f0; color: #334155; }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" class="btn-print">Imprimir / Guardar como PDF</button>
        </div>

        <div class="header">
          <img src="${TERRAVALL_LOGO_BASE64}" alt="TERRAVALL" class="logo" />
          <div class="doc-title">
            <h1>INFORME DE TASACIÓN Y VALORACIÓN DE MERCADO</h1>
            <p>Análisis Comparativo de Mercado (ACM Advanced) — Terravall 27 S.L.</p>
            <p>Fecha de emisión: ${dateFormatted}</p>
          </div>
        </div>

        <!-- Section 1 -->
        <div class="section">
          <div class="section-title">1. Identificación del Inmueble y Registro</div>
          <div class="grid-2">
            <div class="card">
              <div><strong>Solicitante / Propietario:</strong> ${val.client_name}</div>
              <div><strong>Teléfono:</strong> ${val.client_phone || 'Sin especificar'}</div>
              <div><strong>Email:</strong> ${val.client_email || 'Sin especificar'}</div>
              <div><strong>Referencia Catastral:</strong> ${val.cadastral_reference || 'No aportada'}</div>
            </div>
            <div class="card">
              <div><strong>Ubicación:</strong> ${val.address || 'Sin especificar'}, ${val.city} (${val.province})</div>
              <div><strong>Código Postal:</strong> ${val.zipcode || 'Sin especificar'}</div>
              <div><strong>Tipología / Uso:</strong> ${val.property_type.toUpperCase()}</div>
              <div><strong>Año de Construcción:</strong> ${val.year_built || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="section">
          <div class="section-title">2. Descripción Física y Coeficientes Técnicos de Ponderación</div>
          <div class="card">
            <div class="grid-2">
              <div>
                <div>· <strong>Superficie construida:</strong> ${val.area_built} m²</div>
                <div>· <strong>Superficie útil:</strong> ${val.area_useful || val.area_built} m²</div>
                <div>· <strong>Dormitorios / Baños:</strong> ${val.rooms} hab / ${val.bathrooms} baños</div>
                <div>· <strong>Estado:</strong> ${val.condition.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div>
                <div>· <strong>Ascensor:</strong> ${val.has_elevator ? 'SÍ' : 'NO'} | <strong>Garaje:</strong> ${val.has_parking ? 'SÍ' : 'NO'}</div>
                <div>· <strong>Terraza / Balcón:</strong> ${val.has_terrace ? 'SÍ' : 'NO'} | <strong>Piscina:</strong> ${val.has_pool ? 'SÍ' : 'NO'}</div>
                <div>· <strong>Trastero:</strong> ${val.has_storage ? 'SÍ' : 'NO'} | <strong>Calefacción:</strong> ${val.has_heating ? 'SÍ' : 'NO'}</div>
                <div>· <strong>Coeficiente global de ajuste:</strong> <span class="badge ${coeffs.totalMultiplier >= 100 ? 'badge-green' : 'badge-red'}">${coeffs.totalMultiplier}%</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3 -->
        ${comparables.length > 0 ? `
        <div class="section">
          <div class="section-title">3. Muestra de Inmuebles Testigo Comparables (Base Terravall)</div>
          <table>
            <thead>
              <tr>
                <th>Referencia / Inmueble</th>
                <th>Ubicación</th>
                <th>Superficie</th>
                <th>Estado</th>
                <th>Precio Total</th>
                <th>Precio / m²</th>
              </tr>
            </thead>
            <tbody>
              ${comparables.map((c: any) => `
                <tr>
                  <td><strong>${c.title}</strong></td>
                  <td>${c.address_public || c.city}</td>
                  <td>${c.area_built} m²</td>
                  <td>${(c.condition || 'buen_estado').replace('_', ' ')}</td>
                  <td>${formatPrice(c.price)}</td>
                  <td><strong>${Math.round(c.price / (c.area_built || 1))} €/m²</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Section 4 -->
        <div class="section">
          <div class="section-title">4. Resultados de Valoración y Análisis Financiero de Inversión</div>
          <div class="kpi-container">
            <div class="kpi-box">
              <div class="kpi-lbl">Precio Mínimo</div>
              <div class="kpi-val">${formatPrice(val.price_min)}</div>
            </div>
            <div class="kpi-box target">
              <div class="kpi-lbl">Valor Objetivo Adop.</div>
              <div class="kpi-val">${formatPrice(val.price_target)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Precio Máximo</div>
              <div class="kpi-val">${formatPrice(val.price_max)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Est. Alquiler / mes</div>
              <div class="kpi-val">${val.rent_target ? formatPrice(val.rent_target) : '-'}</div>
            </div>
          </div>

          <div class="grid-3" style="margin-top: 10px;">
            <div class="card" style="text-align: center;">
              <span class="kpi-lbl">Valoración m²</span>
              <div style="font-weight: bold; font-size: 13px; color: #8f1505; margin-top: 2px;">${val.price_per_m2} €/m²</div>
            </div>
            <div class="card" style="text-align: center;">
              <span class="kpi-lbl">Rentabilidad Bruta Alquiler</span>
              <div style="font-weight: bold; font-size: 13px; color: #16a34a; margin-top: 2px;">${val.gross_yield || 5.4}% / año</div>
            </div>
            <div class="card" style="text-align: center;">
              <span class="kpi-lbl">PER Inmobiliario</span>
              <div style="font-weight: bold; font-size: 13px; color: #0284c7; margin-top: 2px;">${val.per_years || 18.5} años</div>
            </div>
          </div>
        </div>

        <!-- Section 5 -->
        <div class="section">
          <div class="section-title">5. Dictamen Técnico y Criterio Profesional del Tasador</div>
          <div class="ai-box">
            ${(val.ai_opinion || '').split('\n\n').map(p => `<p>${p.trim()}</p>`).join('')}
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            CONFORMIDAD DEL PROPIETARIO
          </div>
          <div class="sig-box">
            DEPARTAMENTO TÉCNICO TERRAVALL
          </div>
        </div>

        <div class="footer">
          Este informe constituye una tasación orientativa de mercado elaborada según metodología comparativa. Terravall 27 S.L. · Plaza Mayor 8, 1ºA, 47001 Valladolid · Tel: 983 12 34 56 · info@terravall.com
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
          cadastral_reference: val.cadastral_reference || '',
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
            Módulo de Tasaciones y Valoraciones (ACM Advanced)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Calculador comparativo con coeficientes ECO, estudio de rentabilidad e informe técnico de tasación.
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
            Nueva Tasación
          </button>
          {currentValuation && (
            <button
              onClick={() => setActiveTab('resultado')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'resultado' ? 'bg-white text-primary font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className="text-primary" />
              Ver Tasación
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

          {/* Section 2: Ubicación y Registro */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              2. Ubicación y Datos Catastrales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Completa / Calle</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal</label>
                <input
                  type="text"
                  placeholder="47001"
                  value={zipcode}
                  onChange={e => setZipcode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Referencia Catastral (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. 1452001UM5015S0001WX"
                  value={cadastralReference}
                  onChange={e => setCadastralReference(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Datos Técnicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              3. Características Técnicas del Inmueble
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo Inmueble *</label>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Año Construcción</label>
                <input
                  type="number"
                  placeholder="2005"
                  value={yearBuilt}
                  onChange={e => setYearBuilt(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dormitorios</label>
                <input
                  type="number"
                  min={0}
                  value={rooms}
                  onChange={e => setRooms(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Baños / Aseos</label>
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
                  <option value="buen_estado">Buen estado (estándar)</option>
                  <option value="obra_nueva">Obra nueva / Reformado reciente</option>
                  <option value="a_reformar">A reformar totalmente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasElevator} onChange={e => setHasElevator(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Ascensor
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Garaje
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasTerrace} onChange={e => setHasTerrace(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Terraza
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasPool} onChange={e => setHasPool(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Piscina
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasStorage} onChange={e => setHasStorage(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Trastero
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={hasHeating} onChange={e => setHasHeating(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                Calefacción
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {loading ? 'Generando Tasación Exhaustiva e Informe IA...' : 'Generar Tasación Exhaustiva & Dictamen IA'}
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
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Valor Objetivo Adoptado</span>
              <div className="text-3xl font-black text-primary">{formatPrice(currentValuation.price_target)}</div>
              <p className="text-[11px] text-primary/80 font-medium">Precio recomendado ({currentValuation.price_per_m2} €/m²)</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Máximo de Salida</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_max)}</div>
              <p className="text-[11px] text-slate-500">Margen máximo de negociación</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimación Alquiler</span>
              <div className="text-2xl font-extrabold text-slate-900">{currentValuation.rent_target ? formatPrice(currentValuation.rent_target) : '-'} / mes</div>
              <p className="text-[11px] text-emerald-600 font-bold">Yield: {currentValuation.gross_yield || 5.4}% | PER: {currentValuation.per_years || 18.5} años</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileCheck2 className="text-primary" size={20} />
                Informe Técnico de Tasación Generado
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Puedes imprimir el documento oficial A4 de tasación o convertir la valoración en un inmueble del CRM.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handlePrintValuationReport(currentValuation)}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Printer size={16} className="text-primary" />
                Imprimir Tasación PDF (A4)
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

          {/* Coeffs & Witness Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Technical Coefficients */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <Layers size={16} className="text-primary" />
                Coeficientes Técnicos Aplicados
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Estado de conservación</span>
                  <span className="font-bold">{currentValuation.coefficients?.state && currentValuation.coefficients.state > 0 ? `+${currentValuation.coefficients.state}%` : `${currentValuation.coefficients?.state || 0}%`}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Ascensor</span>
                  <span className="font-bold">{currentValuation.has_elevator ? '+5%' : '0%'}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Plaza de garaje</span>
                  <span className="font-bold">{currentValuation.has_parking ? '+8%' : '0%'}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Terraza / Balcón</span>
                  <span className="font-bold">{currentValuation.has_terrace ? '+5%' : '0%'}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Piscina</span>
                  <span className="font-bold">{currentValuation.has_pool ? '+8%' : '0%'}</span>
                </li>
                <li className="flex justify-between pt-2 font-bold text-slate-900 text-sm">
                  <span>Multiplicador global</span>
                  <span className="text-primary">{currentValuation.coefficients?.totalMultiplier || 100}%</span>
                </li>
              </ul>
            </div>

            {/* Comparable Witness Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 size={16} className="text-primary" />
                Inmuebles Testigo Comparables en {currentValuation.city}
              </h4>
              {currentValuation.comparable_properties && currentValuation.comparable_properties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-2">Inmueble</th>
                        <th className="px-3 py-2">Superficie</th>
                        <th className="px-3 py-2">Precio Total</th>
                        <th className="px-3 py-2 text-right">€ / m²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentValuation.comparable_properties.map((comp: any, idx: number) => (
                        <tr key={comp.id || idx}>
                          <td className="px-3 py-2.5 font-semibold text-slate-900">{comp.title}</td>
                          <td className="px-3 py-2.5">{comp.area_built} m²</td>
                          <td className="px-3 py-2.5 font-bold text-slate-800">{formatPrice(comp.price)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-primary">
                            {Math.round(comp.price / (comp.area_built || 1))} €/m²
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                  Calculado mediante base de datos general de precios testigo en {currentValuation.city} ({currentValuation.price_per_m2} €/m² medio).
                </div>
              )}
            </div>
          </div>

          {/* AI Comprehensive Appraisal Report */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              Dictamen Técnico de Tasación Inmobiliaria (Informe IA)
            </h3>
            <div className="text-slate-700 leading-relaxed text-sm text-justify whitespace-pre-wrap bg-slate-50/70 p-6 rounded-xl border border-slate-150 font-serif">
              {currentValuation.ai_opinion}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Historial */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Historial de Tasaciones Realizadas</h3>
            <span className="text-xs text-slate-500 font-medium">{history.length} tasaciones en archivo</span>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400 text-xs">Cargando historial de tasaciones...</div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <FileText size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No hay tasaciones en archivo</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Crea una nueva tasación para empezar a registrar el historial.</p>
              <button
                onClick={() => setActiveTab('nueva')}
                className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl"
              >
                Nueva Tasación
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
                    <th className="px-6 py-3">Valor Objetivo</th>
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
                            title="Ver tasación"
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
                            title="Eliminar tasación"
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
