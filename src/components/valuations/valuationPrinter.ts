import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import { formatPrice } from '@/lib/utils';
import type { ValuationData, WitnessProperty } from './types';

export const handlePrintValuationReport = (val: ValuationData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const dateFormatted = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  const comparables = val.comparable_properties || [];

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
        .footer { font-size: 9px; color: #94a3b8; text-align: center; margin-top: 25px; }
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
