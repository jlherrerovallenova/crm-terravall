import {
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
  ImageRun,
} from 'docx';
import type { ArrasData, CivilStatus, MatrimonialRegime, PersonParty } from '@/types/arras.types';
import {
  getSellersListFromData,
  getBuyersListFromData,
  getSellerSignersFromData,
  getBuyerSignersFromData,
} from '@/utils/arrasHelpers';
import { toTitleCase, formatRegistryOffice, formatNameWithHonorific, buildAddressString } from '@/lib/utils';
import { downloadBlob } from './downloadHelpers';

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const getCivilStatusText = (status: CivilStatus, regime?: MatrimonialRegime): string => {
  switch (status) {
    case 'soltero':
      return 'soltero/a';
    case 'casado':
      if (regime === 'separacion_bienes') return 'casado/a en régimen de separación de bienes';
      if (regime === 'participacion') return 'casado/a en régimen de participación';
      return 'casado/a en régimen de sociedad de gananciales';
    case 'pareja_de_hecho':
      return 'constituido/a en pareja de hecho inscrita';
    case 'divorciado':
      return 'divorciado/a';
    case 'separado':
      return 'separado/a legalmente';
    case 'viudo':
      return 'viudo/a';
    default:
      return 'soltero/a';
  }
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const fetchImageAsUint8Array = async (url: string): Promise<Uint8Array | null> => {
  try {
    if (url.startsWith('data:')) {
      return base64ToUint8Array(url);
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.warn('No se pudo cargar la imagen para DOCX:', url, err);
    return null;
  }
};

export const exportArrasToDocx = async (data: ArrasData): Promise<void> => {
  const sellers = getSellersListFromData(data);
  const buyers = getBuyersListFromData(data);
  const sellerSigners = getSellerSignersFromData(data);
  const buyerSigners = getBuyerSignersFromData(data);

  const sellerShortNames = (): string => {
    const names = sellers.flatMap((s, idx) => {
      const n = formatNameWithHonorific(s.name) || `[Nombre Vendedor ${idx + 1}]`;
      return n ? [n] : [];
    });
    if (names.length === 0) return '[Nombre Vendedor]';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  };

  const buyerShortNames = (): string => {
    const names = buyers.flatMap((b, idx) => {
      const n = formatNameWithHonorific(b.name) || `[Nombre Comprador ${idx + 1}]`;
      return n ? [n] : [];
    });
    if (names.length === 0) return '[Nombre Comprador]';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  };

  // 1. REUNIDOS - VENDEDORES
  const buildSellersRuns = (): TextRun[] => {
    const runs: TextRun[] = [
      new TextRun({ text: 'DE UNA PARTE: ', bold: true }),
    ];

    if (sellers.length === 1) {
      const s1 = sellers[0];
      const s1Name = formatNameWithHonorific(s1.name) || '[Nombre Vendedor]';
      const s1Dni = (s1.dni || '[DNI Vendedor]').toUpperCase();
      const s1Addr = toTitleCase(s1.address) || '[Dirección Vendedor]';
      runs.push(
        new TextRun({ text: `${s1Name}, mayor de edad, estado civil ${getCivilStatusText(s1.civilStatus, s1.matrimonialRegime)}, con DNI/NIE ${s1Dni}, con domicilio a estos efectos en ` }),
        new TextRun({ text: s1Addr, bold: true }),
      );
    } else if (sellers.length === 2 && data.sellersRelationship && data.sellersRelationship !== 'ninguna') {
      const s1 = sellers[0];
      const s2 = sellers[1];
      const s1Name = formatNameWithHonorific(s1.name) || '[Nombre Vendedor 1]';
      const s2Name = formatNameWithHonorific(s2.name) || '[Nombre Vendedor 2]';
      const s1Dni = (s1.dni || '[DNI Vendedor 1]').toUpperCase();
      const s2Dni = (s2.dni || '[DNI Vendedor 2]').toUpperCase();
      const s1Addr = toTitleCase(s1.address) || '[Dirección Vendedor 1]';

      if (data.sellersRelationship === 'casados_entre_si') {
        const regimeText = getCivilStatusText('casado', s1.matrimonialRegime).replace('casado/a ', '');
        runs.push(
          new TextRun({ text: `${s1Name} con DNI/NIE ${s1Dni} y ${s2Name} con DNI/NIE ${s2Dni}, mayores de edad, casados entre sí ${regimeText}, ambos con domicilio en ` }),
          new TextRun({ text: s1Addr, bold: true }),
        );
      } else {
        runs.push(
          new TextRun({ text: `${s1Name} con DNI/NIE ${s1Dni} y ${s2Name} con DNI/NIE ${s2Dni}, mayores de edad, constituidos en pareja de hecho inscrita entre sí, ambos con domicilio en ` }),
          new TextRun({ text: s1Addr, bold: true }),
        );
      }
    } else {
      sellers.forEach((s, idx) => {
        const sName = formatNameWithHonorific(s.name) || `[Nombre Vendedor ${idx + 1}]`;
        const sDni = (s.dni || `[DNI Vendedor ${idx + 1}]`).toUpperCase();
        const sAddr = toTitleCase(s.address) || `[Dirección Vendedor ${idx + 1}]`;
        const isLast = idx === sellers.length - 1;
        const isPenultimate = idx === sellers.length - 2;

        runs.push(
          new TextRun({ text: `${sName}, mayor de edad, estado civil ${getCivilStatusText(s.civilStatus, s.matrimonialRegime)}, con DNI/NIE ${sDni}, con domicilio en ` }),
          new TextRun({ text: sAddr, bold: true }),
          new TextRun({ text: !isLast ? (isPenultimate ? ' y ' : '; ') : '' }),
        );
      });
    }

    runs.push(
      new TextRun({ text: ', que intervienen como propietarios. En adelante, ' }),
      new TextRun({ text: 'LA PARTE VENDEDORA', bold: true }),
      new TextRun({ text: '.' }),
    );

    return runs;
  };

  // 2. REUNIDOS - COMPRADORES
  const buildBuyersRuns = (): TextRun[] => {
    const runs: TextRun[] = [
      new TextRun({ text: 'DE OTRA PARTE: ', bold: true }),
    ];

    if (buyers.length === 1) {
      const b1 = buyers[0];
      const b1Name = formatNameWithHonorific(b1.name) || '[Nombre Comprador]';
      const b1Dni = (b1.dni || '[DNI Comprador]').toUpperCase();
      const b1Addr = toTitleCase(b1.address) || '[Dirección Comprador]';
      runs.push(
        new TextRun({ text: `${b1Name}, mayor de edad, estado civil ${getCivilStatusText(b1.civilStatus, b1.matrimonialRegime)}, con DNI/NIE ${b1Dni}, con domicilio a estos efectos en ` }),
        new TextRun({ text: b1Addr, bold: true }),
      );
    } else if (buyers.length === 2 && data.buyersRelationship && data.buyersRelationship !== 'ninguna') {
      const b1 = buyers[0];
      const b2 = buyers[1];
      const b1Name = formatNameWithHonorific(b1.name) || '[Nombre Comprador 1]';
      const b2Name = formatNameWithHonorific(b2.name) || '[Nombre Comprador 2]';
      const b1Dni = (b1.dni || '[DNI Comprador 1]').toUpperCase();
      const b2Dni = (b2.dni || '[DNI Comprador 2]').toUpperCase();
      const b1Addr = toTitleCase(b1.address) || '[Dirección Comprador 1]';

      if (data.buyersRelationship === 'casados_entre_si') {
        const regimeText = getCivilStatusText('casado', b1.matrimonialRegime).replace('casado/a ', '');
        runs.push(
          new TextRun({ text: `${b1Name} con DNI/NIE ${b1Dni} y ${b2Name} con DNI/NIE ${b2Dni}, mayores de edad, casados entre sí ${regimeText}, ambos con domicilio en ` }),
          new TextRun({ text: b1Addr, bold: true }),
        );
      } else {
        runs.push(
          new TextRun({ text: `${b1Name} con DNI/NIE ${b1Dni} y ${b2Name} con DNI/NIE ${b2Dni}, mayores de edad, constituidos en pareja de hecho inscrita entre sí, ambos con domicilio en ` }),
          new TextRun({ text: b1Addr, bold: true }),
        );
      }
    } else {
      buyers.forEach((b, idx) => {
        const bName = formatNameWithHonorific(b.name) || `[Nombre Comprador ${idx + 1}]`;
        const bDni = (b.dni || `[DNI Comprador ${idx + 1}]`).toUpperCase();
        const bAddr = toTitleCase(b.address) || `[Dirección Comprador ${idx + 1}]`;
        const isLast = idx === buyers.length - 1;
        const isPenultimate = idx === buyers.length - 2;

        runs.push(
          new TextRun({ text: `${bName}, mayor de edad, estado civil ${getCivilStatusText(b.civilStatus, b.matrimonialRegime)}, con DNI/NIE ${bDni}, con domicilio en ` }),
          new TextRun({ text: bAddr, bold: true }),
          new TextRun({ text: !isLast ? (isPenultimate ? ' y ' : '; ') : '' }),
        );
      });
    }

    runs.push(
      new TextRun({ text: '. En adelante, ' }),
      new TextRun({ text: 'LA PARTE COMPRADORA', bold: true }),
      new TextRun({ text: '.' }),
    );

    return runs;
  };

  // 3. INTERVIENEN
  const buildIntervienenParagraphs = (): Paragraph[] => {
    const activeReps = (data.representatives || []).filter(
      (r) => r.name && r.representedPartyIds && r.representedPartyIds.length > 0
    );

    if (activeReps.length === 0) {
      return [
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: 'Intervienen todas las partes en su propio nombre y derecho. Tienen y se reconocen mutuamente la capacidad legal necesaria para el presente otorgamiento, por lo que libremente y de común acuerdo:',
            }),
          ],
        }),
      ];
    }

    const allParties: (PersonParty & { isSeller: boolean; defaultLabel: string })[] = [
      ...sellers.map((s, idx) => ({ ...s, isSeller: true, defaultLabel: `Vendedor ${idx + 1}` })),
      ...buyers.map((b, idx) => ({ ...b, isSeller: false, defaultLabel: `Comprador ${idx + 1}` })),
    ];

    const representedIds = new Set(activeReps.flatMap((r) => r.representedPartyIds || []));
    const unrepresentedParties = allParties.filter((p) => !representedIds.has(p.id));

    const paragraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 120, after: 100 },
        children: [
          new TextRun({ text: 'INTERVIENEN:', bold: true }),
        ],
      }),
    ];

    activeReps.forEach((rep, idx) => {
      const repName = formatNameWithHonorific(rep.name) || `[Nombre Apoderado ${idx + 1}]`;
      const repDni = (rep.dni || `[DNI Apoderado ${idx + 1}]`).toUpperCase();
      const repAddr = toTitleCase(rep.address || buildAddressString(rep.street, rep.number, rep.floorLetter, rep.city, rep.province, rep.zipcode)) || '[Domicilio Apoderado]';
      const representedPeople = allParties.flatMap((p) =>
        rep.representedPartyIds.includes(p.id) ? [formatNameWithHonorific(p.name) || p.name || p.defaultLabel] : []
      );
      const representedNamesText = representedPeople.length > 1
        ? `${representedPeople.slice(0, -1).join(', ')} y ${representedPeople[representedPeople.length - 1]}`
        : (representedPeople[0] || 'la parte correspondiente');

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: `• ${repName}`, bold: true }),
            new TextRun({ text: ', mayor de edad, con DNI/NIE ' }),
            new TextRun({ text: repDni, bold: true }),
            new TextRun({ text: ', con domicilio en ' }),
            new TextRun({ text: repAddr, bold: true }),
            new TextRun({ text: ', quien actúa en nombre y representación de ' }),
            new TextRun({ text: representedNamesText, bold: true }),
            new TextRun({ text: ', en mérito y ejercicio de las facultades conferidas en la escritura pública de poder otorgada ante el Notario de ' }),
            new TextRun({ text: toTitleCase(rep.notaryCity) || '[Ciudad Notaría]', bold: true }),
            new TextRun({ text: ', ' }),
            new TextRun({ text: formatNameWithHonorific(rep.notaryName) || '[Nombre Notario]', bold: true }),
            new TextRun({ text: ', el día ' }),
            new TextRun({ text: rep.powerDate || '[Fecha Poder]', bold: true }),
            new TextRun({ text: ', bajo el número ' }),
            new TextRun({ text: rep.protocolNumber || '[Nº Protocolo]', bold: true }),
            new TextRun({ text: ' de su protocolo. El/La apoderado/a asevera la plena vigencia y subsistencia de dicho poder, manifestando que no le ha sido revocado, suspendido, limitado ni modificado en forma alguna.' }),
          ],
        })
      );
    });

    if (unrepresentedParties.length > 0) {
      const unrepRuns: TextRun[] = [new TextRun({ text: '• ', bold: true })];
      unrepresentedParties.forEach((p, idx) => {
        const pName = formatNameWithHonorific(p.name) || p.defaultLabel;
        const isLast = idx === unrepresentedParties.length - 1;
        const isPenultimate = idx === unrepresentedParties.length - 2;
        unrepRuns.push(
          new TextRun({ text: pName, bold: true }),
          new TextRun({ text: !isLast ? (isPenultimate ? ' y ' : ', ') : '' })
        );
      });
      unrepRuns.push(
        new TextRun({
          text: unrepresentedParties.length > 1
            ? ', quienes intervienen en su propio nombre y derecho.'
            : ', quien interviene en su propio nombre y derecho.',
        })
      );

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: unrepRuns,
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 100, after: 180 },
        children: [
          new TextRun({
            text: 'Aseverando el/los apoderado/s la subsistencia de los poderes reseñados y reconociéndose mutuamente todas las partes y sus representaciones la capacidad legal y legitimación suficientes para el presente otorgamiento, libremente y de común acuerdo:',
          }),
        ],
      })
    );

    return paragraphs;
  };

  // 4. EXPONEN
  const buildExponenParagraphs = (): Paragraph[] => {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 140 },
        children: [
          new TextRun({ text: 'EXPONEN', bold: true, size: 24 }),
        ],
      }),
    ];

    const fincas = data.fincas || [];
    const hasMultipleFincas = fincas.length > 1;

    if (!hasMultipleFincas) {
      const finca0 = fincas[0];
      const regNum = finca0?.registryNumber || data.registryNumber || '[Número]';
      const cruText = finca0?.cru ? ` (CRU: ${finca0.cru})` : '';
      const regOffice = formatRegistryOffice(finca0?.registryCity || data.registryCity, finca0?.registryOfficeNumber);
      const propAddr = toTitleCase(finca0?.propertyAddress || data.propertyAddress) || '[Dirección completa]';
      const cadRef = finca0?.cadastralReference ? ` Ref. Catastral: ${finca0.cadastralReference}.` : '';
      const propDesc = finca0?.propertyDescription || data.propertyDescription || '[Descripción detallada de la finca, superficie, etc.]';

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 140 },
          children: [
            new TextRun({ text: 'I. ', bold: true }),
            new TextRun({ text: 'Que ' }),
            new TextRun({ text: sellerShortNames(), bold: true }),
            new TextRun({ text: ' son propietarios del 100% del pleno dominio de la finca registral número ' }),
            new TextRun({ text: regNum, bold: true }),
            new TextRun({ text: cruText }),
            new TextRun({ text: ', inscrita en el Registro de la Propiedad de ' }),
            new TextRun({ text: regOffice, bold: true }),
            new TextRun({ text: ', sita en ' }),
            new TextRun({ text: propAddr, bold: true }),
            new TextRun({ text: `.${cadRef}` }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 140 },
          children: [
            new TextRun({ text: 'II. ', bold: true }),
            new TextRun({ text: 'Que la finca se describe como: ' }),
            new TextRun({ text: propDesc, bold: true }),
            new TextRun({ text: '.' }),
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `I. Que ${sellerShortNames()} son propietarios del 100% del pleno dominio de las siguientes fincas registrales:`, bold: true }),
          ],
        })
      );

      fincas.forEach((finca, idx) => {
        const regOffice = formatRegistryOffice(finca.registryCity, finca.registryOfficeNumber);
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { left: 400 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `1.${idx + 1}. Finca ${idx + 1} (${toTitleCase(finca.title) || 'Inmueble'}): `, bold: true }),
              new TextRun({ text: 'Registral número ' }),
              new TextRun({ text: finca.registryNumber || '[Número]', bold: true }),
              new TextRun({ text: finca.cru ? ` (CRU: ${finca.cru})` : '' }),
              new TextRun({ text: ', inscrita en el Registro de la Propiedad de ' }),
              new TextRun({ text: regOffice, bold: true }),
              new TextRun({ text: ', sita en ' }),
              new TextRun({ text: toTitleCase(finca.propertyAddress) || '[Dirección completa]', bold: true }),
              new TextRun({ text: finca.cadastralReference ? `. Ref. Catastral: ${finca.cadastralReference}.` : '.' }),
            ],
          })
        );
      });

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({ text: 'II. Que las fincas objeto de este contrato se describen a continuación:', bold: true }),
          ],
        })
      );

      fincas.forEach((finca, idx) => {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { left: 400 },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `2.${idx + 1}. Finca ${idx + 1} (${toTitleCase(finca.title) || 'Inmueble'}): `, bold: true }),
              new TextRun({ text: finca.propertyDescription || '[Descripción detallada]', bold: true }),
              new TextRun({ text: '.' }),
            ],
          })
        );
      });
    }

    // III. CARGAS
    const multi = hasMultipleFincas;
    const cargasParagraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({ text: 'III. CARGAS:', bold: true }),
        ],
      }),
    ];

    if (data.chargesOption === '1') {
      cargasParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 400 },
          spacing: { after: 140 },
          children: [
            new TextRun({ text: '1. LIBRE DE CARGAS: ', bold: true }),
            new TextRun({
              text: `La parte vendedora declara que ${multi ? 'las fincas se encuentran libres' : 'la finca se encuentra libre'} de cargas y gravámenes, al corriente en el pago de impuestos, gastos de comunidad y libre de arrendatarios u ocupantes, garantizando su plena disponibilidad.`,
            }),
          ],
        })
      );
    } else if (data.chargesOption === '2') {
      cargasParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 400 },
          spacing: { after: 140 },
          children: [
            new TextRun({ text: '2. GRAVADO CON HIPOTECA A CANCELAR EN EL MISMO ACTO: ', bold: true }),
            new TextRun({
              text: `${multi ? 'Las fincas se encuentran gravadas' : 'La finca se encuentra gravada'} con una hipoteca que será cancelada económica y registralmente en el mismo acto de otorgamiento de la escritura pública de compraventa, compareciendo a tal efecto la entidad acreedora para otorgar la correspondiente escritura de cancelación. Los gastos derivados de dicha cancelación serán por cuenta exclusiva de la parte vendedora.`,
            }),
          ],
        })
      );
    } else if (data.chargesOption === '3') {
      cargasParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 400 },
          spacing: { after: 140 },
          children: [
            new TextRun({ text: '3. GRAVADO CON HIPOTECA A CANCELAR PREVIAMENTE (RETENCIÓN): ', bold: true }),
            new TextRun({
              text: `${multi ? 'Las fincas se encuentran gravadas' : 'La finca se encuentra gravada'} registralmente con una hipoteca, si bien se ha procedido a su cancelación económica y actualmente se está tramitando su cancelación registral. Los gastos notariales, registrales y de gestoría derivados de la efectiva cancelación registral de dicha hipoteca correrán de cuenta exclusiva de la parte vendedora. En el supuesto de que se alcance la fecha fijada para el otorgamiento de la escritura pública de compraventa y dicha cancelación registral no se hubiera materializado, la parte compradora practicará una retención de `,
            }),
            new TextRun({ text: data.retentionAmount || '[Cantidad]', bold: true }),
            new TextRun({ text: ' sobre el precio de venta al vendedor. La cantidad sobrante será devuelta a la parte vendedora en un plazo máximo de ' }),
            new TextRun({ text: data.returnDays || '[Días]', bold: true }),
            new TextRun({ text: ' desde que se acredite fehacientemente su inscripción en el Registro de la Propiedad, estableciéndose un plazo improrrogable de ' }),
            new TextRun({ text: data.managementMonths || '[Meses]', bold: true }),
            new TextRun({ text: ' para completar dicha gestión.' }),
          ],
        })
      );
    }

    paragraphs.push(...cargasParagraphs);
    return paragraphs;
  };

  // 5. ESTIPULACIONES
  const buildEstipulacionesParagraphs = (): Paragraph[] => {
    const fincas = data.fincas || [];
    const multi = fincas.length > 1;

    const paragraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 140 },
        children: [
          new TextRun({ text: 'ESTIPULACIONES', bold: true, size: 24 }),
        ],
      }),
    ];

    // PRIMERA
    const primeraRuns: TextRun[] = [
      new TextRun({ text: 'PRIMERA.- Objeto del contrato. ', bold: true }),
      new TextRun({ text: sellerShortNames(), bold: true }),
      new TextRun({ text: ' venden a ' }),
      new TextRun({ text: buyerShortNames(), bold: true }),
      new TextRun({
        text: ` que compran, ${multi ? 'las fincas descritas en los expositivos anteriores' : 'la vivienda descrita en el expositivo anterior'}, con todos sus derechos, accesiones y obligaciones, realizándose la compraventa como cuerpo cierto y determinado.`,
      }),
    ];

    if (data.includeKitchenClause) {
      primeraRuns.push(
        new TextRun({
          text: ' La vivienda se entregará con la cocina equipada con sus electrodomésticos; si bien la parte compradora adquiere dichos elementos en el estado en que se encuentran, reconociendo expresamente que no se otorga ningún tipo de garantía sobre los mismos.',
        })
      );
    }

    if (data.includeFurnitureClause) {
      primeraRuns.push(
        new TextRun({ text: ' Asimismo, la venta comprende el mobiliario y enseres que se detallan a continuación: ' }),
        new TextRun({ text: data.furnitureDescription || '[Descripción del mobiliario incluido]', bold: true }),
        new TextRun({ text: '; adquiriendo la parte compradora dichos bienes en el estado en que se encuentran sin otorgamiento de garantía sobre los mismos.' })
      );
    }

    if (data.includePhotoReportClause) {
      primeraRuns.push(
        new TextRun({
          text: ' El estado de la vivienda, electrodomésticos y mobiliario se encuentra reflejado en el inventario y fotoreportaje que se adjunta como anexo al presente contrato.',
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: primeraRuns,
      })
    );

    // SEGUNDA
    const segundaRuns: TextRun[] = [
      new TextRun({ text: 'SEGUNDA.- Precio de compraventa, arras penitenciales y cancelación hipotecaria. ', bold: true }),
      new TextRun({ text: 'El precio total de la compraventa se establece en la cantidad de ' }),
      new TextRun({ text: data.totalPrice || '[Precio total]', bold: true }),
    ];

    if (multi) {
      segundaRuns.push(new TextRun({ text: ', desglosado por fincas de la siguiente manera: ' }));
      fincas.forEach((f, idx) => {
        if (idx > 0) segundaRuns.push(new TextRun({ text: '; ' }));
        const pStr = f.priceFormatted || (f.priceAmount ? currencyFormatter.format(f.priceAmount) : '[Precio finca]');
        segundaRuns.push(
          new TextRun({ text: `${String.fromCharCode(97 + idx)}) Finca ${idx + 1} (${f.title || 'Inmueble'}): ` }),
          new TextRun({ text: pStr, bold: true })
        );
      });
    }

    segundaRuns.push(
      new TextRun({ text: '. En concepto de ' }),
      new TextRun({ text: 'ARRAS PENITENCIALES', bold: true }),
      new TextRun({ text: ', la parte compradora entrega en este acto a la parte vendedora la cantidad de ' }),
      new TextRun({ text: data.arrasAmount || '[Cantidad arras]', bold: true }),
      new TextRun({ text: ' mediante transferencia bancaria a la cuenta de titularidad de la parte vendedora ' }),
      new TextRun({ text: data.sellerIban || '[IBAN]', bold: true }),
      new TextRun({
        text: '. Las partes de común acuerdo ratifican que la cantidad entregada tendrá el carácter de arras penitenciales a los efectos previstos en el artículo 1.454 del Código Civil. El importe restante, esto es, ',
      }),
      new TextRun({ text: data.remainingAmount || '[Cantidad restante]', bold: true }),
      new TextRun({
        text: ', será entregado en el acto de la firma de la escritura pública mediante cheque bancario nominativo o mediante transferencia OMF.',
      })
    );

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: segundaRuns,
      })
    );

    // TERCERA
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: [
          new TextRun({ text: 'TERCERA.- Gastos e impuestos. ', bold: true }),
          new TextRun({
            text: 'Todos los gastos e impuestos que puedan generarse y devengarse como consecuencia de la presente compraventa serán de cuenta y cargo de la parte compradora, excluido el Impuesto Municipal sobre el Incremento del valor de los terrenos de naturaleza urbana (plusvalía), que se abonará por la parte vendedora. El IBI y la Tasa de Basuras se prorratearán entre las partes por el criterio de prorrata temporis al momento de la toma de posesión.',
          }),
        ],
      })
    );

    // CUARTA
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: [
          new TextRun({ text: 'CUARTA.- Otorgamiento de la escritura. ', bold: true }),
          new TextRun({ text: 'Las partes se obligan a otorgar escritura pública de compraventa ante Notario hasta el día ' }),
          new TextRun({ text: data.notaryDeadline || '[Fecha límite]', bold: true }),
          new TextRun({
            text: '. La elección de Notario corresponde a la parte compradora, notificando la identidad del mismo con al menos siete días naturales de antelación. La entrega de llaves y toma de posesión se realizará en el acto de la firma de la Escritura Pública.',
          }),
        ],
      })
    );

    // QUINTA
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: [
          new TextRun({ text: 'QUINTA.- Cargas no aparentes. ', bold: true }),
          new TextRun({
            text: 'La parte vendedora declara que se encuentra al corriente en el pago de los impuestos que gravan la titularidad del objeto en virtud de este contrato. No obstante, si la parte vendedora adeudase cualquier cantidad derivada de la liquidación de impuestos o gastos de comunidad que graven la propiedad, asume expresamente la obligación de pago de tales cantidades pendientes.',
          }),
        ],
      })
    );

    // SEXTA
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: [
          new TextRun({ text: 'SEXTA.- Fuero. ', bold: true }),
          new TextRun({ text: 'Para cualquier discrepancia que pudiera surgir del presente contrato, las partes, con renuncia al fuero propio, se someten a los Juzgados y Tribunales de ' }),
          new TextRun({ text: data.jurisdictionCity || '[Ciudad]', bold: true }),
          new TextRun({ text: '.' }),
        ],
      })
    );

    // SÉPTIMA (HIPOTECA CONDICIONAL)
    if (data.includeMortgageSuspensiveClause) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 140 },
          children: [
            new TextRun({ text: 'SÉPTIMA.- Condición suspensiva de financiación hipotecaria. ', bold: true }),
            new TextRun({ text: 'El presente contrato se otorga sujeto a la condición suspensiva de que la parte compradora obtenga la correspondiente aprobación de un préstamo hipotecario por un importe de al menos ' }),
            new TextRun({ text: data.mortgageAmount || '[Importe hipoteca]', bold: true }),
            new TextRun({ text: ', en un plazo máximo de ' }),
            new TextRun({ text: data.mortgageDays || '[Días plazo]', bold: true }),
            new TextRun({
              text: ' desde la firma del presente documento. En el supuesto de que las entidades bancarias denieguen de forma justificada dicha financiación dentro del plazo señalado, el presente contrato quedará resuelto de pleno derecho sin penalización para ninguna de las partes, estando obligada la parte vendedora a restituir íntegramente a la parte compradora la totalidad del importe recibido en concepto de arras dentro de los cinco (5) días hábiles siguientes a la notificación fehaciente de la denegación.',
            }),
          ],
        })
      );
    }

    // DOMICILIO NOTIFICACIONES
    const numDom = data.includeMortgageSuspensiveClause ? 'OCTAVA' : 'SÉPTIMA';
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 140 },
        children: [
          new TextRun({ text: `${numDom}.- Domicilio a efectos de notificaciones. `, bold: true }),
          new TextRun({ text: 'Las partes designan como domicilio a efectos de notificaciones los indicados en el encabezamiento.' }),
        ],
      })
    );

    // PROTECCIÓN DATOS
    const numProt = data.includeMortgageSuspensiveClause ? 'NOVENA' : 'OCTAVA';
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 180 },
        children: [
          new TextRun({ text: `${numProt}.- Protección de datos. `, bold: true }),
          new TextRun({
            text: 'Los datos de quienes suscriben el presente contrato serán tratados con la finalidad de gestionar su desarrollo y dar cumplimiento a las obligaciones legales derivadas del mismo, conforme a la normativa vigente.',
          }),
        ],
      })
    );

    // CIERRE
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 140, after: 280 },
        children: [
          new TextRun({
            text: 'Y para que así conste, suscriben el presente documento, por duplicado ejemplar y a un solo efecto, en el lugar y fecha indicada.',
          }),
        ],
      })
    );

    return paragraphs;
  };

  // 6. FIRMAS TABLE
  const buildSignaturesTable = async (isAnnex: boolean = false): Promise<Table> => {
    const sellerCellChildren: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: isAnnex ? 'CONFORME PARTE VENDEDORA' : '(Firma Parte Vendedora)',
            bold: true,
            size: 20,
          }),
        ],
      }),
    ];

    for (const signer of sellerSigners) {
      if (signer.signatureUrl) {
        const imgBytes = await fetchImageAsUint8Array(signer.signatureUrl);
        if (imgBytes) {
          sellerCellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 80 },
              children: [
                new ImageRun({
                  type: 'png',
                  data: imgBytes,
                  transformation: { width: 140, height: 60 },
                }),
              ],
            })
          );
        } else {
          sellerCellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 80 },
              children: [new TextRun({ text: '_______________________________' })],
            })
          );
        }
      } else {
        sellerCellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 80 },
            children: [new TextRun({ text: '_______________________________' })],
          })
        );
      }

      sellerCellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: signer.name, bold: true, size: 20 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [new TextRun({ text: signer.roleDescription, size: 18, color: '64748B' })],
        })
      );
    }

    const buyerCellChildren: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: isAnnex ? 'CONFORME PARTE COMPRADORA' : '(Firma Parte Compradora)',
            bold: true,
            size: 20,
          }),
        ],
      }),
    ];

    for (const signer of buyerSigners) {
      if (signer.signatureUrl) {
        const imgBytes = await fetchImageAsUint8Array(signer.signatureUrl);
        if (imgBytes) {
          buyerCellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 80 },
              children: [
                new ImageRun({
                  type: 'png',
                  data: imgBytes,
                  transformation: { width: 140, height: 60 },
                }),
              ],
            })
          );
        } else {
          buyerCellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 80 },
              children: [new TextRun({ text: '_______________________________' })],
            })
          );
        }
      } else {
        buyerCellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 80 },
            children: [new TextRun({ text: '_______________________________' })],
          })
        );
      }

      buyerCellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: signer.name, bold: true, size: 20 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [new TextRun({ text: signer.roleDescription, size: 18, color: '64748B' })],
        })
      );
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 48, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' } },
              margins: { top: 120, bottom: 120, left: 60, right: 60 },
              children: sellerCellChildren,
            }),
            new TableCell({
              width: { size: 4, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [] })],
            }),
            new TableCell({
              width: { size: 48, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' } },
              margins: { top: 120, bottom: 120, left: 60, right: 60 },
              children: buyerCellChildren,
            }),
          ],
        }),
      ],
    });
  };

  // BUILD ENTIRE DOCUMENT
  const docChildren: (Paragraph | Table)[] = [
    // Título Principal
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'CONTRATO DE ARRAS PENITENCIALES',
          bold: true,
          size: 28,
        }),
      ],
    }),

    // Ciudad y Fecha
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'En ' }),
        new TextRun({ text: toTitleCase(data.city) || '[Ciudad]', bold: true }),
        new TextRun({ text: ', a ' }),
        new TextRun({ text: data.dateStr || '[Fecha]', bold: true }),
        new TextRun({ text: '.' }),
      ],
    }),

    // REUNIDOS
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 100, after: 120 },
      children: [
        new TextRun({ text: 'REUNIDOS', bold: true, size: 24 }),
      ],
    }),

    // DE UNA PARTE (VENDEDORES)
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 140 },
      children: buildSellersRuns(),
    }),

    // DE OTRA PARTE (COMPRADORES)
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 160 },
      children: buildBuyersRuns(),
    }),

    // INTERVIENEN
    ...buildIntervienenParagraphs(),

    // EXPONEN
    ...buildExponenParagraphs(),

    // ESTIPULACIONES
    ...buildEstipulacionesParagraphs(),

    // TABLA DE FIRMAS
    await buildSignaturesTable(false),
  ];

  // ANEXO I (INVENTARIO FOTOGRÁFICO) SI ESTÁ MARCADO
  if (data.includePhotoReportClause && data.selectedPhotos && data.selectedPhotos.length > 0) {
    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'ANEXO I: INVENTARIO FOTOGRÁFICO Y FOTOREPORTAJE',
            bold: true,
            size: 26,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({ text: 'Inmueble: ' }),
          new TextRun({ text: data.propertyAddress || '', bold: true }),
          new TextRun({ text: ' | Finca Registral Nº: ' }),
          new TextRun({ text: data.registryNumber || '-', bold: true }),
          new TextRun({ text: ' | Fecha: ' }),
          new TextRun({ text: data.dateStr || '', bold: true }),
        ],
      })
    );

    // Añadir fotos
    for (let i = 0; i < data.selectedPhotos.length; i++) {
      const photo = data.selectedPhotos[i];
      const imgBytes = await fetchImageAsUint8Array(photo.url);
      if (imgBytes) {
        const photoType: 'png' | 'jpg' = photo.url.toLowerCase().includes('.png') ? 'png' : 'jpg';
        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
            children: [
              new ImageRun({
                type: photoType,
                data: imgBytes,
                transformation: { width: 380, height: 260 },
              }),
            ],
          })
        );
      }
      docChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: photo.title || `Fotografía ${i + 1}`,
              size: 18,
              bold: true,
              color: '475569',
            }),
          ],
        })
      );
    }

    // Firmas del anexo
    docChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [],
      }),
      await buildSignaturesTable(true)
    );
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
              right: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const sellerClean = (data.seller1Name || 'Vendedor').replace(/[^a-zA-Z0-9]/g, '_');
  const buyerClean = (data.buyer1Name || 'Comprador').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Contrato_Arras_${sellerClean}_y_${buyerClean}.docx`;

  await downloadBlob(blob, filename);
};
