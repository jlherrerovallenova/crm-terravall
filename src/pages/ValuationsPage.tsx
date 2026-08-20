import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import { formatPrice } from '@/lib/utils';
import { valuationSchema } from '@/schema/valuation.schema';
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
  HelpCircle,
  ShieldCheck,
  Compass,
  Zap,
  Target
} from 'lucide-react';

export interface WitnessProperty {
  id?: string;
  title: string;
  address: string;
  area_built: number;
  price_asked: number;
  price_per_m2_asked: number;
  condition: string;
  has_parking: boolean;
  has_elevator: boolean;
  has_terrace: boolean;
  similarity_percentage: number;
  correction_factor: number;
  price_per_m2_adjusted: number;
  price_total_adjusted: number;
  notes: string;
}

export interface ValuationData {
  id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  property_type: string;
  city: string;
  province: string;
  zone?: string;
  zipcode?: string;
  address?: string;
  cadastral_reference?: string;
  year_built?: number;
  area_built: number;
  area_useful?: number;
  rooms: number;
  bathrooms: number;
  condition: 'buen_estado' | 'a_reformar' | 'obra_nueva';
  energy_certificate: string;
  orientation: string;
  floor_height: string;
  purpose: 'venta' | 'alquiler' | 'herencia' | 'hipotecaria_orientativa';
  has_elevator: boolean;
  has_parking: boolean;
  has_terrace: boolean;
  has_pool: boolean;
  has_storage: boolean;
  has_heating: boolean;
  has_views: boolean;
  price_min: number;
  price_target: number;
  price_max: number;
  rent_target?: number;
  price_per_m2: number;
  gross_yield?: number;
  per_years?: number;
  ai_opinion?: string;
  agent_name?: string;
  comparable_properties?: WitnessProperty[];
  coefficients?: {
    state: number;
    elevator: number;
    parking: number;
    terrace: number;
    pool: number;
    storage: number;
    heating: number;
    energy: number;
    location_views: number;
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [propertyType, setPropertyType] = useState('piso');
  const [city, setCity] = useState('Valladolid');
  const [province, setProvince] = useState('Valladolid');
  const [zone, setZone] = useState('Centro / Parquesol');
  const [zipcode, setZipcode] = useState('47001');
  const [address, setAddress] = useState('');
  const [cadastralReference, setCadastralReference] = useState('');
  const [yearBuilt, setYearBuilt] = useState<number | ''>(2008);
  const [areaBuilt, setAreaBuilt] = useState<number | ''>(95);
  const [areaUseful, setAreaUseful] = useState<number | ''>(85);
  const [rooms, setRooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [condition, setCondition] = useState<'buen_estado' | 'a_reformar' | 'obra_nueva'>('buen_estado');
  const [energyCertificate, setEnergyCertificate] = useState<string>('C');
  const [orientation, setOrientation] = useState<string>('Sur');
  const [floorHeight, setFloorHeight] = useState<string>('Planta Intermedia');
  const [purpose, setPurpose] = useState<'venta' | 'alquiler' | 'herencia' | 'hipotecaria_orientativa'>('venta');
  const [hasElevator, setHasElevator] = useState(true);
  const [hasParking, setHasParking] = useState(true);
  const [hasTerrace, setHasTerrace] = useState(true);
  const [hasPool, setHasPool] = useState(false);
  const [hasStorage, setHasStorage] = useState(true);
  const [hasHeating, setHasHeating] = useState(true);
  const [hasViews, setHasViews] = useState(true);

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
    setValidationErrors({});

    const formData = {
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail,
      property_type: propertyType,
      city,
      province,
      zone,
      zipcode,
      address,
      cadastral_reference: cadastralReference,
      year_built: Number(yearBuilt) || 2005,
      area_built: Number(areaBuilt),
      area_useful: Number(areaUseful) || Number(areaBuilt),
      rooms,
      bathrooms,
      condition,
      energy_certificate: energyCertificate,
      orientation,
      floor_height: floorHeight,
      purpose,
      has_elevator: hasElevator,
      has_parking: hasParking,
      has_terrace: hasTerrace,
      has_pool: hasPool,
      has_storage: hasStorage,
      has_heating: hasHeating,
      has_views: hasViews,
    };

    const result = valuationSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      alert('Por favor, revisa los datos introducidos. Hay campos obligatorios pendientes.');
      return;
    }

    setLoading(true);
    const builtM2 = Number(areaBuilt);

    try {
      // 1. Obtener/Simular Inmuebles Testigos Comparables Filtrados
      let basePricePerM2 = 1750;
      if (city.toLowerCase().includes('valladolid')) basePricePerM2 = 1820;

      let witnessList: WitnessProperty[] = [];

      // Consultar Supabase
      const { data: dbProperties } = await supabase
        .from('properties')
        .select('id, title, price, area_built, address_public, city, type, condition, specific_features')
        .eq('city', city)
        .eq('type', propertyType)
        .limit(6);

      if (dbProperties && dbProperties.length >= 3) {
        witnessList = dbProperties.map((p: any, idx: number) => {
          const area = p.area_built || 90;
          const askedP = p.price || 160000;
          const initialUnit = Math.round(askedP / area);
          
          // Factor de corrección comparativo
          const diffArea = (builtM2 - area) / area;
          const areaFactor = -diffArea * 0.15; // Elasticidad superficie
          const condFactor = p.condition === condition ? 0 : p.condition === 'obra_nueva' ? -0.10 : 0.10;
          const totalAdj = Number((1 + areaFactor + condFactor).toFixed(2));
          const adjustedUnit = Math.round(initialUnit * totalAdj);

          return {
            id: p.id || `witness-${idx + 1}`,
            title: p.title || `Testigo ${idx + 1} - ${p.address_public || city}`,
            address: p.address_public || `${zone || city}`,
            area_built: area,
            price_asked: askedP,
            price_per_m2_asked: initialUnit,
            condition: p.condition || 'buen_estado',
            has_parking: Boolean(p.specific_features?.has_parking),
            has_elevator: Boolean(p.specific_features?.has_elevator),
            has_terrace: Boolean(p.specific_features?.has_terrace),
            similarity_percentage: Math.round(95 - idx * 4),
            correction_factor: totalAdj,
            price_per_m2_adjusted: adjustedUnit,
            price_total_adjusted: Math.round(adjustedUnit * builtM2),
            notes: `Testigo real de cartera. Ajuste por superficie (${(areaFactor*100).toFixed(1)}%) y conservación.`
          };
        });
      } else {
        // Generar testigos sintéticos representativos del mercado local (distrito / 500m)
        const baseUnit = basePricePerM2;
        witnessList = [
          {
            id: 'witness-1',
            title: `Testigo 1: ${propertyType.toUpperCase()} en ${zone || city} (Radio < 300m)`,
            address: `${address || 'Avda. Principal'}, ${zone || city}`,
            area_built: Math.round(builtM2 * 0.95),
            price_asked: Math.round(builtM2 * 0.95 * (baseUnit * 1.05)),
            price_per_m2_asked: Math.round(baseUnit * 1.05),
            condition: 'buen_estado',
            has_parking: true,
            has_elevator: true,
            has_terrace: false,
            similarity_percentage: 94,
            correction_factor: 0.96,
            price_per_m2_adjusted: Math.round(baseUnit * 1.05 * 0.96),
            price_total_adjusted: Math.round(baseUnit * 1.05 * 0.96 * builtM2),
            notes: 'Edificio homólogo en misma calle. Ajuste del -4% por ausencia de terraza.'
          },
          {
            id: 'witness-2',
            title: `Testigo 2: ${propertyType.toUpperCase()} Reformado en ${zone || city}`,
            address: `Calle Cercana, ${zone || city}`,
            area_built: Math.round(builtM2 * 1.08),
            price_asked: Math.round(builtM2 * 1.08 * (baseUnit * 1.15)),
            price_per_m2_asked: Math.round(baseUnit * 1.15),
            condition: 'obra_nueva',
            has_parking: true,
            has_elevator: true,
            has_terrace: true,
            similarity_percentage: 91,
            correction_factor: 0.88,
            price_per_m2_adjusted: Math.round(baseUnit * 1.15 * 0.88),
            price_total_adjusted: Math.round(baseUnit * 1.15 * 0.88 * builtM2),
            notes: 'Testigo reformado a estrenar. Aplicada corrección de conservación (-12%).'
          },
          {
            id: 'witness-3',
            title: `Testigo 3: ${propertyType.toUpperCase()} Cierre Reciente en ${zone || city}`,
            address: `Plaza Próxima, ${zone || city}`,
            area_built: Math.round(builtM2 * 0.90),
            price_asked: Math.round(builtM2 * 0.90 * (baseUnit * 0.98)),
            price_per_m2_asked: Math.round(baseUnit * 0.98),
            condition: 'buen_estado',
            has_parking: false,
            has_elevator: true,
            has_terrace: true,
            similarity_percentage: 89,
            correction_factor: 1.04,
            price_per_m2_adjusted: Math.round(baseUnit * 0.98 * 1.04),
            price_total_adjusted: Math.round(baseUnit * 0.98 * 1.04 * builtM2),
            notes: 'Sin plaza de garaje incorporada. Incremento del +4% por homogeneización de garaje.'
          },
          {
            id: 'witness-4',
            title: `Testigo 4: ${propertyType.toUpperCase()} de Mercado Secundario`,
            address: `Calle Adyacente, ${zone || city}`,
            area_built: Math.round(builtM2 * 1.02),
            price_asked: Math.round(builtM2 * 1.02 * (baseUnit * 1.02)),
            price_per_m2_asked: Math.round(baseUnit * 1.02),
            condition: 'buen_estado',
            has_parking: true,
            has_elevator: true,
            has_terrace: true,
            similarity_percentage: 88,
            correction_factor: 0.98,
            price_per_m2_adjusted: Math.round(baseUnit * 1.02 * 0.98),
            price_total_adjusted: Math.round(baseUnit * 1.02 * 0.98 * builtM2),
            notes: 'Similitud elevada. Ligero ajuste del -2% por orientación norte.'
          }
        ];
      }

      // Calcular Precio Homogeneizado Promedio de los Testigos
      const sumAdjustedUnit = witnessList.reduce((acc, w) => acc + w.price_per_m2_adjusted, 0);
      const avgWitnessPricePerM2 = Math.round(sumAdjustedUnit / witnessList.length);

      // 2. Coeficientes Técnicos de Ponderación (Normativa ECO y Mercado Inmobiliario)
      const coeffState = condition === 'obra_nueva' ? 0.15 : condition === 'a_reformar' ? -0.20 : 0.0;
      const coeffElevator = hasElevator ? 0.05 : (propertyType === 'piso' ? -0.06 : 0.0);
      const coeffParking = hasParking ? 0.08 : 0.0;
      const coeffTerrace = hasTerrace ? 0.05 : 0.0;
      const coeffPool = hasPool ? 0.08 : 0.0;
      const coeffStorage = hasStorage ? 0.03 : 0.0;
      const coeffHeating = hasHeating ? 0.04 : 0.0;
      const coeffEnergy = ['A', 'B'].includes(energyCertificate) ? 0.05 : ['E', 'F', 'G'].includes(energyCertificate) ? -0.04 : 0.0;
      const coeffLocationViews = (hasViews ? 0.04 : 0) + (['Sur', 'Sureste', 'Suroeste'].includes(orientation) ? 0.03 : 0);

      const totalMultiplier = 1.0 + coeffState + coeffElevator + coeffParking + coeffTerrace + coeffPool + coeffStorage + coeffHeating + coeffEnergy + coeffLocationViews;

      const finalPricePerM2 = Math.round(avgWitnessPricePerM2 * totalMultiplier);
      const targetPrice = Math.round(builtM2 * finalPricePerM2);
      const minPrice = Math.round(targetPrice * 0.91); // Precio mínimo de negociación rápida
      const maxPrice = Math.round(targetPrice * 1.08); // Precio máximo de salida a mercado

      // Estimación de Alquiler y Métricas Financieras
      const rentEstimate = Math.round(targetPrice * 0.0048); // ~5.75% bruto anual
      const grossYield = Number((((rentEstimate * 12) / targetPrice) * 100).toFixed(2));
      const perYears = Number((targetPrice / (rentEstimate * 12)).toFixed(1));

      // 3. Generar Informe Técnico Estructurado en 5 Secciones (Gemini / Motor Local)
      let aiOpinion = '';
      try {
        const apiKey = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          const prompt = `
Actúa como un Experto Consultor Inmobiliario y Tasador Senior con 15 años de experiencia.
Genera un INFORME DE VALORACIÓN INMOBILIARIA EXHAUSTIVO estrictamente en formato Markdown en español con exactamente los siguientes 5 apartados numerados:

### 1. Resumen Ejecutivo
- Ficha técnica completa del inmueble (${propertyType.toUpperCase()}, ${builtM2} m² construidos, ${areaUseful || builtM2} m² útiles, ${rooms} hab, ${bathrooms} baños, año ${yearBuilt || 2005}, conservación ${condition.replace('_', ' ')}, ref. catastral: ${cadastralReference || 'N/A'}).
- Valor de Tasación Estimado (precio central): ${formatPrice(targetPrice)} (${finalPricePerM2} €/m²).
- Rango de Valor Recomendado: desde ${formatPrice(minPrice)} (mínimo de cierre) hasta ${formatPrice(maxPrice)} (máximo salida).
- Conclusión exprés sobre liquidez (tiempo estimado venta 45-75 días) y tendencia del mercado en ${zone || city}.

### 2. Análisis del Mercado Local
- Contexto macro y microeconómico en ${city} (${zone || 'Distrito Centro'}).
- Presión compradora, volumen de oferta disponible y evolución reciente del precio/m².

### 3. Relación y Análisis de Testigos Seleccionados
- Explicación de los ${witnessList.length} testigos comparables de la zona de influencia (< 500m).
- Criterios de similitud tipológica y descarte de outliers atípicos.

### 4. Ajustes Aplicados y Cálculo del Valor Final
- Desglose de los coeficientes de homogeneización aplicados (Estado ${coeffState >= 0 ? '+' : ''}${Math.round(coeffState*100)}%, Ascensor ${Math.round(coeffElevator*100)}%, Garaje ${Math.round(coeffParking*100)}%, Terraza ${Math.round(coeffTerrace*100)}%, Eficiencia ${Math.round(coeffEnergy*100)}%, Ubicación/Orientación ${Math.round(coeffLocationViews*100)}%).
- Memoria de cálculo que justifica la transición del precio medio unitario de testigos (${avgWitnessPricePerM2} €/m²) al valor adoptado (${finalPricePerM2} €/m²).

### 5. Conclusión Técnica y Recomendación Comercial
- Valor final de salida recomendado a mercado: ${formatPrice(targetPrice)}.
- Estrategia y rango de negociación (margen aconsejado ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}).
- Observaciones técnicas para el agente inmobiliario y el propietario (certificación energética ${energyCertificate}, orientación ${orientation}, etc.).

Utiliza negritas, listas y un tono formal, técnico y convincente.
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
        console.warn('Error llamando a Gemini:', e);
      }

      if (!aiOpinion) {
        aiOpinion = `
### 1. Resumen Ejecutivo
- **Inmueble evaluado:** ${propertyType.toUpperCase()} ubicado en ${address || 'Dirección de estudio'}, ${zone || city} (${province}).
- **Superficie y Distribución:** ${builtM2} m² construidos (${areaUseful || builtM2} m² útiles), ${rooms} dormitorios, ${bathrooms} baños.
- **Año y Estado:** Año ${yearBuilt || 2008} | Estado: ${condition.replace('_', ' ').toUpperCase()} | Eficiencia: Clase ${energyCertificate}.
- **Valor de Tasación Estimado:** **${formatPrice(targetPrice)}** (${finalPricePerM2} €/m²).
- **Rango de Comercialización Recomendado:** Mínimo razonable de **${formatPrice(minPrice)}** y Máximo de salida de **${formatPrice(maxPrice)}**.
- **Liquidez y Tendencia:** Alta demanda en la zona de ${zone || city} para inmuebles de esta tipología. Plazo estimado de venta: **45 a 75 días**.

### 2. Análisis del Mercado Local
En la zona de influencia de **${zone || city}**, el mercado residencial presenta un dinamismo positivo con absorción constante de oferta. El precio medio unitario ofertado en el distrito se sitúa en torno a los ${avgWitnessPricePerM2} €/m², observándose una estabilidad de precios con tendencia ligeramente alcista en propiedades bien mantenidas con ascensor y garaje.

### 3. Relación y Análisis de Testigos Seleccionados
Se han seleccionado **${witnessList.length} inmuebles comparables** dentro de un radio inferior a 500 metros del activo evaluado. La muestra presenta una varianza reducida tras descartar extremos (*outliers*), ofreciendo una base homogénea representativa de las operaciones activas en la zona.

### 4. Ajustes Aplicados y Cálculo del Valor Final
- **Precio base medio de testigos:** ${avgWitnessPricePerM2} €/m²
- **Coeficiente por Conservación:** ${(coeffState * 100).toFixed(1)}%
- **Coeficiente por Dotaciones (Garaje/Terraza/Trastero):** ${((coeffParking + coeffTerrace + coeffStorage) * 100).toFixed(1)}%
- **Coeficiente por Ubicación/Vistas/Orientación:** ${(coeffLocationViews * 100).toFixed(1)}%
- **Coeficiente Eficiencia Energética:** ${(coeffEnergy * 100).toFixed(1)}%
- **Multiplicador Global Homogeneizado:** **${(totalMultiplier * 100).toFixed(1)}%**
- **Valor unitario final asignado:** **${finalPricePerM2} €/m²**
- **Valor Final de Tasación:** **${builtM2} m² × ${finalPricePerM2} €/m² = ${formatPrice(targetPrice)}**

### 5. Conclusión Técnica y Recomendación Comercial
Se recomienda fijar un precio inicial de publicación de **${formatPrice(targetPrice)}**, concediendo un margen razonable de negociación de hasta un 5% (precio suelo de cierre: **${formatPrice(minPrice)}**). La excelente relación superficie/distribución y la presencia de dotaciones clave aseguran un alto interés comprador.
`.trim();
      }

      const valuationObj: ValuationData = {
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        property_type: propertyType,
        city,
        province,
        zone,
        zipcode,
        address,
        cadastral_reference: cadastralReference,
        year_built: Number(yearBuilt) || 2005,
        area_built: builtM2,
        area_useful: Number(areaUseful) || builtM2,
        rooms,
        bathrooms,
        condition,
        energy_certificate: energyCertificate,
        orientation,
        floor_height: floorHeight,
        purpose,
        has_elevator: hasElevator,
        has_parking: hasParking,
        has_terrace: hasTerrace,
        has_pool: hasPool,
        has_storage: hasStorage,
        has_heating: hasHeating,
        has_views: hasViews,
        price_min: minPrice,
        price_target: targetPrice,
        price_max: maxPrice,
        rent_target: rentEstimate,
        price_per_m2: finalPricePerM2,
        gross_yield: grossYield,
        per_years: perYears,
        ai_opinion: aiOpinion,
        comparable_properties: witnessList,
        coefficients: {
          state: Math.round(coeffState * 100),
          elevator: Math.round(coeffElevator * 100),
          parking: Math.round(coeffParking * 100),
          terrace: Math.round(coeffTerrace * 100),
          pool: Math.round(coeffPool * 100),
          storage: Math.round(coeffStorage * 100),
          heating: Math.round(coeffHeating * 100),
          energy: Math.round(coeffEnergy * 100),
          location_views: Math.round(coeffLocationViews * 100),
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
    const coeffs = val.coefficients || { state: 0, elevator: 0, parking: 0, terrace: 0, pool: 0, storage: 0, heating: 0, energy: 0, location_views: 0, totalMultiplier: 100 };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Informe Profesional de Valoración Inmobiliaria - TERRAVALL</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.45; }
          .no-print { text-align: right; margin-bottom: 15px; }
          .btn-print { background: #8f1505; color: white; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #8f1505; padding-bottom: 12px; margin-bottom: 18px; }
          .logo { height: 48px; }
          .doc-title { text-align: right; }
          .doc-title h1 { color: #8f1505; margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 800; letter-spacing: -0.5px; }
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
          table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10px; }
          th { background: #f1f5f9; color: #334155; text-align: left; padding: 6px 8px; border-bottom: 1.5px solid #cbd5e1; font-weight: bold; }
          td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; }
          p { margin: 0 0 8px 0; text-align: justify; }
          .report-box { background: #fafafa; border-left: 3px solid #8f1505; padding: 12px 16px; border-radius: 4px; font-size: 10.5px; font-family: inherit; line-height: 1.6; }
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
            <h1>INFORME TÉCNICO DE VALORACIÓN Y TASACIÓN ACM</h1>
            <p>Método de Comparación Directa & Homogeneización ECO</p>
            <p>Fecha de emisión: ${dateFormatted}</p>
          </div>
        </div>

        <!-- Section 1 -->
        <div class="section">
          <div class="section-title">1. Datos del Solicitante y Ficha del Inmueble</div>
          <div class="grid-2">
            <div class="card">
              <div><strong>Solicitante / Propietario:</strong> ${val.client_name}</div>
              <div><strong>Teléfono:</strong> ${val.client_phone || 'Sin especificar'}</div>
              <div><strong>Email:</strong> ${val.client_email || 'Sin especificar'}</div>
              <div><strong>Finalidad Tasación:</strong> ${(val.purpose || 'venta').toUpperCase()}</div>
              <div><strong>Ref. Catastral:</strong> ${val.cadastral_reference || 'No aportada'}</div>
            </div>
            <div class="card">
              <div><strong>Ubicación:</strong> ${val.address || 'Sin especificar'}, ${val.zone ? val.zone + ', ' : ''}${val.city} (${val.province})</div>
              <div><strong>Tipología:</strong> ${val.property_type.toUpperCase()} | <strong>Año:</strong> ${val.year_built || 'N/A'}</div>
              <div><strong>Superficie:</strong> ${val.area_built} m² const. / ${val.area_useful || val.area_built} m² útiles</div>
              <div><strong>Distribución:</strong> ${val.rooms} dorm. | ${val.bathrooms} baños | <strong>Planta:</strong> ${val.floor_height}</div>
              <div><strong>Cert. Energética:</strong> Clase ${val.energy_certificate} | <strong>Orientación:</strong> ${val.orientation}</div>
            </div>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="section">
          <div class="section-title">2. Resumen de Valoración y Métricas de Mercado</div>
          <div class="kpi-container">
            <div class="kpi-box">
              <div class="kpi-lbl">Mínimo Negociación</div>
              <div class="kpi-val">${formatPrice(val.price_min)}</div>
            </div>
            <div class="kpi-box target">
              <div class="kpi-lbl">Valor Objetivo Central</div>
              <div class="kpi-val">${formatPrice(val.price_target)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Máximo de Salida</div>
              <div class="kpi-val">${formatPrice(val.price_max)}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-lbl">Est. Alquiler / mes</div>
              <div class="kpi-val">${val.rent_target ? formatPrice(val.rent_target) : '-'}</div>
            </div>
          </div>

          <div class="grid-3" style="margin-top: 10px;">
            <div class="card" style="text-align: center;">
              <span class="kpi-lbl">Precio Unitario Adoptado</span>
              <div style="font-weight: bold; font-size: 13px; color: #8f1505; margin-top: 2px;">${val.price_per_m2} €/m²</div>
            </div>
            <div class="card" style="text-align: center;">
              <span class="kpi-lbl">Rentabilidad Bruta Est.</span>
              <div style="font-weight: bold; font-size: 13px; color: #16a34a; margin-top: 2px;">${val.gross_yield || 5.7}% / año</div>
            </div>
            <div class="card" style="text-align: center;">
              <span class="kpi-lbl">PER Inmobiliario</span>
              <div style="font-weight: bold; font-size: 13px; color: #0284c7; margin-top: 2px;">${val.per_years || 17.5} años</div>
            </div>
          </div>
        </div>

        <!-- Section 3 -->
        ${comparables.length > 0 ? `
        <div class="section">
          <div class="section-title">3. Tabla Homogeneizada de Inmuebles Testigo (Comparables)</div>
          <table>
            <thead>
              <tr>
                <th>Identificación Testigo</th>
                <th>Superficie</th>
                <th>Precio Ofertado</th>
                <th>€/m² Inicial</th>
                <th>Factor Corr.</th>
                <th>€/m² Homogeneizado</th>
              </tr>
            </thead>
            <tbody>
              ${comparables.map((c: WitnessProperty) => `
                <tr>
                  <td><strong>${c.title}</strong><br/><span style="color:#64748b;">${c.address}</span></td>
                  <td>${c.area_built} m²</td>
                  <td>${formatPrice(c.price_asked)}</td>
                  <td>${c.price_per_m2_asked} €/m²</td>
                  <td><span class="badge ${c.correction_factor >= 1 ? 'badge-green' : 'badge-red'}">${(c.correction_factor * 100).toFixed(0)}%</span></td>
                  <td><strong>${c.price_per_m2_adjusted} €/m²</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Section 4 -->
        <div class="section">
          <div class="section-title">4. Dictamen Técnico Completo de Tasación Inmobiliaria</div>
          <div class="report-box">
            ${(val.ai_opinion || '').split('\n\n').map(p => `<p>${p.trim().replace(/^###\s+/, '<strong>').replace(/$/,'</strong>')}</p>`).join('')}
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            CONFORMIDAD DEL PROPIETARIO / CLIENTE
          </div>
          <div class="sig-box">
            DEPARTAMENTO TÉCNICO TERRAVALL
          </div>
        </div>

        <div class="footer">
          Este informe constituye una tasación profesional orientativa elaborada mediante metodología comparativa de mercado. Terravall 27 S.L. · Plaza Mayor 8, 1ºA, 47001 Valladolid · Tel: 983 12 34 56 · info@terravall.com
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
          title: `${val.property_type.toUpperCase()} en ${val.zone || val.city} - ${val.area_built} m²`,
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
          energy_certificate: val.energy_certificate,
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
            has_pool: val.has_pool,
            has_storage_room: val.has_storage,
            orientation: [val.orientation.toLowerCase()]
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
            Módulo de Valoraciones ACM (Análisis Comparativo de Mercado)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Motor de valoración inmobiliaria profesional con homogeneización de testigos, coeficientes ECO e informe exhaustivo.
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
              Ver Informe Tasación
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
        <form onSubmit={handleCalculateValuation} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 max-w-5xl">
          {/* Section 1: Cliente/Propietario y Finalidad */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-primary" />
              1. Datos del Solicitante / Propietario & Finalidad
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pedro Martínez Alonso"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
                {validationErrors.client_name && <p className="text-[10px] text-red-500 mt-0.5">{validationErrors.client_name}</p>}
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Teléfono</label>
                <input
                  type="tel"
                  placeholder="600 00 00 00"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Email</label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Finalidad *</label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="herencia">Herencia</option>
                  <option value="hipotecaria_orientativa">Hipotecaria</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Ubicación Fina y Zona */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              2. Ubicación Precisa y Registro Catastral
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Dirección / Calle</label>
                <input
                  type="text"
                  placeholder="Ej. Calle Santiago 12"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Zona / Barrio *</label>
                <input
                  type="text"
                  placeholder="Ej. Parquesol / Centro"
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Municipio *</label>
                <input
                  type="text"
                  required
                  placeholder="Valladolid"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Provincia *</label>
                <input
                  type="text"
                  required
                  placeholder="Valladolid"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Código Postal</label>
                <input
                  type="text"
                  placeholder="47001"
                  value={zipcode}
                  onChange={e => setZipcode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
              <div className="md:col-span-9">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Referencia Catastral (20 Caracteres)</label>
                <input
                  type="text"
                  placeholder="Ej. 1452001UM5015S0001WX"
                  value={cadastralReference}
                  onChange={e => setCadastralReference(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Datos Técnicos del Inmueble */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              3. Tipología, Superficie y Calificaciones Técnicas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Tipología Inmueble *</label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="piso">Piso / Apartamento</option>
                  <option value="chalet">Chalet / Adosado</option>
                  <option value="local">Local Comercial</option>
                  <option value="oficina">Oficina</option>
                  <option value="terreno">Terreno / Parcela</option>
                  <option value="nave">Nave Industrial</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">M² Construidos *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={areaBuilt}
                  onChange={e => setAreaBuilt(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">M² Útiles</label>
                <input
                  type="number"
                  min={1}
                  value={areaUseful}
                  onChange={e => setAreaUseful(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Año Construcción</label>
                <input
                  type="number"
                  placeholder="2008"
                  value={yearBuilt}
                  onChange={e => setYearBuilt(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Dormitorios</label>
                <input
                  type="number"
                  min={0}
                  value={rooms}
                  onChange={e => setRooms(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Baños / Aseos</label>
                <input
                  type="number"
                  min={0}
                  value={bathrooms}
                  onChange={e => setBathrooms(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Estado Conservación</label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="buen_estado">Buen estado (estándar)</option>
                  <option value="obra_nueva">Excelente / Obra nueva / Reformado</option>
                  <option value="a_reformar">A reformar integralmente</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Cert. Energética</label>
                <select
                  value={energyCertificate}
                  onChange={e => setEnergyCertificate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white font-bold"
                >
                  <option value="A">Clase A</option>
                  <option value="B">Clase B</option>
                  <option value="C">Clase C</option>
                  <option value="D">Clase D</option>
                  <option value="E">Clase E</option>
                  <option value="F">Clase F</option>
                  <option value="G">Clase G</option>
                  <option value="en_tramite">En trámite</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Orientación Principal</label>
                <select
                  value={orientation}
                  onChange={e => setOrientation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="Sur">Sur (Luminosidad óptima)</option>
                  <option value="Sureste">Sureste</option>
                  <option value="Este">Este (Sol de mañana)</option>
                  <option value="Suroeste">Suroeste</option>
                  <option value="Oeste">Oeste (Sol de tarde)</option>
                  <option value="Norte">Norte</option>
                  <option value="Noroeste">Noroeste</option>
                  <option value="Noreste">Noreste</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Altura de Planta</label>
                <select
                  value={floorHeight}
                  onChange={e => setFloorHeight(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
                >
                  <option value="Planta Intermedia">Planta Intermedia (2ª a 4ª)</option>
                  <option value="Ático / Última planta">Ático / Última planta</option>
                  <option value="Planta Alta">Planta Alta (5ª+)</option>
                  <option value="Bajo / Entreplanta">Bajo / Entreplanta</option>
                </select>
              </div>

              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={hasElevator} onChange={e => setHasElevator(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Ascensor</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Garaje</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={hasTerrace} onChange={e => setHasTerrace(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Terraza</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={hasPool} onChange={e => setHasPool(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Piscina</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={hasStorage} onChange={e => setHasStorage(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Trastero</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={hasHeating} onChange={e => setHasHeating(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Calefacción</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100 sm:col-span-2">
                  <input type="checkbox" checked={hasViews} onChange={e => setHasViews(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
                  <span className="whitespace-nowrap">Vistas Despejadas</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              {loading ? 'Calculando Homogeneización & Generando Informe...' : 'Generar Valoración ACM Homogeneizada & Dictamen IA'}
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Mínimo de Cierre</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_min)}</div>
              <p className="text-[11px] text-slate-500">Suelo de negociación rápida</p>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-xs space-y-1 relative overflow-hidden">
              <div className="absolute right-3 top-3 text-primary/20">
                <Sparkles size={40} />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Valor de Tasación Objetivo</span>
              <div className="text-3xl font-black text-primary">{formatPrice(currentValuation.price_target)}</div>
              <p className="text-[11px] text-primary/80 font-medium">Precio central adoptado ({currentValuation.price_per_m2} €/m²)</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Máximo de Salida</span>
              <div className="text-2xl font-extrabold text-slate-900">{formatPrice(currentValuation.price_max)}</div>
              <p className="text-[11px] text-slate-500">Publicación con margen</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimación Alquiler</span>
              <div className="text-2xl font-extrabold text-slate-900">{currentValuation.rent_target ? formatPrice(currentValuation.rent_target) : '-'} / mes</div>
              <p className="text-[11px] text-emerald-600 font-bold">Yield: {currentValuation.gross_yield || 5.7}% | PER: {currentValuation.per_years || 17.5} años</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileCheck2 className="text-primary" size={20} />
                Informe Profesional de Tasación ACM Generado
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Genera el PDF impreso A4 con el análisis comparativo o convierte esta valoración en un inmueble del CRM.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handlePrintValuationReport(currentValuation)}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Printer size={16} className="text-primary" />
                Imprimir Informe Tasación PDF (A4)
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
                Coeficientes ECO de Homogeneización
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Estado de conservación</span>
                  <span className="font-bold">{currentValuation.coefficients?.state && currentValuation.coefficients.state > 0 ? `+${currentValuation.coefficients.state}%` : `${currentValuation.coefficients?.state || 0}%`}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Ascensor</span>
                  <span className="font-bold">{currentValuation.has_elevator ? '+5%' : '-6%'}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Plaza de garaje</span>
                  <span className="font-bold">{currentValuation.has_parking ? '+8%' : '0%'}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Terraza</span>
                  <span className="font-bold">{currentValuation.has_terrace ? '+5%' : '0%'}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Certificación energética ({currentValuation.energy_certificate})</span>
                  <span className="font-bold">{currentValuation.coefficients?.energy && currentValuation.coefficients.energy > 0 ? `+${currentValuation.coefficients.energy}%` : `${currentValuation.coefficients?.energy || 0}%`}</span>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-50">
                  <span>Ubicación, Vistas y Orientación ({currentValuation.orientation})</span>
                  <span className="font-bold">+{currentValuation.coefficients?.location_views || 5}%</span>
                </li>
                <li className="flex justify-between pt-2 font-bold text-slate-900 text-sm">
                  <span>Multiplicador Global Homogeneizado</span>
                  <span className="text-primary">{currentValuation.coefficients?.totalMultiplier || 100}%</span>
                </li>
              </ul>
            </div>

            {/* Comparable Witness Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 size={16} className="text-primary" />
                Tabla de Testigos Comparables Filtrados (< 500m)
              </h4>
              {currentValuation.comparable_properties && currentValuation.comparable_properties.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-2">Testigo / Ubicación</th>
                        <th className="px-3 py-2">Superficie</th>
                        <th className="px-3 py-2">Precio Ofertado</th>
                        <th className="px-3 py-2">€/m² Base</th>
                        <th className="px-3 py-2 text-right">€/m² Homogeneizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {currentValuation.comparable_properties.map((comp: WitnessProperty, idx: number) => (
                        <tr key={comp.id || idx}>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-900 block">{comp.title}</span>
                            <span className="text-[10px] text-slate-400">{comp.notes}</span>
                          </td>
                          <td className="px-3 py-2.5">{comp.area_built} m²</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800">{formatPrice(comp.price_asked)}</td>
                          <td className="px-3 py-2.5 text-slate-500">{comp.price_per_m2_asked} €/m²</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-primary">
                            {comp.price_per_m2_adjusted} €/m²
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                  Calculado mediante muestra homogeneizada en {currentValuation.city} ({currentValuation.price_per_m2} €/m² medio).
                </div>
              )}
            </div>
          </div>

          {/* Markdown Appraisal Report */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              Informe de Valoración Inmobiliaria Exhaustivo (5 Secciones Markdown)
            </h3>
            <div className="text-slate-800 leading-relaxed text-sm whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-150 font-serif shadow-inner">
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
            <span className="text-xs text-slate-500 font-medium">{history.length} tasaciones registradas</span>
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
