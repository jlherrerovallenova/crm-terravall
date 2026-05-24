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
  return 'apartment';
}

Deno.serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
      
      let energy = p.energy_certificate
      if (energy === 'en_tramite') energy = 'X'
      if (energy === 'exento') energy = 'X'

      // Formatear la fecha a YYYY-MM-DD HH:MM:SS
      const dateStr = new Date(p.updated_at).toISOString().replace('T', ' ').substring(0, 19)

      xml += `  <property>\n`
      xml += `    <id>${p.id}</id>\n`
      xml += `    <date>${dateStr}</date>\n`
      xml += `    <ref>${p.id.split('-')[0]}</ref>\n`
      xml += `    <price>${p.price}</price>\n`
      xml += `    <currency>EUR</currency>\n`
      xml += `    <price_freq>${priceFreq}</price_freq>\n`
      xml += `    <part_ownership>0</part_ownership>\n`
      xml += `    <leasehold>0</leasehold>\n`
      xml += `    <new_build>${newBuild}</new_build>\n`
      xml += `    <type>${propertyType}</type>\n`
      xml += `    <town>${escapeXml(p.city)}</town>\n`
      xml += `    <province>${escapeXml(p.province)}</province>\n`
      
      // Si está oculta, mandamos una ubicación aproximada o no la mandamos
      if (!p.hide_exact_address) {
        xml += `    <location_detail>${escapeXml(p.address_hidden)}</location_detail>\n`
      }

      xml += `    <beds>${rooms}</beds>\n`
      xml += `    <baths>${baths}</baths>\n`
      xml += `    <pool>${hasPool}</pool>\n`
      
      xml += `    <surface_area>\n`
      xml += `      <built>${p.area_built}</built>\n`
      xml += `      <useful>${p.area_useful}</useful>\n`
      xml += `    </surface_area>\n`
      
      xml += `    <energy_rating>\n`
      xml += `      <consumption>${energy}</consumption>\n`
      xml += `      <emissions>${energy}</emissions>\n`
      xml += `    </energy_rating>\n`
      
      xml += `    <desc>\n`
      xml += `      <es>${escapeXml(p.description)}</es>\n`
      xml += `    </desc>\n`

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
