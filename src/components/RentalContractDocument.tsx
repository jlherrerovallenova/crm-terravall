import React from 'react';
import { type CivilStatus } from '@/schema/rentalContract.schema';

export interface RentalSignatures {
  owner1?: string;
  owner2?: string;
  tenant1?: string;
  tenant2?: string;
  signedAt?: string;
}

export interface RentalContractData {
  city: string;
  dateStr: string;
  signatures?: RentalSignatures;
  
  // Arrendador 1
  owner1Name: string;
  owner1Dni: string;
  owner1CivilStatus: CivilStatus;
  owner1Address: string;
  owner1Street?: string;
  owner1Number?: string;
  owner1FloorLetter?: string;
  owner1City?: string;
  owner1Province?: string;
  owner1Zipcode?: string;
  
  // Arrendador 2
  hasOwner2: boolean;
  owner2Name?: string;
  owner2Dni?: string;
  owner2CivilStatus?: CivilStatus;
  owner2Address?: string;
  owner2Street?: string;
  owner2Number?: string;
  owner2FloorLetter?: string;
  owner2City?: string;
  owner2Province?: string;
  owner2Zipcode?: string;
  
  // Arrendatario 1
  tenant1Name: string;
  tenant1Dni: string;
  tenant1CivilStatus: CivilStatus;
  tenant1Address: string;
  tenant1Street?: string;
  tenant1Number?: string;
  tenant1FloorLetter?: string;
  tenant1City?: string;
  tenant1Province?: string;
  tenant1Zipcode?: string;
  
  // Arrendatario 2
  hasTenant2: boolean;
  tenant2Name?: string;
  tenant2Dni?: string;
  tenant2CivilStatus?: CivilStatus;
  tenant2Address?: string;
  tenant2Street?: string;
  tenant2Number?: string;
  tenant2FloorLetter?: string;
  tenant2City?: string;
  tenant2Province?: string;
  tenant2Zipcode?: string;
  
  // Inmueble y Registro
  propertyAddress: string;
  propertyStreet?: string;
  propertyNumber?: string;
  propertyFloorLetter?: string;
  propertyCity?: string;
  propertyProvince?: string;
  propertyZipcode?: string;
  cadastralReference?: string;
  registryNumber?: string;
  registryCity?: string;
  cru?: string;
  
  // Características
  kitchenEquipped: boolean;
  isFurnished: boolean;
  maxOccupants: number;
  petsAllowed: boolean;
  
  // Condiciones Económicas y Fechas
  startDate: string;
  durationYears: number;
  monthlyRent: number;
  ibanHolder: string;
  iban: string;
  ownerEmail?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  rentIndex?: string;
  depositAmount: number;
  additionalGuarantee?: number;
  communityPaidByOwner?: boolean;
  ibiPaidByOwner?: boolean;
}

export const buildAddressString = (
  street?: string,
  number?: string,
  floorLetter?: string,
  city?: string,
  province?: string,
  zipcode?: string,
  fallback?: string
): string => {
  const parts: string[] = [];
  if (street && street.trim()) {
    let s = street.trim();
    if (number && number.trim()) s += ` nº ${number.trim()}`;
    if (floorLetter && floorLetter.trim()) s += `, ${floorLetter.trim()}`;
    parts.push(s);
  }
  const locParts: string[] = [];
  if (city && city.trim()) locParts.push(city.trim());
  if (province && province.trim()) locParts.push(province.trim());
  if (locParts.length > 0) parts.push(locParts.join(' '));
  if (zipcode && zipcode.trim()) parts.push(`CP ${zipcode.trim()}`);
  return parts.length > 0 ? parts.join(', ') : fallback || '';
};

export const numberToWordsEs = (num: number): string => {
  if (!num || isNaN(num)) return '';
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO EUROS';
  if (num === 100) return 'CIEN EUROS';

  const convertGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      if (n === 100) str += 'CIEN ';
      else str += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) str += ' Y ' + units[n % 10];
      str += ' ';
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  };

  let result = '';
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;

  if (thousands > 0) {
    if (thousands === 1) result += 'MIL ';
    else result += convertGroup(thousands) + ' MIL ';
  }
  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return result.trim() + ' EUROS';
};

export const formatCurrency = (val: number | string) => {
  const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '0,00 €';
  const formattedNum = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(num);
  const words = numberToWordsEs(Math.floor(num));
  return `${formattedNum} (${words})`;
};

export const RentalContractDocument: React.FC<{ data: RentalContractData }> = ({ data }) => {
  const owner1FullAddr = buildAddressString(
    data.owner1Street, data.owner1Number, data.owner1FloorLetter, data.owner1City, data.owner1Province, data.owner1Zipcode, data.owner1Address
  );

  const owner2FullAddr = data.hasOwner2 ? buildAddressString(
    data.owner2Street, data.owner2Number, data.owner2FloorLetter, data.owner2City, data.owner2Province, data.owner2Zipcode, data.owner2Address
  ) : '';

  const tenant1FullAddr = buildAddressString(
    data.tenant1Street, data.tenant1Number, data.tenant1FloorLetter, data.tenant1City, data.tenant1Province, data.tenant1Zipcode, data.tenant1Address
  );

  const tenant2FullAddr = data.hasTenant2 ? buildAddressString(
    data.tenant2Street, data.tenant2Number, data.tenant2FloorLetter, data.tenant2City, data.tenant2Province, data.tenant2Zipcode, data.tenant2Address
  ) : '';

  const propertyFullAddr = buildAddressString(
    data.propertyStreet, data.propertyNumber, data.propertyFloorLetter, data.propertyCity, data.propertyProvince, data.propertyZipcode, data.propertyAddress
  );

  const kitchenDesc = data.kitchenEquipped ? 'cocina equipada' : 'cocina no equipada';
  const furnitureDesc = data.isFurnished ? 'casa amueblada' : 'casa sin muebles';

  return (
    <div className="font-serif text-[11pt] leading-[1.6] text-slate-900 bg-white max-w-[210mm] mx-auto p-[15mm] space-y-6 print:p-0 print:max-w-none print:shadow-none shadow-lg rounded-xl border border-slate-200">
      {/* Título y Encabezado */}
      <div className="text-center space-y-1 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold tracking-tight uppercase text-slate-900">
          CONTRATO DE ARRENDAMIENTO DE VIVIENDA
        </h1>
        <p className="text-sm font-semibold text-slate-600">
          En {data.city || 'Valladolid'}, a {data.dateStr || '28/08/2026'}
        </p>
      </div>

      {/* REUNIDOS */}
      <div className="space-y-3">
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
          REUNIDOS
        </h2>
        
        <p className="text-justify">
          De una parte, <br />
          <strong>D./Dña. {data.owner1Name || '[PENDIENTE DE COMPLETAR]'}</strong>, mayor de edad, con domicilio en {owner1FullAddr || '[PENDIENTE DE COMPLETAR]'} y DNI/PASAPORTE/NIE número <strong>{data.owner1Dni || '[PENDIENTE DE COMPLETAR]'}</strong>
          {data.hasOwner2 && data.owner2Name && (
            <span> y <strong>D./Dña. {data.owner2Name}</strong>, mayor de edad, con domicilio en {owner2FullAddr || owner1FullAddr} y DNI/PASAPORTE/NIE número <strong>{data.owner2Dni}</strong></span>
          )}, <br />
          (en adelante, el &quot;<strong>Propietario</strong>&quot;).
        </p>

        <p className="text-justify">
          De otra parte, <br />
          <strong>D./Dña. {data.tenant1Name || '[PENDIENTE DE COMPLETAR]'}</strong>, mayor de edad, con domicilio en {tenant1FullAddr || '[PENDIENTE DE COMPLETAR]'} y DNI/PASAPORTE/NIE número <strong>{data.tenant1Dni || '[PENDIENTE DE COMPLETAR]'}</strong>
          {data.hasTenant2 && data.tenant2Name && (
            <span> y <strong>D./Dña. {data.tenant2Name}</strong>, mayor de edad, con domicilio en {tenant2FullAddr || tenant1FullAddr} y DNI/PASAPORTE/NIE número <strong>{data.tenant2Dni}</strong></span>
          )}, <br />
          (en adelante, el &quot;<strong>Inquilino</strong>&quot;).
        </p>

        <p className="text-justify italic">
          El Propietario y el Inquilino serán denominados conjuntamente como las &quot;Partes&quot;.
        </p>
      </div>

      {/* EXPONEN */}
      <div className="space-y-3">
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1">
          EXPONEN
        </h2>

        <p className="text-justify">
          <strong>A.</strong> Que el Propietario es propietario del siguiente inmueble: <strong>{propertyFullAddr || '[PENDIENTE DE COMPLETAR]'}</strong>, con {kitchenDesc} y {furnitureDesc}, (en adelante, la vivienda y sus dependencias descritas, conjuntamente, el &quot;Inmueble&quot;).
        </p>

        <p className="text-justify">
          <strong>B.</strong> El Inmueble tiene la siguiente referencia catastral: <strong>{data.cadastralReference || '[PENDIENTE DE COMPLETAR]'}</strong>
          {data.registryNumber && <span>, inscrito en el Registro de la Propiedad de {data.registryCity || 'Valladolid'} Nº Finca {data.registryNumber} {data.cru ? `(CRU: ${data.cru})` : ''}</span>}.
        </p>

        <p className="text-justify">
          <strong>C.</strong> El Inmueble forma parte de una comunidad de Propietarios.
        </p>

        <p className="text-justify">
          <strong>D.</strong> El Propietario manifiesta expresamente que el Inmueble cumple con todos los requisitos y condiciones necesarias para ser destinado a satisfacer las necesidades permanentes de vivienda del Inquilino.
        </p>

        <p className="text-justify">
          <strong>E.</strong> El Inquilino manifiesta su interés en tomar en arrendamiento el citado Inmueble para su uso propio (y, en su caso, el de su familia) como vivienda permanente.
        </p>

        <p className="text-justify">
          <strong>F.</strong> Ambas Partes libremente reconocen entender y aceptar el presente CONTRATO DE ARRENDAMIENTO DE VIVIENDA (el &quot;Contrato&quot;), conforme a las disposiciones de la Ley 29/1994 de 24 de noviembre de Arrendamientos Urbanos (la &quot;LAU&quot;), reconociéndose mutuamente capacidad jurídica para suscribirlo, con sujeción a las siguientes:
        </p>
      </div>

      {/* CLÁUSULAS */}
      <div className="space-y-4">
        <h2 className="text-base font-bold uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1 text-center">
          CLÁUSULAS
        </h2>

        {/* PRIMERA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">PRIMERA: OBJETO</h3>
          <p className="text-justify">
            1.1 El Propietario arrienda al Inquilino, el Inmueble descrito en el Expositivo A, que el Inquilino acepta en este acto.
          </p>
          <p className="text-justify">
            1.2 El Inquilino se compromete a usar dicho Inmueble exclusivamente como vivienda del Inquilino y de su familia directa, en su caso.
          </p>
          <p className="text-justify">
            1.3 En relación con el uso del Inmueble, queda estrictamente prohibido:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-justify">
            <li>a) Cualquier otro tipo de uso al descrito en el apartado anterior.</li>
            <li>b) El subarrendamiento, total o parcial.</li>
            <li>c) La cesión del Contrato sin el consentimiento previo y por escrito del Arrendador.</li>
            <li>d) El uso del Inmueble para comercio, industria ni oficina o despacho profesional.</li>
            <li>e) Destinarla al hospedaje de carácter vacacional.</li>
          </ul>
          <p className="text-justify">
            El incumplimiento por el Inquilino de esta obligación esencial facultará al Propietario a resolver el presente Contrato.
          </p>
          <p className="text-justify">
            1.4 Por las dimensiones del Inmueble, el número máximo de personas que podrán ocuparlo es de <strong>{data.maxOccupants || 1}</strong>, incluyendo al Inquilino.
          </p>
          <p className="text-justify">
            1.5 El Inquilino se obliga a cumplir y respetar en todo momento los estatutos y normas internas de la comunidad de Propietarios a la que pertenece el Inmueble, y que declara conocer y aceptar. Además, se compromete a no molestar ni perjudicar la pacífica convivencia del resto de vecinos de la comunidad.
          </p>
          <p className="text-justify">
            1.6 {data.petsAllowed ? (
              <span>Se autoriza al Inquilino a mantener animales domésticos en el Inmueble, siempre que cumpla estrictamente las normas comunitarias y garantice el mantenimiento del inmueble.</span>
            ) : (
              <span>Se prohíbe de forma expresa al Inquilino tener en el Inmueble cualquier tipo de animal doméstico, salvo consentimiento expreso por escrito del Propietario. El incumplimiento de la presente obligación será considerado causa suficiente para la resolución del Contrato de alquiler, de conformidad con lo establecido en el artículo 27.1 de la vigente LAU.</span>
            )}
          </p>
        </div>

        {/* SEGUNDA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">SEGUNDA: PLAZO DE VIGENCIA</h3>
          <p className="text-justify">
            2.1 El Contrato entrará en vigor en la fecha <strong>{data.startDate || data.dateStr || '28/08/2026'}</strong> con una duración inicial obligatoria de <strong>{data.durationYears || 1} ({data.durationYears === 1 ? 'UN' : 'DOS'}) AÑO(S)</strong> a partir de la fecha de entrada en vigor del Contrato.
          </p>
          <p className="text-justify">
            2.2 El Contrato se prorrogará tácitamente (sin necesidad de aviso previo) por cada anualidad hasta un máximo legal de CINCO (5) AÑOS, salvo que el Inquilino manifieste al Propietario, con treinta días de antelación a la fecha de terminación del Contrato o de cualquiera de sus prórrogas, su voluntad de no renovar el Contrato.
          </p>
          <p className="text-justify">
            2.3 Una vez transcurridos como mínimo CINCO (5) AÑOS de duración del Contrato, si ninguna de las Partes hubiese notificado a la otra, con al menos cuatro meses de antelación en el caso del Propietario, o con al menos dos meses de antelación en el caso del Inquilino, a la fecha de finalización su voluntad de no renovar el Contrato, el Contrato se prorrogará obligatoriamente por anualidades hasta un máximo de TRES (3) AÑOS, salvo que el Inquilino manifieste al arrendador con un mes de antelación a la fecha de terminación de cualquiera de las anualidades, su voluntad de no renovar el Contrato.
          </p>
          <p className="text-justify">
            2.4 El Inquilino podrá desistir del Contrato en cualquier momento una vez hayan transcurrido al menos SEIS (6) MESES a contar desde la fecha de entrada en vigor del Contrato, siempre que notifique por escrito al Propietario con al menos TREINTA (30) DÍAS de antelación. El desistimiento dará lugar a una indemnización a favor del Propietario, equivalente a la parte proporcional de una mensualidad de renta con relación a los meses que falten por cumplir del primer año o de sus respectivas prórrogas automáticas. Para el cálculo de dicha indemnización, se dividirá una mensualidad de renta entre 12 cuotas, y se multiplicará el resultado por el número de meses o fracción de meses que falten por cumplir hasta una anualidad.
          </p>
        </div>

        {/* TERCERA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">TERCERA: ENTREGA DEL INMUEBLE</h3>
          <p className="text-justify">
            3.1 El Propietario entrega al Inquilino el Inmueble en perfectas condiciones de habitabilidad, buen estado de conservación y funcionamiento de sus servicios y a la entera satisfacción de éste. Ambas Partes confirman que el Inmueble se entrega con {kitchenDesc} y {furnitureDesc}.
          </p>
          <p className="text-justify">
            3.2 En este acto el Propietario hace entrega al Inquilino de 1 juego de llaves completo de acceso al Inmueble.
          </p>
        </div>

        {/* CUARTA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">CUARTA: RENTA</h3>
          <p className="text-justify font-semibold text-slate-900">Renta arrendaticia</p>
          <p className="text-justify">
            4.1 Ambas Partes acuerdan fijar una renta mensual de <strong>{formatCurrency(data.monthlyRent || 700)}</strong>, que será pagada por el Inquilino en doce (12) mensualidades iguales.
          </p>
          <p className="text-justify">
            4.2 La falta de pago de una (1) mensualidad de renta será causa suficiente para que el Propietario pueda dar por resuelto este Contrato y ejercite la acción de desahucio.
          </p>
          <p className="text-justify font-semibold text-slate-900">Inicio del devengo de la renta</p>
          <p className="text-justify">
            4.3 Se establece que la renta se devengará a partir de la fecha de entrada en vigor del presente Contrato. El Inquilino paga al Propietario el importe de la renta correspondiente a los días que quedan para finalizar el mes en curso, que el Propietario declara haber recibido a su entera satisfacción, sirviendo el presente Contrato como recibo de pago.
          </p>
          <p className="text-justify font-semibold text-slate-900">Pago de la renta</p>
          <p className="text-justify">
            4.4 El Inquilino abonará la renta por mensualidades anticipadas, dentro de los CINCO (5) primeros días laborales de cada mes, mediante transferencia bancaria a la siguiente cuenta titularidad del Propietario: <br />
            <strong>Titular:</strong> {data.ibanHolder || data.owner1Name || '[PENDIENTE DE COMPLETAR]'} <br />
            <strong>Nº de Cuenta/IBAN:</strong> <span className="font-mono">{data.iban || '[PENDIENTE DE COMPLETAR]'}</span>
          </p>
          <p className="text-justify font-semibold text-slate-900">Actualización de la renta</p>
          <p className="text-justify">
            4.5 La renta pactada será actualizada anualmente y de manera acumulativa en cada anualidad conforme a las variaciones que experimente el Índice de Referencia de Arrendamientos de Vivienda (<strong>{data.rentIndex || 'I.R.A.V.'}</strong>) publicado al efecto por el Instituto Nacional de Estadística.
          </p>
          <p className="text-justify">
            4.6 Si la variación experimentada por dicho índice fuera negativa, la renta permanecerá igual, sin actualizarse.
          </p>
        </div>

        {/* QUINTA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">QUINTA: GARANTÍA DEL CONTRATO</h3>
          <p className="text-justify font-semibold text-slate-900">Fianza arrendaticia</p>
          <p className="text-justify">
            5.1 El Inquilino entrega en este acto al Propietario, quien declara recibirla, la cantidad de <strong>{formatCurrency(data.depositAmount || data.monthlyRent || 700)}</strong>, equivalente a 1 mensualidad de renta, por concepto de fianza legal, según lo establecido en el apartado primero del Artículo 36 de la LAU para garantizar el cumplimiento de las obligaciones que asume en virtud del presente Contrato.
          </p>
          <p className="text-justify">
            5.2 Para aquellas comunidades autónomas en las que sea necesario depositar la fianza: El Propietario se compromete a depositar la fianza en el organismo u oficina pública correspondiente a la Comunidad Autónoma en la que se encuentra el Inmueble.
          </p>
          <p className="text-justify">
            5.3 El importe de la fianza servirá para cubrir cualquier desperfecto o daño tanto en el Inmueble como en su mobiliario así como garantizar el cumplimiento de las obligaciones del Inquilino.
          </p>
          <p className="text-justify">
            5.4 Durante los primeros CINCO (5) AÑOS de duración del Contrato, la fianza no estará sujeta a actualización. Transcurrido dicho plazo, se actualizará hasta igualar una mensualidad de renta vigente.
          </p>
          <p className="text-justify font-semibold text-slate-900">Garantía adicional</p>
          <p className="text-justify">
            5.5 El Inquilino entrega en este acto al Propietario, mediante transferencia bancaria, quien declara recibirla, la cantidad de <strong>{formatCurrency(data.additionalGuarantee || data.monthlyRent || 700)}</strong>, en concepto de garantía adicional, para garantizar el fiel cumplimiento del presente Contrato.
          </p>
        </div>

        {/* SEXTA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">SEXTA: SERVICIOS Y GASTOS</h3>
          <p className="text-justify">
            6.1 El Inquilino se obliga a pagar cualquier gasto relacionado con la contratación de los servicios y suministros individualizados por aparatos contadores (tales como luz, agua, gas, teléfono e internet) con los que cuenta el Inmueble a partir de la fecha de entrada en vigor del Contrato. El Inquilino se pondrá en contacto con las diferentes compañías suministradoras para la domiciliación bancaria y cambio de titularidad de cada suministro.
          </p>
          <p className="text-justify">
            6.2 El Propietario no asume responsabilidad alguna por las interrupciones que pudieran producirse en servicios comunes o individuales.
          </p>
          <p className="text-justify font-semibold text-slate-900">Gastos de comunidad e IBI</p>
          <p className="text-justify">
            6.3 Los gastos de Comunidad de Propietarios así como el Impuesto sobre Bienes Inmuebles (IBI), serán satisfechos íntegramente por el Propietario.
          </p>
          <p className="text-justify font-semibold text-slate-900">Pago de tasas</p>
          <p className="text-justify">
            6.4 La tasa por recogida de residuos sólidos urbanos y la tasa por paso de carruajes (en su caso) será de cuenta del Propietario.
          </p>
        </div>

        {/* SÉPTIMA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">SÉPTIMA: GASTOS DE REPARACIÓN Y CONSERVACIÓN</h3>
          <p className="text-justify">
            7.1 El Propietario estará obligado a realizar todas las reparaciones necesarias en el Inmueble a fin de conservarlo en condiciones óptimas de habitabilidad. No obstante, el Propietario no estará obligado a realizar reparaciones originadas por negligencia o culpa del Inquilino.
          </p>
        </div>

        {/* OCTAVA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">OCTAVA: OBRAS EN EL INMUEBLE</h3>
          <p className="text-justify">
            8.1 El Inquilino no podrá realizar obras, instalaciones ni mejoras de ningún tipo en el Inmueble sin el expreso consentimiento previo del Propietario por escrito.
          </p>
          <p className="text-justify">
            8.2 A la terminación del Contrato, las obras y mejoras quedarán en beneficio del Inmueble, sin derecho del Inquilino a resarcirse de ellas.
          </p>
          <p className="text-justify">
            8.3 En caso de obras no autorizadas, el Propietario podrá instar la resolución del Contrato y exigir la reposición al estado originario.
          </p>
        </div>

        {/* NOVENA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">NOVENA: DEVOLUCIÓN DEL INMUEBLE</h3>
          <p className="text-justify">
            9.1 Llegada la fecha de terminación del Contrato, el Inquilino deberá abandonar el Inmueble sin necesidad de requerimiento previo.
          </p>
          <p className="text-justify">
            9.2 El Inquilino se compromete a devolver el Inmueble y las llaves en perfecto estado, salvo el desgaste por uso ordinario.
          </p>
          <p className="text-justify">
            9.3 El Inquilino se obliga a reparar cualquier desperfecto antes de su devolución.
          </p>
          <p className="text-justify">
            9.4 El retraso en el desalojo devengará a favor del Propietario una penalización diaria igual al doble de la renta diaria vigente.
          </p>
        </div>

        {/* DÉCIMA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">DÉCIMA: DERECHO DE TANTEO Y RETRACTO</h3>
          <p className="text-justify">
            10.1 El Inquilino renuncia expresamente a los derechos de tanteo y retracto que por dicha condición pudieren corresponderle.
          </p>
        </div>

        {/* DÉCIMO PRIMERA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">DÉCIMO PRIMERA: CAUSAS DE TERMINACIÓN DEL CONTRATO</h3>
          <p className="text-justify">
            11.1 Serán causas de terminación del Contrato la enajenación del Inmueble (art. 14 LAU) y la necesidad de vivienda habitual del Propietario o sus familiares de primer grado tras el primer año (art. 9.3 LAU), comunicada con al menos dos meses de antelación.
          </p>
        </div>

        {/* DÉCIMO SEGUNDA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">DÉCIMO SEGUNDA: PROTECCIÓN DE DATOS E INCLUSIÓN EN FICHERO DE MOROSIDAD</h3>
          <p className="text-justify">
            12.1 Los datos personales serán tratados por el Propietario conforme al RGPD para la gestión contractual.
          </p>
          <p className="text-justify">
            12.2 En caso de impago, los datos del Inquilino podrán ser cedidos al fichero de solvencia patrimonial negativo (ej. BDMI / idealista morosidad).
          </p>
        </div>

        {/* DÉCIMO TERCERA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">DÉCIMO TERCERA: LEY APLICABLE Y JURISDICCIÓN</h3>
          <p className="text-justify">
            13.1 El presente Contrato se regirá por la voluntad de las Partes, la LAU 29/1994 y supletoriamente el Código Civil.
          </p>
          <p className="text-justify">
            13.2 La competencia corresponderá a los juzgados y tribunales del lugar donde radica el Inmueble.
          </p>
        </div>

        {/* DÉCIMO CUARTA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">DÉCIMO CUARTA: NOTIFICACIONES</h3>
          <p className="text-justify">
            14.1 Las notificaciones se realizarán por escrito mediante correo certificado, burofax o correo electrónico fehaciente.
          </p>
          <p className="text-justify">
            14.2 Se designan los siguientes medios de comunicación válidos: <br />
            <strong>Por el Inquilino:</strong> Mail: {data.tenantEmail || '[PENDIENTE DE COMPLETAR]'} | Teléfono: {data.tenantPhone || '[PENDIENTE DE COMPLETAR]'} <br />
            <strong>Por el Propietario:</strong> Mail: {data.ownerEmail || 'juanh73@gmail.com'} | Teléfono: [PENDIENTE DE COMPLETAR]
          </p>
        </div>

        {/* DÉCIMO QUINTA */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900">DÉCIMO QUINTA: FIRMA DEL CONTRATO</h3>
          <p className="text-justify">
            15.1 Las Partes acuerdan firmar el Contrato mediante firma electrónica avanzada o manuscrita por duplicado en todas sus páginas.
          </p>
        </div>
      </div>

      {/* HOJA DE FIRMAS */}
      <div className="pt-8 border-t border-slate-300 space-y-6 page-break-inside-avoid">
        <h3 className="text-center font-bold text-slate-900 uppercase">HOJA DE FIRMAS</h3>
        <div className="grid grid-cols-2 gap-8 text-center pt-4">
          <div className="space-y-2 border-t border-slate-400 pt-3">
            <p className="font-bold text-sm">El Propietario</p>
            <p className="text-xs font-semibold">{data.owner1Name || '[PENDIENTE DE COMPLETAR]'}</p>
            {data.signatures?.owner1 ? (
              <img src={data.signatures.owner1} alt="Firma Propietario" className="h-16 mx-auto object-contain" />
            ) : (
              <div className="h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400">Firma Propietario</div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-400 pt-3">
            <p className="font-bold text-sm">El Inquilino</p>
            <p className="text-xs font-semibold">{data.tenant1Name || '[PENDIENTE DE COMPLETAR]'}</p>
            {data.signatures?.tenant1 ? (
              <img src={data.signatures.tenant1} alt="Firma Inquilino" className="h-16 mx-auto object-contain" />
            ) : (
              <div className="h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400">Firma Inquilino</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
