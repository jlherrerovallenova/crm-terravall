import React from 'react';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import type { NotarySummaryData, NotarySummaryFinca } from '@/types/notarySummary.types';
import { formatCurrencyWithCents } from '@/utils/notarySummaryHelpers';

export { formatCurrencyWithCents };

const BORDER_COLOR = '#8B1D2C';
const HEADER_BG = '#781726';
const TOTAL_BLUE = '#1E3A8A';

interface SigningTableProps {
  data: NotarySummaryData;
  fincas: NotarySummaryFinca[];
}

const NotarySigningTable: React.FC<SigningTableProps> = ({ data, fincas }) => (
  <div style={{ marginBottom: '36px' }}>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: `1.2px solid ${BORDER_COLOR}`,
        fontSize: '13.5px',
      }}
    >
      <tbody>
        <tr>
          <td style={{ width: '26%', padding: '7px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            Fecha firma:
          </td>
          <td style={{ padding: '7px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            {data.signingDate || 'Pendiente de fijar'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '7px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            Hora firma:
          </td>
          <td style={{ padding: '7px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            {data.signingTime || 'Pendiente de fijar'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '7px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            Notaría:
          </td>
          <td style={{ padding: '7px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            {data.notaryName || 'Por designar'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '7px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            Dirección:
          </td>
          <td style={{ padding: '7px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            {data.notaryAddress || '—'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '7px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            Oficial:
          </td>
          <td style={{ padding: '7px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            {data.notaryOfficer || '—'}
          </td>
        </tr>
        {fincas.map((finca) => (
          <tr key={finca.id}>
            <td style={{ padding: '7px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
              {finca.label.endsWith(':') ? finca.label : `${finca.label}:`}
            </td>
            <td style={{ padding: '7px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
              {finca.registryDescription || 'Inscripción registral en trámite'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface PaymentTableProps {
  data: NotarySummaryData;
  fincas: NotarySummaryFinca[];
  effectiveTotal: number;
  effectiveResto: number;
}

const NotaryPaymentsTable: React.FC<PaymentTableProps> = ({
  data,
  fincas,
  effectiveTotal,
  effectiveResto,
}) => (
  <div>
    <div
      style={{
        marginBottom: '10px',
        fontSize: '14.5px',
        fontWeight: 800,
        color: '#0f172a',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      RESUMEN DE PAGOS DE LA COMPRAVENTA
    </div>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: `1.2px solid ${BORDER_COLOR}`,
        fontSize: '13.5px',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: HEADER_BG, color: '#ffffff' }}>
          <th style={{ width: '28%', padding: '8px 12px', textAlign: 'left', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, fontSize: '13px' }}>
            CONCEPTO
          </th>
          <th style={{ width: '44%', padding: '8px 12px', textAlign: 'left', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, fontSize: '13px' }}>
            DETALLE
          </th>
          <th style={{ width: '28%', padding: '8px 12px', textAlign: 'right', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, fontSize: '13px' }}>
            IMPORTE
          </th>
        </tr>
      </thead>
      <tbody>
        {fincas.map((finca) => (
          <tr key={`payment-${finca.id}`}>
            <td style={{ padding: '8px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
              PRECIO VENTA
            </td>
            <td style={{ padding: '8px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
              {finca.label.replace(':', '')}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrencyWithCents(finca.price)}
            </td>
          </tr>
        ))}

        {fincas.length === 0 && (
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
              PRECIO VENTA
            </td>
            <td style={{ padding: '8px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
              Inmueble
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrencyWithCents(effectiveTotal)}
            </td>
          </tr>
        )}

        <tr style={{ backgroundColor: '#f8fafc' }}>
          <td style={{ padding: '9px 12px', fontWeight: 800, border: `1.2px solid ${BORDER_COLOR}`, color: TOTAL_BLUE }}>
            TOTAL
          </td>
          <td style={{ padding: '9px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            Precio Total Compraventa
          </td>
          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800, border: `1.2px solid ${BORDER_COLOR}`, color: TOTAL_BLUE, fontSize: '14.5px', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrencyWithCents(effectiveTotal)}
          </td>
        </tr>

        <tr>
          <td style={{ padding: '8px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            ARRAS
          </td>
          <td style={{ padding: '8px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            <div>{data.arrasMethod || 'Transferencia'}</div>
            {data.arrasDetail && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {data.arrasDetail}
              </div>
            )}
          </td>
          <td style={{ padding: '8px 12px', textAlign: 'right', border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrencyWithCents(data.arrasAmount)}
          </td>
        </tr>

        <tr>
          <td style={{ padding: '8px 12px', fontWeight: 700, border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a' }}>
            RESTO PAGO
          </td>
          <td style={{ padding: '8px 12px', border: `1.2px solid ${BORDER_COLOR}`, color: '#1e293b' }}>
            <div>{data.remainingMethod || 'Cheque bancario'}</div>
            {data.remainingDetail && (
              <div style={{ whiteSpace: 'pre-line', fontSize: '12.5px', color: '#334155', marginTop: '3px', fontWeight: 500 }}>
                {data.remainingDetail}
              </div>
            )}
          </td>
          <td style={{ padding: '8px 12px', textAlign: 'right', border: `1.2px solid ${BORDER_COLOR}`, color: '#0f172a', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrencyWithCents(effectiveResto)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

interface NotaryOperationSummaryDocumentProps {
  data: NotarySummaryData;
  className?: string;
  isPrintVersion?: boolean;
}

export const NotaryOperationSummaryDocument: React.FC<NotaryOperationSummaryDocumentProps> = ({
  data,
  className = '',
  isPrintVersion = false,
}) => {
  const fincas = data.fincas && data.fincas.length > 0 ? data.fincas : [];
  const calculatedTotal = fincas.reduce((acc, f) => acc + (Number(f.price) || 0), 0);
  const effectiveTotal = data.totalPrice > 0 ? data.totalPrice : calculatedTotal;
  const effectiveResto = data.remainingAmount > 0 
    ? data.remainingAmount 
    : Math.max(0, effectiveTotal - (Number(data.arrasAmount) || 0));

  return (
    <div
      className={`notary-operation-summary-doc bg-white text-slate-900 mx-auto select-text ${className}`}
      style={{
        width: '100%',
        maxWidth: isPrintVersion ? '100%' : '800px',
        padding: isPrintVersion ? '0' : '40px 48px',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
        boxSizing: 'border-box',
        color: '#111827',
      }}
    >
      {/* 1. CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ maxWidth: '240px' }}>
          <img src={TERRAVALL_LOGO_BASE64} alt="TERRAVALL SERVICIOS INMOBILIARIOS" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: BORDER_COLOR, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            RESUMEN DE OPERACIÓN
          </h1>
        </div>
      </div>

      {/* 2. SUBTÍTULO */}
      <div style={{ textAlign: 'center', marginBottom: '28px', padding: '0 10px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', lineHeight: 1.45, letterSpacing: '0.01em' }}>
          {data.operationTitle || 'COMPRAVENTA DE INMUEBLE'}
        </h2>
      </div>

      {/* 3. TABLA 1: DATOS FIRMA Y NOTARIA */}
      <NotarySigningTable data={data} fincas={fincas} />

      {/* 4. TABLA 2: RESUMEN DE PAGOS */}
      <NotaryPaymentsTable
        data={data}
        fincas={fincas}
        effectiveTotal={effectiveTotal}
        effectiveResto={effectiveResto}
      />

      {/* 5. NOTAS */}
      {data.notes && (
        <div style={{ marginTop: '24px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569' }}>
          <strong style={{ color: '#0f172a' }}>Observaciones para la Notaría:</strong>
          <div style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>{data.notes}</div>
        </div>
      )}
    </div>
  );
};
