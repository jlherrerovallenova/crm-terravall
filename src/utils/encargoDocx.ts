const numberToSpanishWords = (amount: number): string => {
  if (!amount || amount <= 0) return 'CERO EUROS';
  
  const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'diecisiete', 'diecisiete', 'dieciocho', 'diecinueve'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const convertGroup = (n: number): string => {
    let output = '';
    if (n === 100) return 'cien';
    
    if (n >= 100) {
      output += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    
    if (n >= 10 && n < 20) {
      output += teens[n - 10] + ' ';
      return output;
    }
    
    if (n >= 20) {
      output += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) output += ' y ';
      else output += ' ';
    }
    
    if (n > 0 && n < 10) {
      output += units[n] + ' ';
    }
    
    return output;
  };

  const integerPart = Math.floor(amount);
  let result = '';

  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    if (millions === 1) result += 'un millón ';
    else result += convertGroup(millions) + ' millones ';
  }

  if (thousands > 0) {
    if (thousands === 1) result += 'mil ';
    else result += convertGroup(thousands) + ' mil ';
  }

  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return (result.trim() + ' euros').toUpperCase();
};

export const exportEncargoToDocx = async (property: any) => {
  const docx = await import('docx');
  const { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    Table, 
    TableRow, 
    TableCell, 
    BorderStyle, 
    WidthType, 
    ShadingType 
  } = docx;
  const fileSaver = await import('file-saver');
  const saveAs = (fileSaver as any).saveAs || (fileSaver as any).default || fileSaver;

  const formattedPriceNumber = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price || 0);
  const priceInWords = numberToSpanishWords(property.price || 0);

  let honorariosTexto = '';
  let calculoTotalIvaTexto = '';

  if (property.commission_value) {
    if (property.commission_type === 'porcentaje') {
      honorariosTexto = `${property.commission_value}% del precio de venta final`;
      if (property.price && property.price > 0) {
        const totalConIva = property.price * (property.commission_value / 100) * 1.21;
        const formattedTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalConIva);
        calculoTotalIvaTexto = ` (total ${formattedTotal} IVA incluido)`;
      }
    } else {
      honorariosTexto = `${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.commission_value)}`;
      const totalConIva = property.commission_value * 1.21;
      const formattedTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalConIva);
      calculoTotalIvaTexto = ` (total ${formattedTotal} IVA incluido)`;
    }
  } else {
    honorariosTexto = '3.000 €';
    const totalConIva = 3000 * 1.21;
    const formattedTotal = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalConIva);
    calculoTotalIvaTexto = ` (total ${formattedTotal} IVA incluido)`;
  }

  const today = new Date();
  const monthsSpanish = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaTexto = `${today.getDate()} de ${monthsSpanish[today.getMonth()]} de ${today.getFullYear()}`;

  const parseOwnersList = (prop: any) => {
    if (!prop) return [];

    const rawName = prop.owner_name || '';
    const rawDni = prop.owner_dni || '';
    const rawAddress = prop.owner_address || '';
    const rawZipcode = prop.owner_zipcode || prop.zipcode || '';
    const rawCity = prop.owner_city || prop.city || '';
    const rawProvince = prop.owner_province || prop.province || '';

    const nameLines = rawName.split('\n').map((s: string) => s.trim()).filter(Boolean);
    const dniLines = rawDni.split('\n').map((s: string) => s.trim()).filter(Boolean);
    const addressLines = rawAddress.split('\n').map((s: string) => s.trim()).filter(Boolean);
    const zipcodeLines = rawZipcode.split('\n').map((s: string) => s.trim()).filter(Boolean);
    const cityLines = rawCity.split('\n').map((s: string) => s.trim()).filter(Boolean);
    const provinceLines = rawProvince.split('\n').map((s: string) => s.trim()).filter(Boolean);

    const maxCount = Math.max(
      nameLines.length,
      dniLines.length,
      addressLines.length,
      zipcodeLines.length,
      cityLines.length,
      provinceLines.length,
      1
    );

    if (maxCount > 1) {
      const list = [];
      for (let i = 0; i < maxCount; i++) {
        list.push({
          name: nameLines[i] || nameLines[0] || '',
          dni: dniLines[i] || dniLines[0] || '',
          address: addressLines[i] || addressLines[0] || '',
          zipcode: zipcodeLines[i] || zipcodeLines[0] || rawZipcode || '',
          city: cityLines[i] || cityLines[0] || rawCity || '',
          province: provinceLines[i] || provinceLines[0] || rawProvince || ''
        });
      }
      return list;
    }

    if (rawName.includes(' y ') || rawName.includes(' Y ') || rawName.includes(' e ') || rawName.includes(';')) {
      const names = rawName.split(/\s+y\s+|\s+Y\s+|\s+e\s+|;/i).map((s: string) => s.trim()).filter(Boolean);
      const dnis = rawDni.split(/\s*[/,yY;]\s*/).map((s: string) => s.trim()).filter(Boolean);
      const addresses = rawAddress.split(/\s*[/;]\s*/).map((s: string) => s.trim()).filter(Boolean);
      const zipcodes = rawZipcode.split(/\s*[/;]\s*/).map((s: string) => s.trim()).filter(Boolean);

      if (names.length > 1) {
        return names.map((name: string, i: number) => ({
          name,
          dni: dnis[i] || dnis[0] || rawDni,
          address: addresses[i] || addresses[0] || rawAddress,
          zipcode: zipcodes[i] || zipcodes[0] || rawZipcode,
          city: rawCity,
          province: rawProvince
        }));
      }
    }

    return [{
      name: rawName,
      dni: rawDni,
      address: rawAddress,
      zipcode: rawZipcode,
      city: rawCity,
      province: rawProvince
    }];
  };

  const owners = parseOwnersList(property);
  let specificFeaturesObj = property.specific_features;
  if (typeof specificFeaturesObj === 'string') {
    try {
      specificFeaturesObj = JSON.parse(specificFeaturesObj);
    } catch (e) {
      specificFeaturesObj = {};
    }
  }
  const savedIncludes = specificFeaturesObj?.owner_includes || [];

  const buildOwnerRuns = (o: any, idx: number): TextRun[] => {
    const inc = savedIncludes[idx] || {
      includeAddress: true,
      includeZipcode: true,
      includeCity: true,
      includeProvince: true,
    };

    const runs: TextRun[] = [];

    runs.push(new TextRun({ text: o.name || '____________________________________________', bold: true }));
    runs.push(new TextRun({ text: ', DNI ' }));
    runs.push(new TextRun({ text: o.dni || '____________', bold: true }));

    if (inc.includeAddress !== false) {
      runs.push(new TextRun({ text: ', domicilio en ' }));
      runs.push(new TextRun({ text: o.address || '________________________', bold: true }));
    }

    if (inc.includeZipcode !== false) {
      runs.push(new TextRun({ text: ', C.P. ' }));
      runs.push(new TextRun({ text: o.zipcode || property.zipcode || '____________', bold: true }));
    }

    if (inc.includeCity !== false) {
      const ownerCity = o.city || property.city || '____________';
      runs.push(new TextRun({ text: ', en el municipio de ' }));
      runs.push(new TextRun({ text: ownerCity, bold: true }));
    }

    if (inc.includeProvince !== false) {
      const ownerProvince = o.province || property.province || '____________';
      runs.push(new TextRun({ text: ', en la provincia de ' }));
      runs.push(new TextRun({ text: ownerProvince, bold: true }));
    }

    return runs;
  };

  const parteVendedoraParagraphRuns: any[] = [
    new TextRun({ text: 'LA PARTE VENDEDORA: ', bold: true })
  ];

  owners.forEach((o, idx) => {
    if (idx > 0) {
      parteVendedoraParagraphRuns.push(new TextRun({ text: '; ' }));
    }
    parteVendedoraParagraphRuns.push(...buildOwnerRuns(o, idx));
  });

  if (owners.length > 1) {
    parteVendedoraParagraphRuns.push(new TextRun({ text: ', que intervienen como propietarios.' }));
  } else {
    parteVendedoraParagraphRuns.push(new TextRun({ text: ', que interviene como propietario.' }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440
            }
          }
        },
        children: [
          // TÍTULO DEL ENCARGO
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'COMPROMISO DE GESTIÓN DE VENTA CON EXCLUSIVA',
                bold: true,
                size: 28,
                color: '8F1505'
              })
            ]
          }),

          // LA PARTE VENDEDORA
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 180, line: 276 },
            children: parteVendedoraParagraphRuns
          }),

          // INTERMEDIARIO TERRAVALL
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 180, line: 276 },
            children: [
              new TextRun({ text: 'Y de otra, ' }),
              new TextRun({ text: 'TERRAVALL 27 S.L.', bold: true }),
              new TextRun({ text: ', en adelante TERRAVALL, con CIF B95936567 y domicilio en Plaza Mayor 8, 1ºA de Valladolid, como Intermediario Inmobiliario, recibe ENCARGO DE GESTIÓN DE VENTA CON EXCLUSIVA, conforme a las siguientes:' })
            ]
          }),

          // ESTIPULACIONES HEADING
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 180, after: 180 },
            children: [
              new TextRun({
                text: 'ESTIPULACIONES',
                bold: true,
                size: 24
              })
            ]
          }),

          // PRIMERO.- OBJETO
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 120, line: 276 },
            children: [
              new TextRun({ text: 'PRIMERO.- OBJETO.- ', bold: true }),
              new TextRun({ text: 'En virtud de este encargo, la propiedad autoriza a TERRAVALL a realizar la intermediación inmobiliaria y gestión de venta de la finca detallada a continuación:' })
            ]
          }),

          // TABLA / CUADRO DE DETALLES DE LA FINCA
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: '8F1505' },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        spacing: { after: 60 },
                        children: [
                          new TextRun({ text: '• DIRECCIÓN: ', bold: true }),
                          new TextRun({ text: 'VIVIENDA sita en ' }),
                          new TextRun({ text: property.address_hidden || property.address || '', bold: true }),
                          new TextRun({ text: ' en el municipio de ' }),
                          new TextRun({ text: property.city || '', bold: true }),
                          new TextRun({ text: ' en la provincia de ' }),
                          new TextRun({ text: property.province || '', bold: true }),
                          new TextRun({ text: '.' })
                        ]
                      }),
                      new Paragraph({
                        spacing: { after: 60 },
                        children: [
                          new TextRun({ text: '• C.P.: ', bold: true }),
                          new TextRun({ text: property.zipcode || '' })
                        ]
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '• CALIFICACIÓN ENERGÉTICA: ', bold: true }),
                          new TextRun({ text: property.energy_certificate ? property.energy_certificate.replace('_', ' ').toUpperCase() : 'EN TRÁMITE' })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // SEGUNDA.- DURACIÓN
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { before: 180, after: 120, line: 276 },
            children: [
              new TextRun({ text: 'SEGUNDA.- DURACIÓN: ', bold: true }),
              new TextRun({ text: 'La duración del presente encargo de venta con exclusiva es de ' }),
              new TextRun({ text: property.exclusivity_months ? property.exclusivity_months + ' meses' : 'seis meses', bold: true }),
              new TextRun({ text: ' a partir de la fecha del presente documento, que se entenderá tácitamente prorrogado por periodos mensuales si ninguna de las partes comunica su decisión de dar por terminado el contrato de forma expresa y por escrito a la otra al menos con quince días de antelación al vencimiento final del plazo inicial o de cualquiera de sus prórrogas.' })
            ]
          }),

          // TERCERA.- CONDICIONES
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 120, line: 276 },
            children: [
              new TextRun({ text: 'TERCERA.- ', bold: true }),
              new TextRun({ text: 'Las condiciones generales del presente encargo son:' })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            indent: { left: 360 },
            spacing: { after: 100, line: 276 },
            children: [
              new TextRun({ text: '• PRECIO OBJETIVO DEL INMUEBLE: ', bold: true }),
              new TextRun({ text: `${priceInWords} (${formattedPriceNumber}), honorarios incluidos.` })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            indent: { left: 360 },
            spacing: { after: 100, line: 276 },
            children: [
              new TextRun({ text: '• HONORARIOS: ', bold: true }),
              new TextRun({ text: 'Los honorarios ascenderán a ' }),
              new TextRun({ text: `${honorariosTexto} + 21% de IVA`, bold: true }),
              new TextRun({ text: calculoTotalIvaTexto })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            indent: { left: 360 },
            spacing: { after: 100, line: 276 },
            children: [
              new TextRun({ text: '• El propietario no podrá vender por sí mismo y de forma directa o con la intervención de otra agencia inmobiliaria, el inmueble citado a compradores que no hayan sido presentados por TERRAVALL, salvo acuerdo expreso entre las partes. Del mismo modo, el propietario se compromete a presentar a TERRAVALL, aquellas personas que durante la vigencia del encargo se hayan interesado directamente ante él aún sin intervención directa previa de la inmobiliaria, para la compra del inmueble objeto del contrato, a fin de que se realice la tramitación de venta, en cuyo caso abonará en concepto de honorarios, el 50% de los pactados en este documento.' })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            indent: { left: 360 },
            spacing: { after: 180, line: 276 },
            children: [
              new TextRun({ text: '• TERRAVALL queda autorizada a recibir señales/depósitos o pagos a cuenta, que quedarán a disposición de la parte vendedora, respetando las condiciones pactadas y previa autorización por escrito de la propiedad (vía e-mail) y a realizar a su cargo todo tipo de gestiones, publicidad o cualquier otro tipo de tareas encaminadas a la consecución del buen fin de la operación.' })
            ]
          }),

          // CUARTA.- GASTOS Y TRIBUTOS
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 120, line: 276 },
            children: [
              new TextRun({ text: 'CUARTA.- GASTOS Y TRIBUTOS: ', bold: true }),
              new TextRun({ text: 'El inmueble se transmitirá libre de cargas y gravámenes, al corriente del pago de gastos de comunidad y libre de arrendatarios y ocupantes. Todos los gastos que se deriven de la compraventa serán a cuenta del comprador excepto gastos de plusvalía y honorarios de TERRAVALL.' })
            ]
          }),

          // QUINTA.- JURISDICCIÓN
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 180, line: 276 },
            children: [
              new TextRun({ text: 'QUINTA.- JURISDICCIÓN: ', bold: true }),
              new TextRun({ text: 'Para cualquier cuestión o litigio que pudiera surgir en la interpretación o por incumplimiento del presente documento, las partes contratantes se someten a los juzgados y tribunales de Valladolid.' })
            ]
          }),

          // LEÍDO Y CONFORMES
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { after: 120, line: 276 },
            children: [
              new TextRun({ text: 'Leído y conformes con todo cuanto antecede, las partes libremente firman el presente documento, por duplicado ejemplar y a un solo efecto, en el lugar y fecha indicados.' })
            ]
          }),

          // FECHA
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 480 },
            children: [
              new TextRun({ text: `En Valladolid, a ${fechaTexto}.`, bold: true })
            ]
          }),

          // FIRMAS
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
                    margins: { top: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'LA PARTE VENDEDORA', bold: true, size: 18, color: '334155' })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [] })]
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: '64748B' } },
                    margins: { top: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Mª DEL MAR RIVAS BRUN (TERRAVALL)', bold: true, size: 18, color: '334155' })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // CLÁUSULA LOPD / GDPR
          new Paragraph({
            alignment: AlignmentType.JUSTIFY,
            spacing: { before: 480 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' } },
            children: [
              new TextRun({
                text: 'Mª DEL MAR RIVAS BRUN es la responsable del tratamiento de los datos personales proporcionados bajo su consentimiento y le informa de que estos datos serán tratados de conformidad con lo dispuesto en el Reglamento (UE) 2016/679 (GDPR) y la Ley Orgánica 3/2018 (LOPDGDD). No se comunicarán los datos a terceros, salvo obligación legal. Puede ejercer los derechos de acceso, rectificación, portabilidad y supresión dirigiéndose a Plaza Mayor, 8 1 A 47001 Valladolid o al e-mail: mar.terravall@hotmail.com',
                size: 15,
                color: '475569'
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanRef = (property.reference || property.title || 'inmueble').replace(/[^a-zA-Z0-9_-]/g, '_');
  saveAs(blob, `Encargo_Venta_${cleanRef}.docx`);
};
