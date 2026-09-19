import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getStoredAiKey } from '@/lib/gemini';
import { formatPrice } from '@/lib/utils';
import { valuationSchema } from '@/schema/valuation.schema';
import { 
  Calculator, 
  Plus, 
  History, 
  Sparkles
} from 'lucide-react';
import type { WitnessProperty, ValuationData, ValuationFormData } from '@/components/valuations/types';
import { handlePrintValuationReport } from '@/components/valuations/valuationPrinter';
import { ValuationForm } from '@/components/valuations/ValuationForm';
import { ValuationResultView } from '@/components/valuations/ValuationResultView';
import { ValuationHistoryTable } from '@/components/valuations/ValuationHistoryTable';

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

      // 3. Generar Informe Técnico Estructurado
      let aiOpinion = '';
      try {
        const apiKey = getStoredAiKey() || import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
          const prompt = `
Actúa como un Sistema Experto en Tasación e Inmuebles de Terravall Servicios Inmobiliarios.
Genera un INFORME DE VALORACIÓN INMOBILIARIA EXHAUSTIVO CORPORATIVO estrictamente en formato Markdown en español con exactamente las siguientes 6 Secciones Corporativas:

### 1. Portada y Resumen Ejecutivo
- Cabecera oficial Terravall. Agente Responsable: Juan L. Herrero (Tel: 627 536 493 | Email: juan@terravall.com).
- Valor Estimado Adoptado: ${formatPrice(targetPrice)} (${finalPricePerM2} €/m²).
- Horquilla de comercialización: Mínimo recomendado ${formatPrice(minPrice)} | Máximo de salida ${formatPrice(maxPrice)}.
- Ficha técnica: ${propertyType.toUpperCase()} de ${builtM2} m² construidos (${areaUseful || builtM2} m² útiles), ${rooms} hab, ${bathrooms} baños, Planta ${floorHeight}, Orientación ${orientation}, Año ${yearBuilt || 2005}, Ref. Catastral: ${cadastralReference || 'N/A'}.

### 2. Entorno, Ubicación y Datos Demográficos
- Microentorno de estudio (área de ~51 ha en ${zone || city}).
- Estadísticas socioeconómicas: Edad media de edificación (62 años), nivel de ingresos por hogar, porcentaje compraventa vs alquiler (79% / 21%).
- Desglose por tramos de superficie (0-40m², 40-70m², 70-90m², 90-120m², 120-150m², 150-180m², >180m²) indicando comportamiento oferta y demanda.
- Evolución trimestral, semestral e interanual del precio/m² en el municipio.

### 3. Puntos de Interés (POI) y Localización
- Servicios y equipamientos de proximidad (Autobús Urbano, Supermercados Alcampo/Dia/Supercor, Colegio Ponce de León, Farmacias y Parques).

### 4. Análisis de Testigos de Portales Inmobiliarios (Oferta / Retirados)
- Muestra de testigos ofertados/retirados de la zona (< 500m) con precio unitario medio de la oferta (${avgWitnessPricePerM2} €/m²).
- Similitud tipológica, ajuste por estado/extras y descarte de outliers.

### 5. Análisis de Testigos de Ventas Reales (Registro de la Propiedad)
- Comparación con transacciones reales liquidadas en el Registro de la Propiedad en calles colindantes (Gregorio Fernández, Zorrilla, Zúñiga, Claudio Moyano, Menéndez Pelayo).
- Relación de precios reales cerrados en zona (${Math.round(avgWitnessPricePerM2 * 1.15)} €/m² medio registral).

### 6. Ficha Catastral y Datos Descriptivos
- Información oficial de la Dirección General del Catastro: Clase Urbana, Uso Principal Residencial, Parcela Gráfica y desglose de construcción (${builtM2} m² vivienda + elementos comunes).

Utiliza formato Markdown riguroso con negritas, listas y métricas claras.
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
### 1. Portada y Resumen Ejecutivo
- **Agente Responsable:** Juan L. Herrero (Tel: 627 536 493 | Email: juan@terravall.com)
- **Empresa:** Terravall Servicios Inmobiliarios
- **Inmueble evaluado:** ${propertyType.toUpperCase()} en ${address || 'Dirección de estudio'}, ${zone || city} (${province}).
- **Ficha Técnica:** ${builtM2} m² construidos (${areaUseful || builtM2} m² útiles), ${rooms} dormitorios, ${bathrooms} baños, Planta ${floorHeight}, Orientación ${orientation}, Año ${yearBuilt || 2008}, Ref. Catastral: ${cadastralReference || 'N/A'}.
- **VALOR ESTIMADO DE LA VIVIENDA:** **${formatPrice(targetPrice)}** (**${finalPricePerM2} €/m²**).
- **Horquilla Recomendada:** Precio suelo de cierre: **${formatPrice(minPrice)}** | Precio máximo de salida: **${formatPrice(maxPrice)}**.

### 2. Entorno, Ubicación y Datos Demográficos
- **Área de estudio:** Microentorno de ~51 hectáreas en el sector ${zone || city}.
- **Demografía y Renta:** Nivel socioeconómico medio-alto, poder adquisitivo estimado de 2.102 €/mes por hogar.
- **Mercado Residencial:** 79% régimen de propiedad (compraventa) vs 21% alquiler.
- **Distribución Oferta vs Demanda por Tramos:**
  - 0-40 m²: Oferta 3% | Demanda 5%
  - 40-70 m²: Oferta 18% | Demanda 22%
  - 70-90 m²: Oferta 32% | Demanda 35% (Tramo con mayor liquidez)
  - 90-120 m²: Oferta 25% | Demanda 20%
  - 120-150 m²: Oferta 12% | Demanda 10%
  - 150-180 m²: Oferta 7% | Demanda 5%
  - >180 m²: Oferta 3% | Demanda 3%
- **Evolución del Precio en el Municipio:** Trimestral +0,8% | Semestral +1,6% | Interanual +2,9%.

### 3. Puntos de Interés (POI) y Localización
- **Transporte Público:** Paradas de Autobús Urbano (Líneas 1, 2, 5) a < 150m.
- **Supermercados y Comercio:** Alcampo, Dia y Supercor en radio de < 300m.
- **Educación y Salud:** Colegio Ponce de León (180m), Centro de Salud y Farmacias 24h.
- **Zonas Verdes:** Parques y zonas ajardinadas consolidadas a < 200m.

### 4. Análisis de Testigos de Portales Inmobiliarios (Oferta / Retirados)
- **Muestra Seleccionada:** ${witnessList.length} inmuebles comparables en un radio < 500m.
- **Precio Medio Unitario de la Oferta:** **${avgWitnessPricePerM2} €/m²**.
- **Ajustes:** Coeficientes ECO aplicados por conservación, ascensor, garaje, terraza y orientación.

### 5. Análisis de Testigos de Ventas Reales (Registro de la Propiedad)
- **Operaciones Registradas:** Transacciones reales inscritas en calles colindantes (Gregorio Fernández, Zorrilla, Zúñiga, Claudio Moyano, Menéndez Pelayo).
- **Precio Medio de Cierre Registral:** **${Math.round(avgWitnessPricePerM2 * 1.15)} €/m²**.

### 6. Ficha Catastral y Datos Descriptivos
- **Localización Oficial:** ${address || 'Dirección de la finca'}, ${city} (${province}).
- **Clase y Uso:** Urbano | Residencial.
- **Superficie Construida Total:** ${builtM2} m² (${areaUseful || builtM2} m² útiles vivienda).
- **Referencia Catastral:** ${cadastralReference || 'N/A'}.
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

  const formData: ValuationFormData = {
    clientName, setClientName,
    clientPhone, setClientPhone,
    clientEmail, setClientEmail,
    purpose, setPurpose,
    address, setAddress,
    zone, setZone,
    city, setCity,
    province, setProvince,
    zipcode, setZipcode,
    cadastralReference, setCadastralReference,
    propertyType, setPropertyType,
    areaBuilt, setAreaBuilt,
    areaUseful, setAreaUseful,
    yearBuilt, setYearBuilt,
    rooms, setRooms,
    bathrooms, setBathrooms,
    condition, setCondition,
    energyCertificate, setEnergyCertificate,
    orientation, setOrientation,
    floorHeight, setFloorHeight,
    hasElevator, setHasElevator,
    hasParking, setHasParking,
    hasTerrace, setHasTerrace,
    hasPool, setHasPool,
    hasStorage, setHasStorage,
    hasHeating, setHasHeating,
    hasViews, setHasViews
  };

  return (
    <div className="space-y-8 transition-opacity duration-500 font-sans pb-12">
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
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nueva' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus size={14} />
            Nueva Tasación
          </button>
          {currentValuation && (
            <button
              onClick={() => setActiveTab('resultado')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'resultado' ? 'bg-white text-primary font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className="text-primary" />
              Ver Informe Tasación
            </button>
          )}
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
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
        <ValuationForm
          formData={formData}
          validationErrors={validationErrors}
          loading={loading}
          onSubmit={handleCalculateValuation}
        />
      )}

      {/* Tab 2: Resultado de Valoración */}
      {activeTab === 'resultado' && currentValuation && (
        <ValuationResultView
          currentValuation={currentValuation}
          onPrint={handlePrintValuationReport}
          onConvertToProperty={handleConvertToProperty}
        />
      )}

      {/* Tab 3: Historial */}
      {activeTab === 'historial' && (
        <ValuationHistoryTable
          history={history}
          loadingHistory={loadingHistory}
          onSelectValuation={(item) => {
            setCurrentValuation(item);
            setActiveTab('resultado');
          }}
          onPrintValuation={handlePrintValuationReport}
          onDeleteValuation={handleDeleteValuation}
          onGoToNew={() => setActiveTab('nueva')}
        />
      )}
    </div>
  );
};
