import React from 'react';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';
import type { NotarySummaryData } from '@/types/notarySummary.types';

interface NotaryOperationSummaryDocumentProps {
  data: NotarySummaryData;
  className?: string;
  isPrintVersion?: boolean;
}

export const formatCurrencyWithCents = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '0,00 €';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return '0,00 €';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

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

  const borderColor = '#8B1D2C'; // Terravall corporate maroon/burgundy
  const headerBg = '#781726'; // Dark burgundy for table headers
  const totalBlue = '#1E3A8A'; // Corporate deep blue for total row

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
      {/* 1. CABECERA: LOGO + TÍTULO CORPORATIVO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div style={{ maxWidth: '240px' }}>
          <img
            src={TERRAVALL_LOGO_BASE64}
            alt="TERRAVALL SERVICIOS INMOBILIARIOS"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        <div style={{ textAlign: 'right' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 800,
              color: borderColor,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            RESUMEN DE OPERACIÓN
          </h1>
        </div>
      </div>

      {/* 2. SUBTÍTULO: OBJETO Y DIRECCIÓN DE LA COMPRAVENTA */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '28px',
          padding: '0 10px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 800,
            color: '#0f172a',
            textTransform: 'uppercase',
            lineHeight: 1.45,
            letterSpacing: '0.01em',
          }}
        >
          {data.operationTitle || 'COMPRAVENTA DE INMUEBLE'}
        </h2>
      </div>

      {/* 3. TABLA 1: DATOS DE FIRMA, NOTARÍA E INMUEBLES */}
      <div style={{ marginBottom: '36px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: `1.2px solid ${borderColor}`,
            fontSize: '13.5px',
          }}
        >
          <tbody>
            {/* Fecha firma */}
            <tr>
              <td
                style={{
                  width: '26%',
                  padding: '7px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                Fecha firma:
              </td>
              <td
                style={{
                  padding: '7px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                {data.signingDate || 'Pendiente de fijar'}
              </td>
            </tr>

            {/* Hora firma */}
            <tr>
              <td
                style={{
                  padding: '7px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                Hora firma:
              </td>
              <td
                style={{
                  padding: '7px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                {data.signingTime || 'Pendiente de fijar'}
              </td>
            </tr>

            {/* Notaría */}
            <tr>
              <td
                style={{
                  padding: '7px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                Notaría:
              </td>
              <td
                style={{
                  padding: '7px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                {data.notaryName || 'Por designar'}
              </td>
            </tr>

            {/* Dirección */}
            <tr>
              <td
                style={{
                  padding: '7px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                Dirección:
              </td>
              <td
                style={{
                  padding: '7px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                {data.notaryAddress || '—'}
              </td>
            </tr>

            {/* Oficial */}
            <tr>
              <td
                style={{
                  padding: '7px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                Oficial:
              </td>
              <td
                style={{
                  padding: '7px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                {data.notaryOfficer || '—'}
              </td>
            </tr>

            {/* Filas Dinámicas por Finca Registral */}
            {fincas.map((finca) => {
              const label = finca.label.endsWith(':') ? finca.label : `${finca.label}:`;
              return (
                <tr key={finca.id}>
                  <td
                    style={{
                      padding: '7px 12px',
                      fontWeight: 700,
                      border: `1.2px solid ${borderColor}`,
                      color: '#0f172a',
                      verticalAlign: 'middle',
                    }}
                  >
                    {label}
                  </td>
                  <td
                    style={{
                      padding: '7px 12px',
                      border: `1.2px solid ${borderColor}`,
                      color: '#1e293b',
                      verticalAlign: 'middle',
                    }}
                  >
                    {finca.registryDescription || 'Inscripción registral en trámite'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. TABLA 2: RESUMEN DE PAGOS DE LA COMPRAVENTA */}
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
            border: `1.2px solid ${borderColor}`,
            fontSize: '13.5px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: headerBg, color: '#ffffff' }}>
              <th
                style={{
                  width: '28%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                }}
              >
                CONCEPTO
              </th>
              <th
                style={{
                  width: '44%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                }}
              >
                DETALLE
              </th>
              <th
                style={{
                  width: '28%',
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                }}
              >
                IMPORTE
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Filas de Precio de Venta por Finca */}
            {fincas.map((finca) => (
              <tr key={`payment-${finca.id}`}>
                <td
                  style={{
                    padding: '8px 12px',
                    fontWeight: 700,
                    border: `1.2px solid ${borderColor}`,
                    color: '#0f172a',
                    verticalAlign: 'middle',
                  }}
                >
                  PRECIO VENTA
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    border: `1.2px solid ${borderColor}`,
                    color: '#1e293b',
                    verticalAlign: 'middle',
                  }}
                >
                  {finca.label.replace(':', '')}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    border: `1.2px solid ${borderColor}`,
                    color: '#0f172a',
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                    verticalAlign: 'middle',
                  }}
                >
                  {formatCurrencyWithCents(finca.price)}
                </td>
              </tr>
            ))}

            {/* Si no hubiera fincas desglosadas, mostrar fila genérica */}
            {fincas.length === 0 && (
              <tr>
                <td
                  style={{
                    padding: '8px 12px',
                    fontWeight: 700,
                    border: `1.2px solid ${borderColor}`,
                    color: '#0f172a',
                  }}
                >
                  PRECIO VENTA
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    border: `1.2px solid ${borderColor}`,
                    color: '#1e293b',
                  }}
                >
                  Inmueble
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    border: `1.2px solid ${borderColor}`,
                    color: '#0f172a',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatCurrencyWithCents(effectiveTotal)}
                </td>
              </tr>
            )}

            {/* Fila TOTAL COMPRAVENTA (Destacada en azul corporativo) */}
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td
                style={{
                  padding: '9px 12px',
                  fontWeight: 800,
                  border: `1.2px solid ${borderColor}`,
                  color: totalBlue,
                  verticalAlign: 'middle',
                }}
              >
                TOTAL
              </td>
              <td
                style={{
                  padding: '9px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                Precio Total Compraventa
              </td>
              <td
                style={{
                  padding: '9px 12px',
                  textAlign: 'right',
                  fontWeight: 800,
                  border: `1.2px solid ${borderColor}`,
                  color: totalBlue,
                  fontSize: '14.5px',
                  fontVariantNumeric: 'tabular-nums',
                  verticalAlign: 'middle',
                }}
              >
                {formatCurrencyWithCents(effectiveTotal)}
              </td>
            </tr>

            {/* Fila ARRAS */}
            <tr>
              <td
                style={{
                  padding: '8px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                ARRAS
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                <div>{data.arrasMethod || 'Transferencia'}</div>
                {data.arrasDetail && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {data.arrasDetail}
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  verticalAlign: 'middle',
                }}
              >
                {formatCurrencyWithCents(data.arrasAmount)}
              </td>
            </tr>

            {/* Fila RESTO PAGO */}
            <tr>
              <td
                style={{
                  padding: '8px 12px',
                  fontWeight: 700,
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  verticalAlign: 'middle',
                }}
              >
                RESTO PAGO
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  border: `1.2px solid ${borderColor}`,
                  color: '#1e293b',
                  verticalAlign: 'middle',
                }}
              >
                <div>{data.remainingMethod || 'Cheque bancario'}</div>
                {data.remainingDetail && (
                  <div
                    style={{
                      whiteSpace: 'pre-line',
                      fontSize: '12.5px',
                      color: '#334155',
                      marginTop: '3px',
                      fontWeight: 500,
                    }}
                  >
                    {data.remainingDetail}
                  </div>
                )}
              </td>
              <td
                style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  border: `1.2px solid ${borderColor}`,
                  color: '#0f172a',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  verticalAlign: 'middle',
                }}
              >
                {formatCurrencyWithCents(effectiveResto)}
              </td>
            </tr>

            {/* Filas Adicionales si las hubiese (ej. retención hipotecaria) */}
            {data.customPaymentRows && data.customPaymentRows.map((row) => (
              <tr key={row.id}>
                <td
                  style={{
                    padding: '8px 12px',
                    fontWeight: 700,
                    border: `1.2px solid ${borderColor}`,
                    color: '#0f172a',
                    verticalAlign: 'middle',
                  }}
                >
                  {row.concept}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    border: `1.2px solid ${borderColor}`,
                    color: '#1e293b',
                    whiteSpace: 'pre-line',
                    verticalAlign: 'middle',
                  }}
                >
                  {row.detail}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    border: `1.2px solid ${borderColor}`,
                    color: '#0f172a',
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                    verticalAlign: 'middle',
                  }}
                >
                  {formatCurrencyWithCents(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notas o aclaraciones adicionales al pie (opcional) */}
      {data.notes && (
        <div
          style={{
            marginTop: '24px',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#475569',
          }}
        >
          <strong style={{ color: '#0f172a' }}>Observaciones para la Notaría:</strong>
          <div style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>{data.notes}</div>
        </div>
      )}
    </div>
  );
};
