/**
 * Service to call Google Gemini API for real estate description generation.
 */
export async function generatePropertyDescription(data: any): Promise<string> {
  // 1. Get API Key from localStorage or environment variables
  const localStorageKey = localStorage.getItem('gemini_api_key');
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiKey = localStorageKey || envKey;

  if (!apiKey) {
    throw new Error(
      "No se ha configurado la API Key de Gemini. Por favor, configúrala en el panel de Configuración del CRM o en el archivo .env.local como VITE_GEMINI_API_KEY."
    );
  }

  // 2. Prepare the real estate copywriting prompt
  const typeMap: Record<string, string> = {
    piso: 'Piso / Apartamento',
    chalet: 'Chalet / Casa',
    local: 'Local Comercial',
    oficina: 'Oficina',
    terreno: 'Terreno',
    nave: 'Nave Industrial'
  };

  const operationMap: Record<string, string> = {
    venta: 'Venta',
    alquiler: 'Alquiler',
    traspaso: 'Traspaso'
  };

  const conditionMap: Record<string, string> = {
    buen_estado: 'Buen estado',
    a_reformar: 'A reformar / Para actualizar',
    obra_nueva: 'Obra nueva'
  };

  const propertyType = typeMap[data.type] || data.type;
  const operation = operationMap[data.operation] || data.operation;
  const condition = conditionMap[data.condition] || data.condition;

  const prompt = `
Actúa como un redactor profesional y experto en marketing inmobiliario.
Genera una descripción comercial y técnica muy atractiva para publicar en portales inmobiliarios (como Idealista o Fotocasa) e internet basándote en los siguientes datos del inmueble:

- Tipo de inmueble: ${propertyType} ${data.subtype ? `(${data.subtype})` : ''}
- Operación: ${operation}
- Precio: ${data.price} €
- Ubicación pública: ${data.address_public}, ${data.city} (${data.province})
- Superficie construida: ${data.area_built} m²
- Superficie útil: ${data.area_useful || data.area_built} m²
- Estado de conservación: ${condition}
- Certificado energético: Consumo ${data.energy_certificate}, Emisiones ${data.emissions_certificate}
- Características específicas: ${JSON.stringify(data.specific_features || {})}

Instrucciones de redacción:
1. El tono debe ser profesional, sugerente, elegante y persuasivo. Evita clichés exagerados. Resalta la luminosidad, amplitud, distribución y el valor real de su ubicación.
2. Comienza con un título comercial en mayúsculas o frase de enganche potente que destaque el tipo de inmueble y la zona.
3. Describe detalladamente la distribución y características técnicas, de forma estructurada e interesante.
4. Si tiene características como garaje, piscina, terraza, muelles de carga y grúas (en caso de naves), o salida de humos (en locales), destácalas positivamente.
5. Finaliza con una llamada a la acción clara para agendar una visita o solicitar más información con Terravall.
6. Escribe la descripción completa en español, con excelente ortografía y redactada en varios párrafos separados por saltos de línea dobles.
7. Devuelve ÚNICAMENTE el texto de la descripción generada. No incluyas notas de introducción ni comentarios sobre lo que has escrito.
`;

  // 3. Make HTTP request to Google Gemini API via local Vite proxy to avoid CORS issues
  const url = `/api-gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error del servidor de Gemini (${response.status})`;
    throw new Error(`Error en la llamada a Gemini: ${message}`);
  }

  const result = await response.json();
  const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("La API de Gemini devolvió una respuesta vacía o con formato inesperado.");
  }

  return generatedText.trim();
}

export async function lookupZipcodeByGemini(address: string, city: string, province: string): Promise<string> {
  const localStorageKey = localStorage.getItem('gemini_api_key');
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiKey = localStorageKey || envKey;

  if (!apiKey) {
    throw new Error(
      "No se ha configurado la API Key de Gemini. Por favor, configúrala en el panel de Configuración del CRM o en el archivo .env.local como VITE_GEMINI_API_KEY."
    );
  }

  const prompt = `
Dada la siguiente dirección en España:
- Calle/Dirección: ${address}
- Municipio: ${city}
- Provincia: ${province}

Responde ÚNICAMENTE con el código postal de 5 dígitos correspondiente. No incluyas explicaciones, ni texto adicional, ni puntos. Solo los 5 números del código postal.
Si hay varias opciones o no estás seguro, responde con el código postal más aproximado para esa calle y municipio.
`;

  const url = `/api-gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error del servidor de Gemini (${response.status})`;
    throw new Error(`Error en la llamada a Gemini: ${message}`);
  }

  const result = await response.json();
  const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("Respuesta vacía de Gemini.");
  }

  const match = generatedText.trim().match(/\b\d{5}\b/);
  if (match) {
    return match[0];
  }

  throw new Error("No se pudo determinar el código postal.");
}

export async function fetchZipcode(street: string, city: string, province: string): Promise<string> {
  const cleanStreet = (street || '').trim();
  const cleanCity = (city || '').trim();
  const cleanProvince = (province || '').trim();

  if (!cleanCity && !cleanStreet) return '';

  // 1. Intentar con Gemini AI para código postal exacto a nivel de calle
  try {
    const cp = await lookupZipcodeByGemini(cleanStreet, cleanCity, cleanProvince);
    if (cp && /^\d{5}$/.test(cp)) {
      return cp;
    }
  } catch (e) {
    // Si la API key no está configurada o hay error de red, usamos el diccionario alternativo
  }

  // 2. Diccionario alternativo de Códigos Postales por Municipio
  const cityLower = cleanCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const cityZipcodes: Record<string, string> = {
    'laguna de duero': '47140',
    'arroyo de la encomienda': '47195',
    'la cisterniga': '47193',
    'cisterniga': '47193',
    'simancas': '47130',
    'zaratan': '47610',
    'medina del campo': '47400',
    'tordesillas': '47100',
    'tudela de duero': '47300',
    'cigales': '47270',
    'boecillo': '47151',
    'santovenia de pisuerga': '47155',
    'cabezon de pisuerga': '47260',
    'penafiel': '47300',
    'medina de rioseco': '47800',
    'aldemayor de san martin': '47162',
    'alderamayor de san martin': '47162',
    'viana de cega': '47150',
    'renedo de esgueva': '47170',
    'portillo': '47160',
    'olmedo': '47410',
    'iscar': '47420',
    'pedrajas de san esteban': '47430',
    'nava del rey': '47500',
    'mojados': '47260',
    'valladolid': '47001',
    'madrid': '28001',
    'barcelona': '08001',
    'sevilla': '41001',
    'valencia': '46001',
    'malaga': '29001',
    'salamanca': '37001',
    'palencia': '34001',
    'zamora': '49001',
    'segovia': '40001',
    'leon': '24001',
    'soria': '42001',
    'burgos': '09001',
    'avila': '05001'
  };

  if (cityLower in cityZipcodes) {
    return cityZipcodes[cityLower];
  }

  return '';
}
