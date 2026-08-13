/**
 * Generador de Feeds XML para portales inmobiliarios (Kyero v3, Idealista, Fotocasa)
 * CRM TERRAVALL
 */

export interface PropertyXMLData {
  id: string;
  internal_reference?: string;
  type: string;
  subtype?: string;
  operation: string;
  price: number;
  address_hidden?: string;
  address_public?: string;
  city: string;
  province: string;
  zipcode: string;
  area_built: number;
  area_useful?: number;
  condition: string;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  publish_web?: boolean;
  publish_idealista?: boolean;
  publish_fotocasa?: boolean;
  energy_certificate?: string;
  emissions_certificate?: string;
  specific_features?: any;
  property_media?: { url: string }[];
}

/**
 * Escapa caracteres especiales para CDATA o texto XML seguro
 */
function escapeXmlText(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Mapea el tipo de propiedad interna al estándar inglés de Kyero
 */
function mapKyeroPropertyType(type: string): string {
  const map: Record<string, string> = {
    piso: 'apartment',
    chalet: 'house',
    local: 'commercial',
    oficina: 'office',
    terreno: 'land',
    nave: 'industrial'
  };
  return map[type] || 'apartment';
}

/**
 * Mapea el tipo de propiedad interna al estándar de Idealista
 */
function mapIdealistaPropertyType(type: string): string {
  const map: Record<string, string> = {
    piso: 'flat',
    chalet: 'chalet',
    local: 'commercial',
    oficina: 'office',
    terreno: 'land',
    nave: 'industrial'
  };
  return map[type] || 'flat';
}

/**
 * Genera un Feed XML en formato estándar Kyero V3 (Compatible universalmente con Idealista, Fotocasa, Kyero, etc.)
 */
export function generateKyeroXmlFeed(properties: PropertyXMLData[], targetPortal: 'all' | 'idealista' | 'fotocasa' | 'web' = 'all'): string {
  const filtered = properties.filter(p => {
    if (targetPortal === 'idealista') return p.publish_idealista;
    if (targetPortal === 'fotocasa') return p.publish_fotocasa;
    if (targetPortal === 'web') return p.publish_web;
    return p.publish_idealista || p.publish_fotocasa || p.publish_web;
  });

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<root>\n`;
  xml += `  <kyero>\n`;
  xml += `    <feed_version>3</feed_version>\n`;
  xml += `  </kyero>\n`;

  filtered.forEach(p => {
    const ref = p.internal_reference || `TRV-${p.id.substring(0, 6).toUpperCase()}`;
    const kyeroType = mapKyeroPropertyType(p.type);
    const dateStr = p.updated_at ? p.updated_at.substring(0, 10) : now.substring(0, 10);
    const feats = p.specific_features || {};

    xml += `  <property>\n`;
    xml += `    <id>${escapeXmlText(ref)}</id>\n`;
    xml += `    <date>${dateStr}</date>\n`;
    xml += `    <ref>${escapeXmlText(ref)}</ref>\n`;
    xml += `    <price>${p.price || 0}</price>\n`;
    xml += `    <currency>EUR</currency>\n`;
    xml += `    <price_freq>${p.operation === 'alquiler' ? 'month' : 'sale'}</price_freq>\n`;
    
    xml += `    <type>\n`;
    xml += `      <en>${kyeroType}</en>\n`;
    xml += `      <es>${escapeXmlText(p.type)}</es>\n`;
    xml += `    </type>\n`;

    xml += `    <town>${escapeXmlText(p.city)}</town>\n`;
    xml += `    <province>${escapeXmlText(p.province)}</province>\n`;
    
    if (p.address_public || p.address_hidden) {
      xml += `    <location>\n`;
      xml += `      <address>${escapeXmlText(p.address_public || p.address_hidden)}</address>\n`;
      xml += `      <postal_code>${escapeXmlText(p.zipcode)}</postal_code>\n`;
      xml += `    </location>\n`;
    }

    if (feats.rooms) xml += `    <beds>${feats.rooms}</beds>\n`;
    if (feats.bathrooms) xml += `    <baths>${feats.bathrooms}</baths>\n`;

    xml += `    <surface_area>\n`;
    xml += `      <built>${p.area_built || 0}</built>\n`;
    if (p.area_useful) xml += `      <useful>${p.area_useful}</useful>\n`;
    if (feats.plot_area) xml += `      <plot>${feats.plot_area}</plot>\n`;
    xml += `    </surface_area>\n`;

    if (p.energy_certificate) {
      xml += `    <energy_rating>\n`;
      xml += `      <consumption>${escapeXmlText(p.energy_certificate)}</consumption>\n`;
      if (p.emissions_certificate) {
        xml += `      <emissions>${escapeXmlText(p.emissions_certificate)}</emissions>\n`;
      }
      xml += `    </energy_rating>\n`;
    }

    xml += `    <title>\n`;
    xml += `      <es><![CDATA[${p.title}]]></es>\n`;
    xml += `    </title>\n`;

    xml += `    <desc>\n`;
    xml += `      <es><![CDATA[${p.description}]]></es>\n`;
    xml += `    </desc>\n`;

    // Medios / Fotos
    if (p.property_media && p.property_media.length > 0) {
      xml += `    <images>\n`;
      p.property_media.forEach((m, idx) => {
        xml += `      <image id="${idx + 1}">\n`;
        xml += `        <url>${escapeXmlText(m.url)}</url>\n`;
        xml += `      </image>\n`;
      });
      xml += `    </images>\n`;
    }

    // Características destacadas
    const featureList: string[] = [];
    if (feats.has_elevator) featureList.push('Ascensor');
    if (feats.has_terrace) featureList.push('Terraza');
    if (feats.has_balcony) featureList.push('Balcón');
    if (feats.has_parking) featureList.push('Garaje');
    if (feats.has_storage_room) featureList.push('Trastero');
    if (feats.has_pool) featureList.push('Piscina');
    if (feats.air_conditioning) featureList.push('Aire acondicionado');
    if (feats.built_in_wardrobes) featureList.push('Armarios empotrados');

    if (featureList.length > 0) {
      xml += `    <features>\n`;
      featureList.forEach(f => {
        xml += `      <feature>${escapeXmlText(f)}</feature>\n`;
      });
      xml += `    </features>\n`;
    }

    xml += `  </property>\n`;
  });

  xml += `</root>`;
  return xml;
}

/**
 * Genera un Feed XML con estructura nativa de Idealista
 */
export function generateIdealistaXmlFeed(properties: PropertyXMLData[]): string {
  const filtered = properties.filter(p => p.publish_idealista);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<idealista>\n`;
  xml += `  <customerCode>TERRAVALL</customerCode>\n`;
  xml += `  <customerName>TERRAVALL INMOBILIARIA</customerName>\n`;

  filtered.forEach(p => {
    const ref = p.internal_reference || `TRV-${p.id.substring(0, 6).toUpperCase()}`;
    const idealistaType = mapIdealistaPropertyType(p.type);
    const feats = p.specific_features || {};

    xml += `  <property>\n`;
    xml += `    <propertyCode>${escapeXmlText(ref)}</propertyCode>\n`;
    xml += `    <propertyType>${idealistaType}</propertyType>\n`;
    xml += `    <operation>${p.operation === 'alquiler' ? 'rent' : 'sale'}</operation>\n`;
    xml += `    <price>${p.price}</price>\n`;
    
    xml += `    <address>\n`;
    xml += `      <streetName>${escapeXmlText(p.address_public || p.address_hidden)}</streetName>\n`;
    xml += `      <municipality>${escapeXmlText(p.city)}</municipality>\n`;
    xml += `      <province>${escapeXmlText(p.province)}</province>\n`;
    xml += `      <postalCode>${escapeXmlText(p.zipcode)}</postalCode>\n`;
    xml += `    </address>\n`;

    xml += `    <features>\n`;
    xml += `      <size>${p.area_built}</size>\n`;
    if (feats.rooms) xml += `      <rooms>${feats.rooms}</rooms>\n`;
    if (feats.bathrooms) xml += `      <bathrooms>${feats.bathrooms}</bathrooms>\n`;
    if (feats.floor !== undefined) xml += `      <floor>${feats.floor}</floor>\n`;
    if (feats.has_elevator !== undefined) xml += `      <hasLift>${feats.has_elevator}</hasLift>\n`;
    if (feats.has_terrace !== undefined) xml += `      <terrace>${feats.has_terrace}</terrace>\n`;
    if (feats.has_parking !== undefined) xml += `      <parkingIncluded>${feats.has_parking}</parkingIncluded>\n`;
    xml += `    </features>\n`;

    xml += `    <descriptions>\n`;
    xml += `      <description language="spanish"><![CDATA[${p.title}\n\n${p.description}]]></description>\n`;
    xml += `    </descriptions>\n`;

    if (p.property_media && p.property_media.length > 0) {
      xml += `    <images>\n`;
      p.property_media.forEach(m => {
        xml += `      <image>\n`;
        xml += `        <url>${escapeXmlText(m.url)}</url>\n`;
        xml += `      </image>\n`;
      });
      xml += `    </images>\n`;
    }

    xml += `  </property>\n`;
  });

  xml += `</idealista>`;
  return xml;
}

/**
 * Descarga el contenido XML como archivo local en el navegador
 */
export function downloadXmlFile(xmlContent: string, fileName: string = 'feed_terravall.xml') {
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
