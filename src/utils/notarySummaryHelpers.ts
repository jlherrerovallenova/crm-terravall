import type { NotarySummaryData, NotarySummaryFinca } from '@/types/notarySummary.types';

const euroWithCentsFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrencyWithCents = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '0,00 €';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return '0,00 €';
  return euroWithCentsFormatter.format(num);
};

export const buildInitialNotarySummaryData = (propertyData?: any): NotarySummaryData => {
  if (propertyData?.notary_summary_data) {
    return propertyData.notary_summary_data as NotarySummaryData;
  }
  if (propertyData?.arras_contract_data?.notary_summary_data) {
    return propertyData.arras_contract_data.notary_summary_data as NotarySummaryData;
  }

  const arras = propertyData?.arras_contract_data || {};
  const rawFincas = propertyData?.fincas_data || arras.fincas || [];

  const parsedFincas: NotarySummaryFinca[] = [];
  if (Array.isArray(rawFincas) && rawFincas.length > 0) {
    rawFincas.forEach((f: any, idx: number) => {
      const title = f.title || (idx === 0 ? 'Vivienda' : `Elemento ${idx + 1}`);
      const regNum = f.registryNumber || '';
      const regCity = f.registryCity || propertyData?.city || 'Valladolid';
      const regOffice = f.registryOfficeNumber ? ` Nº ${f.registryOfficeNumber}` : '';
      const cru = f.cru ? ` (CRU: ${f.cru})` : '';

      let regDesc = '';
      if (regNum) {
        regDesc = `Inscrita en el Registro de la Propiedad de ${regCity}${regOffice}. Finca número ${regNum}${cru}.`;
      } else if (f.propertyDescription) {
        regDesc = f.propertyDescription;
      } else {
        regDesc = `Inscripción registral en trámite de ${regCity}.`;
      }

      const price = Number(f.priceAmount) || (idx === 0 ? Number(propertyData?.price) || 0 : 0);

      parsedFincas.push({
        id: f.id || `finca-${idx + 1}`,
        label: title,
        registryDescription: regDesc,
        price,
      });
    });
  } else {
    const regNum = arras.registryNumber || propertyData?.registry_number || '';
    const regCity = arras.registryCity || propertyData?.registry_city || propertyData?.city || 'Valladolid';
    parsedFincas.push({
      id: 'finca-default-1',
      label: 'Vivienda',
      registryDescription: regNum
        ? `Inscrita en el Registro de la Propiedad de ${regCity}. Finca número ${regNum}.`
        : `Inscrita en el Registro de la Propiedad de ${regCity}. Finca pendiente de asignación.`,
      price: Number(propertyData?.price) || 0,
    });
  }

  const street = propertyData?.address_hidden || propertyData?.address_street || propertyData?.title || 'Inmueble';
  const city = propertyData?.city || 'Valladolid';
  const elementsNames = parsedFincas.map(f => f.label.toUpperCase()).join(' Y ');
  const autoTitle = `COMPRAVENTA DE ${elementsNames || 'LA VIVIENDA'} EN ${street.toUpperCase()} (${city.toUpperCase()})`;

  const buyer1Name = arras.buyer1Name || propertyData?.buyer1_name || propertyData?.buyers_data?.[0]?.name || '';
  const buyer2Name = arras.hasBuyer2 && arras.buyer2Name ? ` / ${arras.buyer2Name}` : '';
  const buyersString = `${buyer1Name}${buyer2Name}`.trim() || 'Parte compradora';

  const totalPrice = Number(arras.totalPriceNum) || Number(propertyData?.price) || 0;
  const arrasAmount = Number(arras.arrasAmountNum) || Number(propertyData?.arras_amount_num) || Math.min(totalPrice * 0.1, 10000);
  const remainingAmount = Number(arras.remainingAmountNum) || Math.max(0, totalPrice - arrasAmount);

  return {
    signingDate: arras.notaryDeadline ? `Hasta el ${arras.notaryDeadline}` : 'Pendiente de confirmación',
    signingTime: '10:00 h',
    notaryName: 'Por designar',
    notaryAddress: 'Valladolid',
    notaryOfficer: '—',
    operationTitle: autoTitle,
    fincas: parsedFincas,
    totalPrice,
    arrasAmount,
    arrasMethod: 'Transferencia',
    arrasDetail: 'Abonado a la firma del contrato de arras',
    remainingAmount,
    remainingMethod: 'Cheque bancario',
    remainingDetail: buyersString,
    notes: '',
  };
};

export const generateNotarySummaryPrintHtml = (formData: NotarySummaryData, logoBase64: string): string => {
  const fincasRowsHtml = formData.fincas.map(f => `
    <tr>
      <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
        ${f.label.endsWith(':') ? f.label : f.label + ':'}
      </td>
      <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
        ${f.registryDescription || 'Inscripción registral en trámite'}
      </td>
    </tr>
  `).join('');

  const fincasPaymentsHtml = formData.fincas.map(f => `
    <tr>
      <td style="padding: 8px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
        PRECIO VENTA
      </td>
      <td style="padding: 8px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
        ${f.label.replace(':', '')}
      </td>
      <td style="padding: 8px 12px; text-align: right; border: 1.2px solid #8B1D2C; color: #0f172a; font-weight: 500; font-variant-numeric: tabular-nums; vertical-align: middle;">
        ${formatCurrencyWithCents(f.price)}
      </td>
    </tr>
  `).join('');

  const effectiveTotal = formData.totalPrice > 0 
    ? formData.totalPrice 
    : formData.fincas.reduce((a, b) => a + (Number(b.price) || 0), 0);
  const effectiveResto = formData.remainingAmount > 0 
    ? formData.remainingAmount 
    : Math.max(0, effectiveTotal - (Number(formData.arrasAmount) || 0));

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen de Operación - ${formData.operationTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 16mm 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #111827; margin: 0; padding: 24px; background: #ffffff;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .no-print { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .btn-print {
      background-color: #8B1D2C; color: #ffffff; border: none; padding: 10px 22px;
      font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer;
    }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
      @page { margin: 16mm 15mm; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
  </div>
  <div style="max-width: 800px; margin: 0 auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
      <div style="max-width: 240px;">
        <img src="${logoBase64}" alt="TERRAVALL" style="width: 100%; height: auto; display: block;" />
      </div>
      <div style="text-align: right;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #8B1D2C; letter-spacing: 0.04em; text-transform: uppercase;">
          RESUMEN DE OPERACIÓN
        </h1>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 28px; padding: 0 10px;">
      <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1.45; letter-spacing: 0.01em;">
        ${formData.operationTitle}
      </h2>
    </div>
    <div style="margin-bottom: 36px;">
      <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #8B1D2C; font-size: 13.5px;">
        <tbody>
          <tr>
            <td style="width: 26%; padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">Fecha firma:</td>
            <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">${formData.signingDate || 'Pendiente de fijar'}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">Hora firma:</td>
            <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">${formData.signingTime || 'Pendiente de fijar'}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">Notaría:</td>
            <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">${formData.notaryName || 'Por designar'}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">Dirección:</td>
            <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">${formData.notaryAddress || '—'}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">Oficial:</td>
            <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">${formData.notaryOfficer || '—'}</td>
          </tr>
          ${fincasRowsHtml}
        </tbody>
      </table>
    </div>
    <div>
      <div style="margin-bottom: 10px; font-size: 14.5px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; text-transform: uppercase;">
        RESUMEN DE PAGOS DE LA COMPRAVENTA
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #8B1D2C; font-size: 13.5px;">
        <thead>
          <tr style="background-color: #781726; color: #ffffff;">
            <th style="width: 28%; padding: 8px 12px; text-align: left; font-weight: 700; border: 1.2px solid #8B1D2C; font-size: 13px;">CONCEPTO</th>
            <th style="width: 44%; padding: 8px 12px; text-align: left; font-weight: 700; border: 1.2px solid #8B1D2C; font-size: 13px;">DETALLE</th>
            <th style="width: 28%; padding: 8px 12px; text-align: right; font-weight: 700; border: 1.2px solid #8B1D2C; font-size: 13px;">IMPORTE</th>
          </tr>
        </thead>
        <tbody>
          ${fincasPaymentsHtml}
          <tr style="background-color: #f8fafc;">
            <td style="padding: 9px 12px; font-weight: 800; border: 1.2px solid #8B1D2C; color: #1E3A8A; vertical-align: middle;">TOTAL</td>
            <td style="padding: 9px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">Precio Total Compraventa</td>
            <td style="padding: 9px 12px; text-align: right; font-weight: 800; border: 1.2px solid #8B1D2C; color: #1E3A8A; font-size: 14.5px; font-variant-numeric: tabular-nums; vertical-align: middle;">
              ${formatCurrencyWithCents(effectiveTotal)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">ARRAS</td>
            <td style="padding: 8px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
              <div>${formData.arrasMethod || 'Transferencia'}</div>
              ${formData.arrasDetail ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${formData.arrasDetail}</div>` : ''}
            </td>
            <td style="padding: 8px 12px; text-align: right; border: 1.2px solid #8B1D2C; color: #0f172a; font-weight: 500; font-variant-numeric: tabular-nums; vertical-align: middle;">
              ${formatCurrencyWithCents(formData.arrasAmount)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">RESTO PAGO</td>
            <td style="padding: 8px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
              <div>${formData.remainingMethod || 'Cheque bancario'}</div>
              ${formData.remainingDetail ? `<div style="white-space: pre-line; font-size: 12.5px; color: #334155; margin-top: 3px; font-weight: 500;">${formData.remainingDetail}</div>` : ''}
            </td>
            <td style="padding: 8px 12px; text-align: right; border: 1.2px solid #8B1D2C; color: #0f172a; font-weight: 500; font-variant-numeric: tabular-nums; vertical-align: middle;">
              ${formatCurrencyWithCents(effectiveResto)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    ${formData.notes ? `
      <div style="margin-top: 24px; padding: 10px 14px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; color: #475569;">
        <strong style="color: #0f172a;">Observaciones para la Notaría:</strong>
        <div style="margin-top: 4px; white-space: pre-line;">${formData.notes}</div>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
};
