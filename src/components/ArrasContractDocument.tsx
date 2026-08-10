import React from 'react';

export type CivilStatus = 'soltero' | 'casado' | 'pareja_de_hecho' | 'divorciado' | 'separado' | 'viudo';
export type MatrimonialRegime = 'gananciales' | 'separacion_bienes' | 'participacion';
export type RelationshipType = 'ninguna' | 'casados_entre_si' | 'pareja_hecho_entre_si';

export interface FincaItem {
  id: string;
  title: string;
  registryNumber: string;
  registryCity: string;
  propertyAddress: string;
  propertyDescription: string;
}

export interface ArrasData {
  city: string;
  dateStr: string;
  
  // Vendedores
  seller1Name: string;
  seller1Dni: string;
  seller1CivilStatus: CivilStatus;
  seller1MatrimonialRegime?: MatrimonialRegime;
  seller1Address: string;
  hasSeller2: boolean;
  seller2Name: string;
  seller2Dni: string;
  seller2CivilStatus: CivilStatus;
  seller2MatrimonialRegime?: MatrimonialRegime;
  sellersRelationship: RelationshipType;
  
  // Compradores
  buyer1Name: string;
  buyer1Dni: string;
  buyer1CivilStatus: CivilStatus;
  buyer1MatrimonialRegime?: MatrimonialRegime;
  buyer1Address: string;
  hasBuyer2: boolean;
  buyer2Name: string;
  buyer2Dni: string;
  buyer2CivilStatus: CivilStatus;
  buyer2MatrimonialRegime?: MatrimonialRegime;
  buyersRelationship: RelationshipType;
  
  // Fincas (1 o varias)
  fincas: FincaItem[];
  registryNumber?: string;
  registryCity?: string;
  propertyAddress?: string;
  propertyDescription?: string;
  
  // Cargas
  chargesOption: '1' | '2' | '3';
  retentionAmount: string;
  returnDays: string;
  managementMonths: string;
  
  // Cláusulas especiales
  includeKitchenClause: boolean;
  includeFurnitureClause: boolean;
  furnitureDescription: string;
  includePhotoReportClause: boolean;
  selectedPhotos?: { id: string; url: string; title?: string }[];
  
  // Economía
  totalPrice: string;
  arrasAmount: string;
  remainingAmount: string;
  sellerIban: string;
  
  // Escritura y Fuero
  notaryDeadline: string;
  jurisdictionCity: string;
}

interface Props {
  data: ArrasData;
}

export const ArrasContractDocument: React.FC<Props> = ({ data }) => {
  const getCivilStatusText = (status: CivilStatus, regime?: MatrimonialRegime) => {
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

  const formatSellers = () => {
    const s1Name = data.seller1Name || '[Nombre vendedor 1]';
    const s1Dni = data.seller1Dni || '[DNI vendedor 1]';

    if (!data.hasSeller2 || !data.seller2Name) {
      return `${s1Name}, mayor de edad, estado civil ${getCivilStatusText(data.seller1CivilStatus, data.seller1MatrimonialRegime)}, con DNI ${s1Dni}`;
    }

    const s2Name = data.seller2Name;
    const s2Dni = data.seller2Dni || '[DNI vendedor 2]';

    if (data.sellersRelationship === 'casados_entre_si') {
      const regimeText = getCivilStatusText('casado', data.seller1MatrimonialRegime);
      return `${s1Name} con DNI ${s1Dni} y ${s2Name} con DNI ${s2Dni}, mayores de edad, casados entre sí ${regimeText.replace('casado/a ', '')}`;
    }

    if (data.sellersRelationship === 'pareja_hecho_entre_si') {
      return `${s1Name} con DNI ${s1Dni} y ${s2Name} con DNI ${s2Dni}, mayores de edad, constituidos en pareja de hecho inscrita entre sí`;
    }

    return `${s1Name}, mayor de edad, estado civil ${getCivilStatusText(data.seller1CivilStatus, data.seller1MatrimonialRegime)}, con DNI ${s1Dni}, y ${s2Name}, mayor de edad, estado civil ${getCivilStatusText(data.seller2CivilStatus, data.seller2MatrimonialRegime)}, con DNI ${s2Dni}`;
  };

  const sellerAddressText = data.seller1Address || '[Dirección]';

  const formatBuyers = () => {
    const b1Name = data.buyer1Name || '[Nombre comprador 1]';
    const b1Dni = data.buyer1Dni || '[DNI comprador 1]';

    if (!data.hasBuyer2 || !data.buyer2Name) {
      return `${b1Name}, mayor de edad, estado civil ${getCivilStatusText(data.buyer1CivilStatus, data.buyer1MatrimonialRegime)}, con DNI ${b1Dni}`;
    }

    const b2Name = data.buyer2Name;
    const b2Dni = data.buyer2Dni || '[DNI comprador 2]';

    if (data.buyersRelationship === 'casados_entre_si') {
      const regimeText = getCivilStatusText('casado', data.buyer1MatrimonialRegime);
      return `${b1Name} con DNI ${b1Dni} y ${b2Name} con DNI ${b2Dni}, mayores de edad, casados entre sí ${regimeText.replace('casado/a ', '')}`;
    }

    if (data.buyersRelationship === 'pareja_hecho_entre_si') {
      return `${b1Name} con DNI ${b1Dni} y ${b2Name} con DNI ${b2Dni}, mayores de edad, constituidos en pareja de hecho inscrita entre sí`;
    }

    return `${b1Name}, mayor de edad, estado civil ${getCivilStatusText(data.buyer1CivilStatus, data.buyer1MatrimonialRegime)}, con DNI ${b1Dni}, y ${b2Name}, mayor de edad, estado civil ${getCivilStatusText(data.buyer2CivilStatus, data.buyer2MatrimonialRegime)}, con DNI ${b2Dni}`;
  };

  const buyerAddressText = data.buyer1Address || '[Dirección]';

  const sellerShortNames = () => {
    if (data.hasSeller2 && data.seller2Name) {
      return `D. ${data.seller1Name || '[Nombre Vendedor 1]'} y D. ${data.seller2Name}`;
    }
    return `D. ${data.seller1Name || '[Nombre Vendedor 1]'}`;
  };

  const buyerShortNames = () => {
    if (data.hasBuyer2 && data.buyer2Name) {
      return `D. ${data.buyer1Name || '[Nombre Comprador 1]'} y D. ${data.buyer2Name}`;
    }
    return `D. ${data.buyer1Name || '[Nombre Comprador 1]'}`;
  };

  return (
    <div className="bg-white p-8 md:p-12 shadow-sm rounded-lg border border-slate-200 text-slate-900 font-serif leading-relaxed text-justify max-w-4xl mx-auto printable-document">
      <h1 className="text-center font-bold text-lg md:text-xl uppercase tracking-wider mb-6 text-slate-950 underline underline-offset-4 decoration-1">
        CONTRATO DE ARRAS PENITENCIALES
      </h1>

      <p className="mb-6 font-medium">
        En <span className="font-bold">{data.city || '[Ciudad]'}</span>, a <span className="font-bold">{data.dateStr || '[Fecha]'}</span>.
      </p>

      <h2 className="font-bold text-base uppercase mb-3 text-slate-900">REUNIDOS</h2>

      <p className="mb-4">
        <span className="font-bold">DE UNA PARTE:</span> {formatSellers()}, mayores de edad, con domicilio en <span className="font-bold">{sellerAddressText}</span>, que intervienen como propietarios. En adelante, <span className="font-bold">LA PARTE VENDEDORA</span>.
      </p>

      <p className="mb-6">
        <span className="font-bold">DE OTRA PARTE:</span> {formatBuyers()}, {data.hasBuyer2 ? 'ambos con' : 'con'} domicilio en <span className="font-bold">{buyerAddressText}</span>. En adelante, <span className="font-bold">LA PARTE COMPRADORA</span>.
      </p>

      <p className="mb-6">
        Intervienen ambas partes en su propio nombre y derecho. Tienen y se reconocen mutuamente la capacidad legal necesaria para el presente otorgamiento, por lo que libremente y de común acuerdo:
      </p>

      <h2 className="font-bold text-base uppercase mb-3 text-slate-900">EXPONEN</h2>

      {/* EXPONEN */}
      {(!data.fincas || data.fincas.length <= 1) ? (
        <>
          <p className="mb-4">
            <span className="font-bold">I.</span> Que <span className="font-bold">{sellerShortNames()}</span> son propietarios del 100% del pleno dominio de la finca registral número <span className="font-bold">{(data.fincas && data.fincas[0]?.registryNumber) || data.registryNumber || '[Número]'}</span>, inscrita en el Registro de la Propiedad de <span className="font-bold">{(data.fincas && data.fincas[0]?.registryCity) || data.registryCity || '[Municipio]'}</span> Sita en <span className="font-bold">{(data.fincas && data.fincas[0]?.propertyAddress) || data.propertyAddress || '[Dirección completa]'}</span>.
          </p>

          <p className="mb-4">
            <span className="font-bold">II.</span> Que la finca se describe como: <span className="font-bold">{(data.fincas && data.fincas[0]?.propertyDescription) || data.propertyDescription || '[Descripción detallada de la finca, referencia catastral, superficie, etc.]'}</span>.
          </p>
        </>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 font-bold">I. Que {sellerShortNames()} son propietarios del 100% del pleno dominio de las siguientes fincas registrales:</p>
            <div className="pl-4 space-y-2">
              {data.fincas.map((finca, idx) => (
                <p key={finca.id || idx}>
                  <span className="font-bold">1.{idx + 1}. Finca {idx + 1} ({finca.title || 'Inmueble'}):</span> Registral número <span className="font-bold">{finca.registryNumber || '[Número]'}</span>, inscrita en el Registro de la Propiedad de <span className="font-bold">{finca.registryCity || '[Municipio]'}</span>, sita en <span className="font-bold">{finca.propertyAddress || '[Dirección completa]'}</span>.
                </p>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 font-bold">II. Que las fincas objeto de este contrato se describen a continuación:</p>
            <div className="pl-4 space-y-2">
              {data.fincas.map((finca, idx) => (
                <p key={finca.id || idx}>
                  <span className="font-bold">2.{idx + 1}. Finca {idx + 1} ({finca.title || 'Inmueble'}):</span> <span className="font-bold">{finca.propertyDescription || '[Descripción detallada]'}</span>.
                </p>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mb-6">
        <p className="font-bold mb-2">III. CARGAS:</p>

        {data.chargesOption === '1' && (
          <p className="pl-4">
            <span className="font-bold">1. LIBRE DE CARGAS:</span> La parte vendedora declara que {(data.fincas && data.fincas.length > 1) ? 'las fincas se encuentran libres' : 'la finca se encuentra libre'} de cargas y gravámenes, al corriente en el pago de impuestos, gastos de comunidad y libre de arrendatarios u ocupantes, garantizando su plena disponibilidad.
          </p>
        )}

        {data.chargesOption === '2' && (
          <p className="pl-4">
            <span className="font-bold">2. GRAVADO CON HIPOTECA A CANCELAR EN EL MISMO ACTO:</span> {(data.fincas && data.fincas.length > 1) ? 'Las fincas se encuentran gravadas' : 'La finca se encuentra gravada'} con una hipoteca que será cancelada económica y registralmente en el mismo acto de otorgamiento de la escritura pública de compraventa, compareciendo a tal efecto la entidad acreedora para otorgar la correspondiente escritura de cancelación. Los gastos derivados de dicha cancelación serán por cuenta exclusiva de la parte vendedora.
          </p>
        )}

        {data.chargesOption === '3' && (
          <p className="pl-4">
            <span className="font-bold">3. GRAVADO CON HIPOTECA A CANCELAR PREVIAMENTE (RETENCIÓN):</span> {(data.fincas && data.fincas.length > 1) ? 'Las fincas se encuentran gravadas' : 'La finca se encuentra gravada'} registralmente con una hipoteca, si bien se ha procedido a su cancelación económica y actualmente se está tramitando su cancelación registral. Los gastos notariales, registrales y de gestoría derivados de la efectiva cancelación registral de dicha hipoteca correrán de cuenta exclusiva de la parte vendedora. En el supuesto de que se alcance la fecha fijada para el otorgamiento de la escritura pública de compraventa y dicha cancelación registral no se hubiera materializado, la parte compradora practicará una retención de <span className="font-bold">{data.retentionAmount || '[Cantidad]'}</span> sobre el precio de venta al vendedor. La cantidad sobrante será devuelta a la parte vendedora en un plazo máximo de <span className="font-bold">{data.returnDays || '[Días]'}</span> desde que se acredite fehacientemente su inscripción en el Registro de la Propiedad, estableciéndose un plazo improrrogable de <span className="font-bold">{data.managementMonths || '[Meses]'}</span> para completar dicha gestión.
          </p>
        )}
      </div>

      <h2 className="font-bold text-base uppercase mb-3 text-slate-900">ESTIPULACIONES</h2>

      <p className="mb-4">
        <span className="font-bold">PRIMERA.- Objeto del contrato.</span> <span className="font-bold">{sellerShortNames()}</span> venden a <span className="font-bold">{buyerShortNames()}</span> que compran, {(data.fincas && data.fincas.length > 1) ? 'las fincas descritas en los expositivos anteriores' : 'la vivienda descrita en el expositivo anterior'}, con todos sus derechos, accesiones y obligaciones, realizándose la compraventa como cuerpo cierto y determinado.
        {data.includeKitchenClause && (
          <span> La vivienda se entregará con la cocina equipada con sus electrodomésticos; si bien la parte compradora adquiere dichos elementos en el estado en que se encuentran, reconociendo expresamente que no se otorga ningún tipo de garantía sobre los mismos.</span>
        )}
        {data.includeFurnitureClause && (
          <span> Asimismo, la venta comprende el mobiliario y enseres que se detallan a continuación: <span className="font-bold">{data.furnitureDescription || '[Descripción del mobiliario incluido]'}</span>; adquiriendo la parte compradora dichos bienes en el estado en que se encuentran sin otorgamiento de garantía sobre los mismos.</span>
        )}
        {data.includePhotoReportClause && (
          <span> El estado de la vivienda, electrodomésticos y mobiliario se encuentra reflejado en el inventario y fotoreportaje que se adjunta como anexo al presente contrato.</span>
        )}
      </p>



      <p className="mb-4">
        <span className="font-bold">SEGUNDA.- Precio de compraventa, arras penitenciales y cancelación hipotecaria.</span> El precio total de la compraventa se establece en la cantidad de <span className="font-bold">{data.totalPrice || '[Precio total]'}</span>. En concepto de <span className="font-bold">ARRAS PENITENCIALES</span>, la parte compradora entrega en este acto a la parte vendedora la cantidad de <span className="font-bold">{data.arrasAmount || '[Cantidad arras]'}</span> mediante transferencia bancaria a la cuenta de titularidad de la parte vendedora <span className="font-bold">{data.sellerIban || '[IBAN]'}</span>. Las partes de común acuerdo ratifican que la cantidad entregada tendrá el carácter de arras penitenciales a los efectos previstos en el artículo 1.454 del Código Civil. El importe restante, esto es, <span className="font-bold">{data.remainingAmount || '[Cantidad restante]'}</span>, será entregado en el acto de la firma de la escritura pública mediante cheque bancario nominativo o mediante transferencia OMF.
      </p>

      <p className="mb-4">
        <span className="font-bold">TERCERA.- Gastos e impuestos.</span> Todos los gastos e impuestos que puedan generarse y devengarse como consecuencia de la presente compraventa serán de cuenta y cargo de la parte compradora, excluido el Impuesto Municipal sobre el Incremento del valor de los terrenos de naturaleza urbana (plusvalía), que se abonará por la parte vendedora. El IBI y la Tasa de Basuras se prorratearán entre las partes por el criterio de prorrata temporis al momento de la toma de posesión.
      </p>

      <p className="mb-4">
        <span className="font-bold">CUARTA.- Otorgamiento de la escritura.</span> Las partes se obligan a otorgar escritura pública de compraventa ante Notario hasta el día <span className="font-bold">{data.notaryDeadline || '[Fecha límite]'}</span>. La elección de Notario corresponde a la parte compradora, notificando la identidad del mismo con al menos siete días naturales de antelación. La entrega de llaves y toma de posesión se realizará en el acto de la firma de la Escritura Pública.
      </p>

      <p className="mb-4">
        <span className="font-bold">QUINTA.- Cargas no aparentes.</span> La parte vendedora declara que se encuentra al corriente en el pago de los impuestos que gravan la titularidad del objeto en virtud de este contrato. No obstante, si la parte vendedora adeudase cualquier cantidad derivada de la liquidación de impuestos o gastos de comunidad que graven la propiedad, asume expresamente la obligación de pago de tales cantidades pendientes.
      </p>

      <p className="mb-4">
        <span className="font-bold">SEXTA.- Fuero.</span> Para cualquier discrepancy que pudiera surgir del presente contrato, las partes, con renuncia al fuero propio, se someten a los Juzgados y Tribunales de <span className="font-bold">{data.jurisdictionCity || '[Ciudad]'}</span>.
      </p>

      <p className="mb-4">
        <span className="font-bold">SÉPTIMA.- Domicilio a efectos de notificaciones.</span> Las partes designan como domicilio a efectos de notificaciones los indicados en el encabezamiento.
      </p>

      <p className="mb-6">
        <span className="font-bold">OCTAVA.- Protección de datos.</span> Los datos de quienes suscriben el presente contrato serán tratados con la finalidad de gestionar su desarrollo y dar cumplimiento a las obligaciones legales derivadas del mismo, conforme a la normativa vigente.
      </p>

      <p className="mb-12 font-medium">
        Y para que así conste, suscriben el presente documento, por duplicado ejemplar y a un solo efecto, en el lugar y fecha arriba indicada.
      </p>

      <div className="grid grid-cols-2 gap-8 pt-12 mt-12 border-t border-slate-300 text-center font-sans font-medium text-xs text-slate-700 page-break-inside-avoid">
        <div>
          <div className="h-16 border-b border-dashed border-slate-300 mb-2"></div>
          <p className="font-bold text-slate-900">(Firma Parte Vendedora)</p>
          <p className="text-slate-500 mt-1">{sellerShortNames()}</p>
        </div>
        <div>
          <div className="h-16 border-b border-dashed border-slate-300 mb-2"></div>
          <p className="font-bold text-slate-900">(Firma Parte Compradora)</p>
          <p className="text-slate-500 mt-1">{buyerShortNames()}</p>
        </div>
      </div>

      {/* ANEXO I: INVENTARIO FOTOGRÁFICO Y FOTOREPORTAJE */}
      {data.includePhotoReportClause && data.selectedPhotos && data.selectedPhotos.length > 0 && (
        <div className="mt-16 pt-12 border-t-2 border-slate-900 text-left style-annex page-break-before-always">
          <h2 className="text-center font-bold text-lg uppercase tracking-wider mb-2 text-slate-950 underline underline-offset-4">
            ANEXO I: INVENTARIO FOTOGRÁFICO Y FOTOREPORTAJE
          </h2>
          <p className="text-center text-xs text-slate-600 mb-8 font-sans">
            Inmueble: <span className="font-semibold">{data.propertyAddress}</span> | Finca Registral Nº: <span className="font-semibold">{data.registryNumber || '-'}</span> | Fecha: <span className="font-semibold">{data.dateStr}</span>
          </p>

          <div className="grid grid-cols-2 gap-6 mb-12">
            {data.selectedPhotos.map((photo, idx) => (
              <div key={photo.id || idx} className="border border-slate-300 rounded-lg p-2 bg-slate-50 break-inside-avoid shadow-sm">
                <img
                  src={photo.url}
                  alt={photo.title || `Fotografía ${idx + 1}`}
                  className="w-full h-52 object-cover rounded border border-slate-200"
                />
                <p className="text-center text-xs text-slate-700 font-sans mt-2 font-semibold">
                  {photo.title ? photo.title : `Fotografía ${idx + 1}`}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center font-sans font-medium text-xs text-slate-700 page-break-inside-avoid">
            <div>
              <div className="h-14 border-b border-dashed border-slate-300 mb-2"></div>
              <p className="font-bold text-slate-900">Conforme Parte Vendedora</p>
              <p className="text-slate-500 mt-0.5">{sellerShortNames()}</p>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-slate-300 mb-2"></div>
              <p className="font-bold text-slate-900">Conforme Parte Compradora</p>
              <p className="text-slate-500 mt-0.5">{buyerShortNames()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
