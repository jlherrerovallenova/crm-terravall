/**
 * Catastro Service - Integración oficial con los Web Services de la Sede Electrónica del Catastro (España)
 */

export interface CatastroInfo {
  refCat: string;
  street: string;
  number: string;
  floorLetter: string;
  city: string;
  province: string;
  zipcode: string;
  areaBuilt?: number;
  yearBuilt?: number;
  use?: string;
  fullAddress: string;
  legalDescription: string;
}

/**
 * Consulta la Sede Electrónica del Catastro a partir de los 20 caracteres de la Referencia Catastral.
 */
export async function fetchCatastroData(refCatRaw: string): Promise<CatastroInfo | null> {
  const cleanRC = (refCatRaw || '').replace(/[\s\.-]/g, '').toUpperCase();
  if (!cleanRC || cleanRC.length < 14) {
    throw new Error('La Referencia Catastral debe tener entre 14 y 20 caracteres.');
  }

  // Endpoint oficial D.G. Catastro (España) - OVCSWLocalizacionRC
  const catastroEndpoint = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${encodeURIComponent(cleanRC)}`;

  let xmlText = '';
  
  // Intentar consulta directa y proxies CORS en cascada
  const urlsToTry = [
    catastroEndpoint,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(catastroEndpoint)}`,
    `https://corsproxy.io/?${encodeURIComponent(catastroEndpoint)}`,
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('<bico>') || text.includes('<lerr>') || text.includes('<consulta_dnp>'))) {
          xmlText = text;
          break;
        }
      }
    } catch {
      // Intentar siguiente proxy si hay restricción de origen o timeout
    }
  }

  if (!xmlText) {
    throw new Error('No se pudo establecer conexión con los servidores del Catastro. Revisa la Referencia Catastral o tu conexión a internet.');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Verificar si hay errores reportados por el Catastro (lerr)
  const errNode = xmlDoc.querySelector('lerr err des');
  if (errNode && errNode.textContent) {
    const errText = errNode.textContent.trim();
    if (errText.toLowerCase().includes('no encontrado') || errText.toLowerCase().includes('no está correctamente formada')) {
      throw new Error(`Catastro: No se encontró ningún inmueble para la Referencia Catastral "${cleanRC}". Revisa los 20 caracteres.`);
    }
    throw new Error(`Catastro: ${errText}`);
  }

  // Extraer datos del inmueble (<bico>)
  const bicoNode = xmlDoc.querySelector('bico');
  if (!bicoNode) {
    throw new Error(`No se halló información catastral para la referencia "${cleanRC}". Revisa los 20 caracteres.`);
  }

  // Dirección (<bi> -> <dt> -> <locs> -> <lourb> -> <dir>)
  const tv = xmlDoc.querySelector('tv')?.textContent?.trim() || xmlDoc.querySelector('bi ldp tv')?.textContent?.trim() || ''; // Tipo Vía
  const nv = xmlDoc.querySelector('nv')?.textContent?.trim() || xmlDoc.querySelector('bi ldp nv')?.textContent?.trim() || ''; // Nombre Vía
  const pno = xmlDoc.querySelector('pno')?.textContent?.trim() || xmlDoc.querySelector('bi ldp pno')?.textContent?.trim() || ''; // Número
  const esc = xmlDoc.querySelector('esc')?.textContent?.trim() || xmlDoc.querySelector('bi ldp esc')?.textContent?.trim() || ''; // Escalera
  const pt = xmlDoc.querySelector('pt')?.textContent?.trim() || xmlDoc.querySelector('bi ldp pt')?.textContent?.trim() || ''; // Planta
  const pu = xmlDoc.querySelector('pu')?.textContent?.trim() || xmlDoc.querySelector('bi ldp pu')?.textContent?.trim() || ''; // Puerta
  const nm = xmlDoc.querySelector('dt nm')?.textContent?.trim() || ''; // Municipio
  const np = xmlDoc.querySelector('dt np')?.textContent?.trim() || ''; // Provincia

  // Tipo de Vía en texto amigable
  const tvMap: Record<string, string> = {
    CL: 'Calle',
    AV: 'Avenida',
    PL: 'Plaza',
    PZ: 'Plaza',
    PS: 'Paseo',
    CR: 'Carretera',
    CM: 'Camino',
    TR: 'Travesía',
    RD: 'Ronda',
    GL: 'Glorieta',
    UR: 'Urbanización',
    PQ: 'Parque',
  };
  const streetType = tvMap[tv.toUpperCase()] || tv;
  const formattedStreet = streetType ? `${streetType} ${toTitleCase(nv)}` : toTitleCase(nv);

  // Piso / Letra / Escalera
  const floorParts: string[] = [];
  if (esc) floorParts.push(`Esc. ${esc}`);
  if (pt) floorParts.push(`Pl. ${pt}`);
  if (pu) floorParts.push(`Pta. ${pu}`);
  const floorLetter = floorParts.join(' ');

  // Municipio y Provincia
  const city = toTitleCase(nm);
  const province = toTitleCase(np);

  // Superficie y año (<bi> -> <debi>)
  const sfcStr = xmlDoc.querySelector('bi debi sfc')?.textContent?.trim() || xmlDoc.querySelector('sfc')?.textContent?.trim();
  const areaBuilt = sfcStr ? parseInt(sfcStr, 10) : undefined;

  const antStr = xmlDoc.querySelector('bi debi ant')?.textContent?.trim() || xmlDoc.querySelector('ant')?.textContent?.trim();
  const yearBuilt = antStr ? parseInt(antStr, 10) : undefined;

  // Uso principal (<bi> -> <debi> -> <luso>)
  const luso = xmlDoc.querySelector('bi debi luso')?.textContent?.trim()?.toUpperCase() || '';
  let use = 'VIVIENDA';
  if (luso.includes('RESIDENCIAL') || luso.includes('VIVIENDA')) use = 'VIVIENDA';
  else if (luso.includes('ALMACEN') || luso.includes('ESTACIONAMIENTO') || luso.includes('GARAJE')) use = 'GARAJE / ANEXO';
  else if (luso.includes('COMERCIAL') || luso.includes('LOCAL')) use = 'LOCAL COMERCIAL';
  else if (luso.includes('OFICINA')) use = 'OFICINA';
  else if (luso.includes('INDUSTRIAL')) use = 'NAVE INDUSTRIAL';

  // Construcción de dirección completa y descripción legal
  const fullAddrParts = [formattedStreet, pno ? `nº ${pno}` : '', floorLetter, city, province].filter(Boolean);
  const fullAddress = fullAddrParts.join(', ');

  const descParts: string[] = [
    `${use.toUpperCase()} sita en ${formattedStreet}${pno ? ` nº ${pno}` : ''}${floorLetter ? `, ${floorLetter}` : ''} de ${city} (${province}).`,
  ];
  if (areaBuilt) descParts.push(`Superficie construida según Catastro: ${areaBuilt} m².`);
  if (yearBuilt) descParts.push(`Año de construcción: ${yearBuilt}.`);
  descParts.push(`Ref. Catastral: ${cleanRC}.`);

  return {
    refCat: cleanRC,
    street: formattedStreet,
    number: pno,
    floorLetter,
    city,
    province,
    zipcode: '',
    areaBuilt,
    yearBuilt,
    use,
    fullAddress,
    legalDescription: descParts.join(' '),
  };
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
