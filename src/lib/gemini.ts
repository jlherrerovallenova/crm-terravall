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

  // 3. Make HTTP request to Google Gemini API (gemini-1.5-flash)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
