import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeXml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function formatKyeroType(type: string, subtype: string) {
  if (subtype === 'atico') return 'penthouse';
  if (subtype === 'duplex') return 'duplex';
  if (subtype === 'estudio') return 'studio';
  if (type === 'piso') return 'apartment';
  if (type === 'chalet') return 'villa';
  if (type === 'terreno') return 'land';
  if (type === 'local') return 'commercial';
  if (type === 'oficina') return 'office';
  if (type === 'nave') return 'industrial';
  return 'apartment';
}

Deno.serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Validación de seguridad por token para evitar scraping
  const urlObj = new URL(req.url)
  const token = urlObj.searchParams.get('token')
  const secretToken = Deno.env.get('FEED_SECRET_TOKEN') || 'terravall_secure_token_xml'

  if (token !== secretToken) {
    return new Response(
      `<?xml version="1.0" encoding="utf-8"?>
<error>
  <status>403</status>
  <message>Forbidden: Invalid or missing feed token.</message>
</error>`,
      {
        status: 403,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }

  try {
    // Inicializar Supabase usando las variables de entorno de la Edge Function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Consultar propiedades publicadas en Idealista
    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select(`
        *,
        property_media(id, url, sort_order)
      `)
      .eq('publish_idealista', true)
      .order('created_at', { ascending: false })

    if (propertiesError) throw propertiesError

    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`
    xml += `<root>\n`
    xml += `  <kyero>\n`
    xml += `    <feed_version>3</feed_version>\n`
    xml += `  </kyero>\n`

    for (const p of (properties || [])) {
      const isSale = p.operation === 'venta'
      const priceFreq = isSale ? 'sale' : 'month'
      const newBuild = p.condition === 'obra_nueva' ? 1 : 0
      const propertyType = formatKyeroType(p.type, p.subtype || '')
      
      const features = p.specific_features || {}
      const rooms = features.rooms || 0
      const baths = features.bathrooms || 0
      const hasPool = features.has_pool ? 1 : 0
      
      // Mapeo de certificados energéticos y de emisiones
      let energyCert = p.energy_certificate || 'X'
      if (energyCert === 'en_tramite') energyCert = 'X'
      if (energyCert === 'exento') energyCert = 'X'

      let emissionsCert = p.emissions_certificate || 'X'
      if (emissionsCert === 'en_tramite') emissionsCert = 'X'
      if (emissionsCert === 'exento') emissionsCert = 'X'

      // Formatear la fecha a YYYY-MM-DD HH:MM:SS
      const dateStr = new Date(p.updated_at).toISOString().replace('T', ' ').substring(0, 19)

      xml += `  <property>\n`
      xml += `    <id>${p.id}</id>\n`
      xml += `    <date>${dateStr}</date>\n`
      xml += `    <ref>${p.internal_reference || p.id.split('-')[0]}</ref>\n`
      xml += `    <price>${p.price}</price>\n`
      xml += `    <currency>EUR</currency>\n`
      xml += `    <price_freq>${priceFreq}</price_freq>\n`
      xml += `    <part_ownership>0</part_ownership>\n`
      xml += `    <leasehold>0</leasehold>\n`
      xml += `    <new_build>${newBuild}</new_build>\n`
      xml += `    <type>${propertyType}</type>\n`
      xml += `    <town>${escapeXml(p.city)}</town>\n`
      xml += `    <province>${escapeXml(p.province)}</province>\n`
      
      // Control de visibilidad de dirección
      if (p.visibility === 'exact') {
        let address = p.address_hidden || '';
        if (p.block_stairs) address += `, Esc. ${p.block_stairs}`;
        if (p.door) address += `, Puerta ${p.door}`;
        if (p.urbanization_name) address += ` (${p.urbanization_name})`;
        xml += `    <location_detail>${escapeXml(address)}</location_detail>\n`
      } else if (p.visibility === 'street_only') {
        xml += `    <location_detail>${escapeXml(p.address_public || p.address_hidden)}</location_detail>\n`
      }

      xml += `    <beds>${rooms}</beds>\n`
      xml += `    <baths>${baths}</baths>\n`
      xml += `    <pool>${hasPool}</pool>\n`
      
      xml += `    <surface_area>\n`
      xml += `      <built>${p.area_built}</built>\n`
      xml += `      <useful>${p.area_useful || p.area_built}</useful>\n`
      if (features.plot_area) {
        xml += `      <plot>${features.plot_area}</plot>\n`
      }
      xml += `    </surface_area>\n`
      
      xml += `    <energy_rating>\n`
      xml += `      <consumption>${energyCert}</consumption>\n`
      xml += `      <emissions>${emissionsCert}</emissions>\n`
      xml += `    </energy_rating>\n`
      
      xml += `    <desc>\n`
      xml += `      <es>${escapeXml(p.description)}</es>\n`
      xml += `    </desc>\n`

      // Construir la lista de características dinámicamente
      const featuresList: string[] = []

      // Características globales
      if (p.is_bank_owned) {
        featuresList.push('Procedente de banco')
      }
      if (p.is_top_floor) {
        featuresList.push('Última planta')
      }
      if (p.exceptional_situation && p.exceptional_situation !== 'ninguna') {
        const situationNames: Record<string, string> = {
          ocupada: 'Ocupada',
          alquilada: 'Alquilada',
          nuda_propiedad: 'Nuda propiedad'
        }
        featuresList.push(`Situación excepcional: ${situationNames[p.exceptional_situation] || p.exceptional_situation}`)
      }

      // Valores numéricos de energía/emisiones
      if (p.energy_consumption !== undefined && p.energy_consumption !== null) {
        featuresList.push(`Consumo energético: ${p.energy_consumption} kWh/m² año`)
      }
      if (p.emissions !== undefined && p.emissions !== null) {
        featuresList.push(`Emisiones CO2: ${p.emissions} kg CO2/m² año`)
      }

      // Características específicas de la propiedad
      if (features.has_elevator) featuresList.push('Ascensor')
      if (features.has_terrace) featuresList.push('Terraza')
      if (features.has_balcony) featuresList.push('Balcón')
      
      if (features.interior_exterior) {
        featuresList.push(features.interior_exterior === 'exterior' ? 'Exterior' : 'Interior')
      }
      
      if (Array.isArray(features.orientation)) {
        features.orientation.forEach((o: string) => {
          if (o) {
            featuresList.push(`Orientación: ${o.charAt(0).toUpperCase() + o.slice(1)}`)
          }
        })
      }
      
      if (features.built_in_wardrobes) featuresList.push('Armarios empotrados')
      if (features.air_conditioning) featuresList.push('Aire acondicionado')
      if (features.has_storage_room) featuresList.push('Trastero')
      if (features.has_garden) featuresList.push('Jardín')
      
      // Parking
      if (features.has_parking) {
        if (features.parking_included) {
          featuresList.push('Garaje incluido')
        } else {
          let parkingText = 'Garaje opcional'
          if (features.parking_price !== undefined && features.parking_price !== null) {
            parkingText += ` (${features.parking_price} €)`
          }
          featuresList.push(parkingText)
        }
      }

      // Accesibilidad
      if (features.accessible_exterior) featuresList.push('Acceso exterior adaptado')
      if (features.wheelchair_accessible) featuresList.push('Apto para personas con movilidad reducida')

      // Calefacción
      if (features.heating_type) {
        let heatingText = `Calefacción: ${features.heating_type}`
        if (features.heating_fuel) {
          heatingText += ` (${features.heating_fuel})`
        }
        featuresList.push(heatingText)
      } else if (features.heating_fuel) {
        featuresList.push(`Calefacción: ${features.heating_fuel}`)
      }

      // Año de construcción
      if (features.construction_year) {
        featuresList.push(`Año de construcción: ${features.construction_year}`)
      }

      // Tipo de jardín
      if (features.garden_type && features.garden_type !== 'ninguno') {
        featuresList.push(`Jardín ${features.garden_type}`)
      }

      // Plantas
      if (features.floors_count) {
        featuresList.push(`Plantas: ${features.floors_count}`)
      }

      // Características específicas de Naves
      if (features.activity) {
        const actNames: Record<string, string> = {
          almacen: 'Almacén / Archivo',
          industrial: 'Industrial',
          comercial: 'Comercial / Exposición',
          oficinas: 'Oficinas',
          otros: 'Otros'
        }
        featuresList.push(`Actividad principal: ${actNames[features.activity] || features.activity}`)
      }
      if (features.height_free) {
        featuresList.push(`Altura libre: ${features.height_free} m`)
      }
      if (features.loading_docks) {
        featuresList.push(`Muelles de carga: ${features.loading_docks}`)
      }
      if (features.cranes_count) {
        featuresList.push(`Puentes grúa: ${features.cranes_count}`)
      }
      if (features.has_heating) featuresList.push('Calefacción')
      if (features.has_air_conditioning) featuresList.push('Aire acondicionado')
      if (features.has_security_system) featuresList.push('Alarma / Seguridad')
      if (features.has_fire_system) featuresList.push('Protección contra incendios (BIES)')
      if (features.has_offices) featuresList.push('Oficinas integradas')

      // Escribir el nodo de features
      if (featuresList.length > 0) {
        xml += `    <features>\n`
        for (const feat of featuresList) {
          xml += `      <feature>${escapeXml(feat)}</feature>\n`
        }
        xml += `    </features>\n`
      }

      xml += `    <images>\n`
      if (p.property_media && p.property_media.length > 0) {
        let imageIndex = 1
        for (const media of p.property_media.sort((a: any, b: any) => a.sort_order - b.sort_order)) {
          xml += `      <image id="${imageIndex}">\n`
          xml += `        <url>${escapeXml(media.url)}</url>\n`
          xml += `      </image>\n`
          imageIndex++
        }
      }
      xml += `    </images>\n`

      xml += `  </property>\n`
    }

    xml += `</root>`

    return new Response(xml, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
