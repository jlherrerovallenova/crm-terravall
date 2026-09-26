import React from 'react';
import { toTitleCase, formatRegistryOffice, formatNameWithHonorific, buildAddressString } from '../lib/utils';

export type * from '@/types/arras.types';
import type { ArrasData, PersonParty, SignerInfo, CivilStatus, MatrimonialRegime } from '@/types/arras.types';
import {
  getSellersListFromData,
  getBuyersListFromData,
  getSellerSignersFromData,
  getBuyerSignersFromData,
} from '@/utils/arrasHelpers';

interface Props {
  data: ArrasData;
}

const currencyFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

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


export const ArrasContractDocument: React.FC<Props> = ({ data }) => {

  const getSellersList = (): PersonParty[] => getSellersListFromData(data);
  const getBuyersList = (): PersonParty[] => getBuyersListFromData(data);

  const renderSellersSection = () => {
    const sellers = getSellersList();

    if (sellers.length === 1) {
      const s1 = sellers[0];
      const s1Name = formatNameWithHonorific(s1.name) || '[Nombre Vendedor]';
      const s1Dni = (s1.dni || '[DNI Vendedor]').toUpperCase();
      const s1Addr = toTitleCase(s1.address) || '[Dirección Vendedor]';
      return (
        <>
          {s1Name}, mayor de edad, estado civil {getCivilStatusText(s1.civilStatus, s1.matrimonialRegime)}, con DNI/NIE {s1Dni}, con domicilio a estos efectos en <span className="font-bold">{s1Addr}</span>
        </>
      );
    }

    if (sellers.length === 2 && data.sellersRelationship && data.sellersRelationship !== 'ninguna') {
      const s1 = sellers[0];
      const s2 = sellers[1];
      const s1Name = formatNameWithHonorific(s1.name) || '[Nombre Vendedor 1]';
      const s2Name = formatNameWithHonorific(s2.name) || '[Nombre Vendedor 2]';
      const s1Dni = (s1.dni || '[DNI Vendedor 1]').toUpperCase();
      const s2Dni = (s2.dni || '[DNI Vendedor 2]').toUpperCase();
      const s1Addr = toTitleCase(s1.address) || '[Dirección Vendedor 1]';

      if (data.sellersRelationship === 'casados_entre_si') {
        const regimeText = getCivilStatusText('casado', s1.matrimonialRegime).replace('casado/a ', '');
        return (
          <>
            {s1Name} con DNI/NIE {s1Dni} y {s2Name} con DNI/NIE {s2Dni}, mayores de edad, casados entre sí {regimeText}, ambos con domicilio en <span className="font-bold">{s1Addr}</span>
          </>
        );
      } else if (data.sellersRelationship === 'pareja_hecho_entre_si') {
        return (
          <>
            {s1Name} con DNI/NIE {s1Dni} y {s2Name} con DNI/NIE {s2Dni}, mayores de edad, constituidos en pareja de hecho inscrita entre sí, ambos con domicilio en <span className="font-bold">{s1Addr}</span>
          </>
        );
      }
    }

    // Múltiples vendedores (> 2 o no casados entre sí)
    return (
      <>
        {sellers.map((s, idx) => {
          const sName = formatNameWithHonorific(s.name) || `[Nombre Vendedor ${idx + 1}]`;
          const sDni = (s.dni || `[DNI Vendedor ${idx + 1}]`).toUpperCase();
          const sAddr = toTitleCase(s.address) || `[Dirección Vendedor ${idx + 1}]`;
          const isLast = idx === sellers.length - 1;
          const isPenultimate = idx === sellers.length - 2;

          return (
            <React.Fragment key={s.id || s.dni || `seller-${s.name}`}>
              {sName}, mayor de edad, estado civil {getCivilStatusText(s.civilStatus, s.matrimonialRegime)}, con DNI/NIE {sDni}, con domicilio en <span className="font-bold">{sAddr}</span>
              {!isLast ? (isPenultimate ? ' y ' : '; ') : ''}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  const renderBuyersSection = () => {
    const buyers = getBuyersList();

    if (buyers.length === 1) {
      const b1 = buyers[0];
      const b1Name = formatNameWithHonorific(b1.name) || '[Nombre Comprador]';
      const b1Dni = (b1.dni || '[DNI Comprador]').toUpperCase();
      const b1Addr = toTitleCase(b1.address) || '[Dirección Comprador]';
      return (
        <>
          {b1Name}, mayor de edad, estado civil {getCivilStatusText(b1.civilStatus, b1.matrimonialRegime)}, con DNI/NIE {b1Dni}, con domicilio a estos efectos en <span className="font-bold">{b1Addr}</span>
        </>
      );
    }

    if (buyers.length === 2 && data.buyersRelationship && data.buyersRelationship !== 'ninguna') {
      const b1 = buyers[0];
      const b2 = buyers[1];
      const b1Name = formatNameWithHonorific(b1.name) || '[Nombre Comprador 1]';
      const b2Name = formatNameWithHonorific(b2.name) || '[Nombre Comprador 2]';
      const b1Dni = (b1.dni || '[DNI Comprador 1]').toUpperCase();
      const b2Dni = (b2.dni || '[DNI Comprador 2]').toUpperCase();
      const b1Addr = toTitleCase(b1.address) || '[Dirección Comprador 1]';

      if (data.buyersRelationship === 'casados_entre_si') {
        const regimeText = getCivilStatusText('casado', b1.matrimonialRegime).replace('casado/a ', '');
        return (
          <>
            {b1Name} con DNI/NIE {b1Dni} y {b2Name} con DNI/NIE {b2Dni}, mayores de edad, casados entre sí {regimeText}, ambos con domicilio en <span className="font-bold">{b1Addr}</span>
          </>
        );
      } else if (data.buyersRelationship === 'pareja_hecho_entre_si') {
        return (
          <>
            {b1Name} con DNI/NIE {b1Dni} y {b2Name} con DNI/NIE {b2Dni}, mayores de edad, constituidos en pareja de hecho inscrita entre sí, ambos con domicilio en <span className="font-bold">{b1Addr}</span>
          </>
        );
      }
    }

    // Múltiples compradores (> 2 o no casados entre sí)
    return (
      <>
        {buyers.map((b, idx) => {
          const bName = formatNameWithHonorific(b.name) || `[Nombre Comprador ${idx + 1}]`;
          const bDni = (b.dni || `[DNI Comprador ${idx + 1}]`).toUpperCase();
          const bAddr = toTitleCase(b.address) || `[Dirección Comprador ${idx + 1}]`;
          const isLast = idx === buyers.length - 1;
          const isPenultimate = idx === buyers.length - 2;

          return (
            <React.Fragment key={b.id || b.dni || `buyer-${b.name}`}>
              {bName}, mayor de edad, estado civil {getCivilStatusText(b.civilStatus, b.matrimonialRegime)}, con DNI/NIE {bDni}, con domicilio en <span className="font-bold">{bAddr}</span>
              {!isLast ? (isPenultimate ? ' y ' : '; ') : ''}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  const sellerShortNames = () => {
    const sellers = getSellersList();
    const names = sellers.flatMap((s, idx) => {
      const n = formatNameWithHonorific(s.name) || `[Nombre Vendedor ${idx + 1}]`;
      return n ? [n] : [];
    });
    if (names.length === 0) return '[Nombre Vendedor]';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  };

  const buyerShortNames = () => {
    const buyers = getBuyersList();
    const names = buyers.flatMap((b, idx) => {
      const n = formatNameWithHonorific(b.name) || `[Nombre Comprador ${idx + 1}]`;
      return n ? [n] : [];
    });
    if (names.length === 0) return '[Nombre Comprador]';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  };

  // Redacción legal de representación / apoderados
  const renderIntervienenSection = () => {
    const activeReps = (data.representatives || []).filter(
      (r) => r.name && r.representedPartyIds && r.representedPartyIds.length > 0
    );

    if (activeReps.length === 0) {
      return (
        <p className="mb-6">
          Intervienen todas las partes en su propio nombre y derecho. Tienen y se reconocen mutuamente la capacidad legal necesaria para el presente otorgamiento, por lo que libremente y de común acuerdo:
        </p>
      );
    }

    const allSellers = getSellersList();
    const allBuyers = getBuyersList();
    const allParties = [
      ...allSellers.map((s, idx) => ({ ...s, isSeller: true, defaultLabel: `Vendedor ${idx + 1}` })),
      ...allBuyers.map((b, idx) => ({ ...b, isSeller: false, defaultLabel: `Comprador ${idx + 1}` }))
    ];

    const representedIds = new Set(activeReps.flatMap((r) => r.representedPartyIds || []));
    const unrepresentedParties = allParties.filter((p) => !representedIds.has(p.id));

    return (
      <div className="mb-6 space-y-3">
        <p className="font-bold uppercase text-xs tracking-wider text-slate-800">INTERVIENEN:</p>
        
        <div className="space-y-2.5 pl-3">
          {activeReps.map((rep, idx) => {
            const repName = formatNameWithHonorific(rep.name) || `[Nombre Apoderado ${idx + 1}]`;
            const repDni = (rep.dni || `[DNI Apoderado ${idx + 1}]`).toUpperCase();
            const repAddr = toTitleCase(rep.address || buildAddressString(rep.street, rep.number, rep.floorLetter, rep.city, rep.province, rep.zipcode)) || '[Domicilio Apoderado]';
            
            const representedPeople = allParties.flatMap((p) =>
              rep.representedPartyIds.includes(p.id) ? [formatNameWithHonorific(p.name) || p.name || p.defaultLabel] : []
            );
            
            const representedNamesText = representedPeople.length > 1
              ? `${representedPeople.slice(0, -1).join(', ')} y ${representedPeople[representedPeople.length - 1]}`
              : (representedPeople[0] || 'la parte correspondiente');

            return (
              <p key={rep.id || rep.dni || `rep-${rep.name}`} className="text-justify leading-relaxed">
                <span className="font-bold">• {repName}</span>, mayor de edad, con DNI/NIE <span className="font-bold">{repDni}</span>, con domicilio en <span className="font-bold">{repAddr}</span>, quien actúa en nombre y representación de <span className="font-bold">{representedNamesText}</span>, en mérito y ejercicio de las facultades conferidas en la escritura pública de poder otorgada ante el Notario de <span className="font-bold">{toTitleCase(rep.notaryCity) || '[Ciudad Notaría]'}</span>, <span className="font-bold">{formatNameWithHonorific(rep.notaryName) || '[Nombre Notario]'}</span>, el día <span className="font-bold">{rep.powerDate || '[Fecha Poder]'}</span>, bajo el número <span className="font-bold">{rep.protocolNumber || '[Nº Protocolo]'}</span> de su protocolo. El/La apoderado/a asevera la plena vigencia y subsistencia de dicho poder, manifestando que no le ha sido revocado, suspendido, limitado ni modificado en forma alguna.
              </p>
            );
          })}

          {unrepresentedParties.length > 0 && (
            <p className="text-justify leading-relaxed">
              <span className="font-bold">• </span>
              {unrepresentedParties.map((p, idx) => {
                const pName = formatNameWithHonorific(p.name) || p.defaultLabel;
                const isLast = idx === unrepresentedParties.length - 1;
                const isPenultimate = idx === unrepresentedParties.length - 2;
                return (
                  <span key={p.id}>
                    <span className="font-bold">{pName}</span>
                    {!isLast ? (isPenultimate ? ' y ' : ', ') : ''}
                  </span>
                );
              })}
              {unrepresentedParties.length > 1 ? ', quienes intervienen en su propio nombre y derecho.' : ', quien interviene en su propio nombre y derecho.'}
            </p>
          )}
        </div>

        <p className="pt-1">
          Aseverando el/los apoderado/s la subsistencia de los poderes reseñados y reconociéndose mutuamente todas las partes y sus representaciones la capacidad legal y legitimación suficientes para el presente otorgamiento, libremente y de común acuerdo:
        </p>
      </div>
    );
  };

  const getSellerSigners = (): SignerInfo[] => getSellerSignersFromData(data);
  const getBuyerSigners = (): SignerInfo[] => getBuyerSignersFromData(data);

  const renderSignaturesBlock = (isAnnex: boolean = false) => {
    const sellerSigners = getSellerSigners();
    const buyerSigners = getBuyerSigners();

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${isAnnex ? 'pt-8 border-t border-slate-300' : 'pt-12 mt-12 border-t border-slate-300'} text-center font-sans font-medium text-xs text-slate-700 page-break-inside-avoid`}>
        {/* COLUMNA PARTE VENDEDORA */}
        <div className="space-y-6">
          <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wide text-[11px]">
            {isAnnex ? 'Conforme Parte Vendedora' : '(Firma Parte Vendedora)'}
          </p>
          <div className="space-y-6">
            {sellerSigners.map((signer) => (
              <div key={signer.id}>
                <div className="h-20 border-b border-dashed border-slate-300 mb-2 flex items-end justify-center pb-1 overflow-hidden relative">
                  {signer.signatureUrl ? (
                    <img src={signer.signatureUrl} alt={`Firma ${signer.name}`} className="h-16 max-w-[80%] object-contain block" />
                  ) : null}
                </div>
                <p className="font-bold text-slate-900">{signer.name}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{signer.roleDescription}</p>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA PARTE COMPRADORA */}
        <div className="space-y-6">
          <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wide text-[11px]">
            {isAnnex ? 'Conforme Parte Compradora' : '(Firma Parte Compradora)'}
          </p>
          <div className="space-y-6">
            {buyerSigners.map((signer) => (
              <div key={signer.id}>
                <div className="h-20 border-b border-dashed border-slate-300 mb-2 flex items-end justify-center pb-1 overflow-hidden relative">
                  {signer.signatureUrl ? (
                    <img src={signer.signatureUrl} alt={`Firma ${signer.name}`} className="h-16 max-w-[80%] object-contain block" />
                  ) : null}
                </div>
                <p className="font-bold text-slate-900">{signer.name}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{signer.roleDescription}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-8 md:p-12 shadow-sm rounded-lg border border-slate-200 text-slate-900 font-serif leading-relaxed text-justify max-w-4xl mx-auto printable-document">
      <h1 className="text-center font-normal text-lg md:text-xl uppercase tracking-wider mb-6 text-slate-950 underline underline-offset-4 decoration-1">
        CONTRATO DE ARRAS PENITENCIALES
      </h1>

      <p className="mb-6 font-medium">
        En <span className="font-bold">{toTitleCase(data.city) || '[Ciudad]'}</span>, a <span className="font-bold">{data.dateStr || '[Fecha]'}</span>.
      </p>

      <h2 className="font-normal text-base uppercase mb-3 text-slate-900">REUNIDOS</h2>

      <p className="mb-4">
        <span className="font-bold">DE UNA PARTE:</span> {renderSellersSection()}, que intervienen como propietarios. En adelante, <span className="font-bold">LA PARTE VENDEDORA</span>.
      </p>

      <p className="mb-6">
        <span className="font-bold">DE OTRA PARTE:</span> {renderBuyersSection()}. En adelante, <span className="font-bold">LA PARTE COMPRADORA</span>.
      </p>

      {renderIntervienenSection()}

      <h2 className="font-normal text-base uppercase mb-3 text-slate-900">EXPONEN</h2>

      {/* EXPONEN */}
      {(!data.fincas || data.fincas.length <= 1) ? (
        <>
          <p className="mb-4">
            <span className="font-bold">I.</span> Que <span className="font-bold">{sellerShortNames()}</span> son propietarios del 100% del pleno dominio de la finca registral número <span className="font-bold">{(data.fincas && data.fincas[0]?.registryNumber) || data.registryNumber || '[Número]'}</span>
            {data.fincas && data.fincas[0]?.cru ? <> (CRU: <span className="font-bold">{data.fincas[0].cru}</span>)</> : ''}, inscrita en el Registro de la Propiedad de <span className="font-bold">{formatRegistryOffice((data.fincas && data.fincas[0]?.registryCity) || data.registryCity, data.fincas && data.fincas[0]?.registryOfficeNumber)}</span>, sita en <span className="font-bold">{toTitleCase((data.fincas && data.fincas[0]?.propertyAddress) || data.propertyAddress) || '[Dirección completa]'}</span>.
            {data.fincas && data.fincas[0]?.cadastralReference ? <> Ref. Catastral: <span className="font-bold">{data.fincas[0].cadastralReference}</span>.</> : ''}
          </p>

          <p className="mb-4">
            <span className="font-bold">II.</span> Que la finca se describe como: <span className="font-bold">{(data.fincas && data.fincas[0]?.propertyDescription) || data.propertyDescription || '[Descripción detallada de la finca, superficie, etc.]'}</span>.
          </p>
        </>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 font-bold">I. Que {sellerShortNames()} son propietarios del 100% del pleno dominio de las siguientes fincas registrales:</p>
            <div className="pl-4 space-y-2">
              {data.fincas.map((finca, idx) => (
                <p key={finca.id || `finca-reg-${finca.registryNumber || finca.title || finca.cadastralReference}`}>
                  <span className="font-bold">1.{idx + 1}. Finca {idx + 1} ({toTitleCase(finca.title) || 'Inmueble'}):</span> Registral número <span className="font-bold">{finca.registryNumber || '[Número]'}</span>
                  {finca.cru ? <> (CRU: <span className="font-bold">{finca.cru}</span>)</> : ''}, inscrita en el Registro de la Propiedad de <span className="font-bold">{formatRegistryOffice(finca.registryCity, finca.registryOfficeNumber)}</span>, sita en <span className="font-bold">{toTitleCase(finca.propertyAddress) || '[Dirección completa]'}</span>.
                  {finca.cadastralReference ? <> Ref. Catastral: <span className="font-bold">{finca.cadastralReference}</span>.</> : ''}
                </p>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 font-bold">II. Que las fincas objeto de este contrato se describen a continuación:</p>
            <div className="pl-4 space-y-2">
              {data.fincas.map((finca, idx) => (
                <p key={finca.id ? `desc-${finca.id}` : `finca-desc-${finca.registryNumber || finca.title || finca.cadastralReference}`}>
                  <span className="font-bold">2.{idx + 1}. Finca {idx + 1} ({toTitleCase(finca.title) || 'Inmueble'}):</span> <span className="font-bold">{finca.propertyDescription || '[Descripción detallada]'}</span>.
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

      <h2 className="font-normal text-base uppercase mb-3 text-slate-900">ESTIPULACIONES</h2>

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
        <span className="font-bold">SEGUNDA.- Precio de compraventa, arras penitenciales y cancelación hipotecaria.</span> El precio total de la compraventa se establece en la cantidad de <span className="font-bold">{data.totalPrice || '[Precio total]'}</span>
        {data.fincas && data.fincas.length > 1 && (
          <span>, desglosado por fincas de la siguiente manera: {data.fincas.map((f, idx) => (
            <React.Fragment key={f.id || `finca-price-${f.registryNumber || f.title || f.cadastralReference}`}>
              {idx > 0 && '; '}
              {String.fromCharCode(97 + idx)}) Finca {idx + 1} ({f.title || 'Inmueble'}): <span className="font-bold">{f.priceFormatted || (f.priceAmount ? currencyFormatter.format(f.priceAmount) : '[Precio finca]')}</span>
            </React.Fragment>
          ))}</span>
        )}
        . En concepto de <span className="font-bold">ARRAS PENITENCIALES</span>, la parte compradora entrega en este acto a la parte vendedora la cantidad de <span className="font-bold">{data.arrasAmount || '[Cantidad arras]'}</span> mediante transferencia bancaria a la cuenta de titularidad de la parte vendedora <span className="font-bold">{data.sellerIban || '[IBAN]'}</span>. Las partes de común acuerdo ratifican que la cantidad entregada tendrá el carácter de arras penitenciales a los efectos previstos en el artículo 1.454 del Código Civil. El importe restante, esto es, <span className="font-bold">{data.remainingAmount || '[Cantidad restante]'}</span>, será entregado en el acto de la firma de la escritura pública mediante cheque bancario nominativo o mediante transferencia OMF.
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
        <span className="font-bold">SEXTA.- Fuero.</span> Para cualquier discrepancia que pudiera surgir del presente contrato, las partes, con renuncia al fuero propio, se someten a los Juzgados y Tribunales de <span className="font-bold">{data.jurisdictionCity || '[Ciudad]'}</span>.
      </p>

      {data.includeMortgageSuspensiveClause && (
        <p className="mb-4">
          <span className="font-bold">SÉPTIMA.- Condición suspensiva de financiación hipotecaria.</span> El presente contrato se otorga sujeto a la condición suspensiva de que la parte compradora obtenga la correspondiente aprobación de un préstamo hipotecario por un importe de al menos <span className="font-bold">{data.mortgageAmount || '[Importe hipoteca]'}</span>, en un plazo máximo de <span className="font-bold">{data.mortgageDays || '[Días plazo]'}</span> desde la firma del presente documento. En el supuesto de que las entidades bancarias denieguen de forma justificada dicha financiación dentro del plazo señalado, el presente contrato quedará resuelto de pleno derecho sin penalización para ninguna de las partes, estando obligada la parte vendedora a restituir íntegramente a la parte compradora la totalidad del importe recibido en concepto de arras dentro de los cinco (5) días hábiles siguientes a la notificación fehaciente de la denegación.
        </p>
      )}

      <p className="mb-4">
        <span className="font-bold">{data.includeMortgageSuspensiveClause ? 'OCTAVA' : 'SÉPTIMA'}.- Domicilio a efectos de notificaciones.</span> Las partes designan como domicilio a efectos de notificaciones los indicados en el encabezamiento.
      </p>

      <p className="mb-6">
        <span className="font-bold">{data.includeMortgageSuspensiveClause ? 'NOVENA' : 'OCTAVA'}.- Protección de datos.</span> Los datos de quienes suscriben el presente contrato serán tratados con la finalidad de gestionar su desarrollo y dar cumplimiento a las obligaciones legales derivadas del mismo, conforme a la normativa vigente.
      </p>

      <p className="mb-12 font-medium">
        Y para que así conste, suscriben el presente documento, por duplicado ejemplar y a un solo efecto, en el lugar y fecha indicada.
      </p>

      {renderSignaturesBlock(false)}

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
              <div key={photo.id || photo.url} className="border border-slate-300 rounded-lg p-2 bg-slate-50 break-inside-avoid shadow-sm">
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

          {renderSignaturesBlock(true)}
        </div>
      )}
    </div>
  );
};
