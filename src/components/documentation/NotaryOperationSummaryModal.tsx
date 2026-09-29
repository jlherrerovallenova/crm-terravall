import React, { useState, useEffect, useId } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Edit3, 
  Eye, 
  Save, 
  Plus, 
  Trash2, 
  FileText, 
  Building2, 
  Euro, 
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { 
  NotaryOperationSummaryDocument, 
  formatCurrencyWithCents 
} from './NotaryOperationSummaryDocument';
import type { NotarySummaryData, NotarySummaryFinca } from '@/types/notarySummary.types';
import { TERRAVALL_LOGO_BASE64 } from '@/assets/logoBase64';

interface NotaryOperationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyData?: any;
  onSaved?: (data: NotarySummaryData) => void;
}

export const NotaryOperationSummaryModal: React.FC<NotaryOperationSummaryModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyData,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generador de IDs únicos para nuevas fincas en el formulario
  const uniquePrefix = useId();

  // Función constructora del estado inicial con fallback inteligente a arras_contract_data / fincas_data / propertyData
  const buildInitialData = (): NotarySummaryData => {
    // 1. Si ya se guardó previamente notary_summary_data
    if (propertyData?.notary_summary_data) {
      return propertyData.notary_summary_data as NotarySummaryData;
    }
    if (propertyData?.arras_contract_data?.notary_summary_data) {
      return propertyData.arras_contract_data.notary_summary_data as NotarySummaryData;
    }

    const arras = propertyData?.arras_contract_data || {};
    const rawFincas = propertyData?.fincas_data || arras.fincas || [];

    // Fincas desglosadas
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
      // Finca única por defecto
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

    // Título de la operación
    const street = propertyData?.address_hidden || propertyData?.address_street || propertyData?.title || 'Inmueble';
    const city = propertyData?.city || 'Valladolid';
    const elementsNames = parsedFincas.map(f => f.label.toUpperCase()).join(' Y ');
    const autoTitle = `COMPRAVENTA DE ${elementsNames || 'LA VIVIENDA'} EN ${street.toUpperCase()} (${city.toUpperCase()})`;

    // Compradores
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

  const [formData, setFormData] = useState<NotarySummaryData>(buildInitialData());

  useEffect(() => {
    if (isOpen) {
      setFormData(buildInitialData());
      setSaveSuccess(false);
    }
  }, [isOpen, propertyData]);

  if (!isOpen) return null;

  // Actualizar un campo general
  const handleFieldChange = <K extends keyof NotarySummaryData>(field: K, value: NotarySummaryData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Modificar Fincas
  const handleFincaChange = (id: string, field: keyof NotarySummaryFinca, value: any) => {
    setFormData(prev => {
      const updatedFincas = prev.fincas.map(f => {
        if (f.id === id) {
          return { ...f, [field]: value };
        }
        return f;
      });

      // Si se modifica el precio de una finca, recalcular el total
      const newTotal = updatedFincas.reduce((acc, f) => acc + (Number(f.price) || 0), 0);
      const newResto = Math.max(0, newTotal - (Number(prev.arrasAmount) || 0));

      return {
        ...prev,
        fincas: updatedFincas,
        totalPrice: newTotal > 0 ? newTotal : prev.totalPrice,
        remainingAmount: newResto,
      };
    });
  };

  const handleAddFinca = () => {
    const newId = `${uniquePrefix}-finca-${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      fincas: [
        ...prev.fincas,
        {
          id: newId,
          label: 'Elemento Anexo',
          registryDescription: 'Inscrita en el Registro de la Propiedad...',
          price: 0,
        },
      ],
    }));
  };

  const handleRemoveFinca = (id: string) => {
    setFormData(prev => {
      const updated = prev.fincas.filter(f => f.id !== id);
      const newTotal = updated.reduce((acc, f) => acc + (Number(f.price) || 0), 0);
      const newResto = Math.max(0, newTotal - (Number(prev.arrasAmount) || 0));
      return {
        ...prev,
        fincas: updated,
        totalPrice: newTotal > 0 ? newTotal : prev.totalPrice,
        remainingAmount: newResto,
      };
    });
  };

  // Guardar en Supabase
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave: NotarySummaryData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      // Guardar en la columna dedicada y también mantener copia en arras_contract_data para máxima resiliencia
      const currentArras = propertyData?.arras_contract_data || {};
      const updatedArras = {
        ...currentArras,
        notary_summary_data: dataToSave,
      };

      const { error } = await supabase
        .from('properties')
        .update({
          notary_summary_data: dataToSave,
          arras_contract_data: updatedArras,
        })
        .eq('id', propertyId);

      if (error) {
        // Si la columna notary_summary_data aún no se ha ejecutado en Supabase, guardar al menos en arras_contract_data
        console.warn('Fallback al guardar notary_summary_data:', error.message);
        const fallbackRes = await supabase
          .from('properties')
          .update({
            arras_contract_data: updatedArras,
          })
          .eq('id', propertyId);

        if (fallbackRes.error) throw fallbackRes.error;
      }

      setSaveSuccess(true);
      if (onSaved) onSaved(dataToSave);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('preview');
      }, 1200);
    } catch (err: unknown) {
      console.error('Error al guardar el resumen de operación:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`No se pudo guardar: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Copiar resumen en formato texto plano limpio
  const handleCopyText = () => {
    const fincasText = formData.fincas
      .map(f => `${f.label}: ${f.registryDescription} (Precio: ${formatCurrencyWithCents(f.price)})`)
      .join('\n');

    const textToCopy = `RESUMEN DE OPERACIÓN - TERRAVALL
${formData.operationTitle}
--------------------------------------------------
DATOS DE FIRMA Y NOTARÍA:
- Fecha firma: ${formData.signingDate}
- Hora firma: ${formData.signingTime}
- Notaría: ${formData.notaryName}
- Dirección: ${formData.notaryAddress}
- Oficial: ${formData.notaryOfficer}

INMUEBLES / FINCAS REGISTRALES:
${fincasText}

RESUMEN DE PAGOS DE LA COMPRAVENTA:
- Precio Total: ${formatCurrencyWithCents(formData.totalPrice)}
- Arras: ${formatCurrencyWithCents(formData.arrasAmount)} (${formData.arrasMethod})
- Resto a Pagar: ${formatCurrencyWithCents(formData.remainingAmount)} (${formData.remainingMethod}${formData.remainingDetail ? ' - ' + formData.remainingDetail : ''})
${formData.notes ? '\nOBSERVACIONES:\n' + formData.notes : ''}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Imprimir / Generar PDF con ventana optimizada
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=950,height=800');
    if (!printWindow) {
      alert('Por favor, permite ventanas emergentes en tu navegador para generar el PDF.');
      return;
    }

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

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Resumen de Operación - ${formData.operationTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 18mm 16mm 18mm 16mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .btn-print {
            background-color: #8B1D2C;
            color: #ffffff;
            border: none;
            padding: 10px 22px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #701422;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0;
            }
            @page {
              margin: 16mm 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>

        <div style="max-width: 800px; margin: 0 auto;">
          <!-- CABECERA -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
            <div style="max-width: 240px;">
              <img src="${TERRAVALL_LOGO_BASE64}" alt="TERRAVALL" style="width: 100%; height: auto; display: block;" />
            </div>
            <div style="text-align: right;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #8B1D2C; letter-spacing: 0.04em; text-transform: uppercase;">
                RESUMEN DE OPERACIÓN
              </h1>
            </div>
          </div>

          <!-- SUBTÍTULO -->
          <div style="text-align: center; margin-bottom: 28px; padding: 0 10px;">
            <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1.45; letter-spacing: 0.01em;">
              ${formData.operationTitle}
            </h2>
          </div>

          <!-- TABLA 1: DATOS FIRMA Y NOTARIA -->
          <div style="margin-bottom: 36px;">
            <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #8B1D2C; font-size: 13.5px;">
              <tbody>
                <tr>
                  <td style="width: 26%; padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    Fecha firma:
                  </td>
                  <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
                    ${formData.signingDate || 'Pendiente de fijar'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    Hora firma:
                  </td>
                  <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
                    ${formData.signingTime || 'Pendiente de fijar'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    Notaría:
                  </td>
                  <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
                    ${formData.notaryName || 'Por designar'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    Dirección:
                  </td>
                  <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
                    ${formData.notaryAddress || '—'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 7px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    Oficial:
                  </td>
                  <td style="padding: 7px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
                    ${formData.notaryOfficer || '—'}
                  </td>
                </tr>
                ${fincasRowsHtml}
              </tbody>
            </table>
          </div>

          <!-- TABLA 2: RESUMEN DE PAGOS -->
          <div>
            <div style="margin-bottom: 10px; font-size: 14.5px; font-weight: 800; color: #0f172a; letter-spacing: 0.02em; text-transform: uppercase;">
              RESUMEN DE PAGOS DE LA COMPRAVENTA
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1.2px solid #8B1D2C; font-size: 13.5px;">
              <thead>
                <tr style="background-color: #781726; color: #ffffff;">
                  <th style="width: 28%; padding: 8px 12px; text-align: left; font-weight: 700; border: 1.2px solid #8B1D2C; font-size: 13px; letter-spacing: 0.02em;">
                    CONCEPTO
                  </th>
                  <th style="width: 44%; padding: 8px 12px; text-align: left; font-weight: 700; border: 1.2px solid #8B1D2C; font-size: 13px; letter-spacing: 0.02em;">
                    DETALLE
                  </th>
                  <th style="width: 28%; padding: 8px 12px; text-align: right; font-weight: 700; border: 1.2px solid #8B1D2C; font-size: 13px; letter-spacing: 0.02em;">
                    IMPORTE
                  </th>
                </tr>
              </thead>
              <tbody>
                ${fincasPaymentsHtml}
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 9px 12px; font-weight: 800; border: 1.2px solid #8B1D2C; color: #1E3A8A; vertical-align: middle;">
                    TOTAL
                  </td>
                  <td style="padding: 9px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    Precio Total Compraventa
                  </td>
                  <td style="padding: 9px 12px; text-align: right; font-weight: 800; border: 1.2px solid #8B1D2C; color: #1E3A8A; font-size: 14.5px; font-variant-numeric: tabular-nums; vertical-align: middle;">
                    ${formatCurrencyWithCents(effectiveTotal)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    ARRAS
                  </td>
                  <td style="padding: 8px 12px; border: 1.2px solid #8B1D2C; color: #1e293b; vertical-align: middle;">
                    <div>${formData.arrasMethod || 'Transferencia'}</div>
                    ${formData.arrasDetail ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${formData.arrasDetail}</div>` : ''}
                  </td>
                  <td style="padding: 8px 12px; text-align: right; border: 1.2px solid #8B1D2C; color: #0f172a; font-weight: 500; font-variant-numeric: tabular-nums; vertical-align: middle;">
                    ${formatCurrencyWithCents(formData.arrasAmount)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: 700; border: 1.2px solid #8B1D2C; color: #0f172a; vertical-align: middle;">
                    RESTO PAGO
                  </td>
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
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B1D2C]/30 text-rose-300 rounded-lg">
              <FileCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg leading-snug">
                  Ficha Resumen de la Operación (Guía Notaría)
                </h2>
                <span className="text-[11px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded-full border border-rose-800/80 font-semibold uppercase tracking-wider">
                  Notaría & Firma
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Documento ejecutivo con datos de otorgamiento, fincas registrales y desglose de medios de pago.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pestañas de Vista */}
            <div className="flex bg-slate-800 p-1 rounded-xl mr-2 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye size={14} />
                <span>Vista Previa & PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 size={14} />
                <span>Editar Datos</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Acciones Rápidas */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Inmueble: <strong className="text-slate-700">{propertyData?.title || propertyData?.city || 'Expediente'}</strong>
            </span>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full animate-in fade-in">
                <CheckCircle2 size={13} />
                <span>Guardado correctamente</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleCopyText}
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </Button>

            <Button
              type="button"
              onClick={handlePrint}
              size="sm"
              className="text-xs h-8 gap-1.5 bg-[#8B1D2C] hover:bg-[#721523] text-white font-bold shadow-xs cursor-pointer"
              title="Abre ventana lista para imprimir o descargar en PDF (A4)"
            >
              <Printer size={14} />
              <span>Imprimir / Descargar en PDF</span>
            </Button>

            {activeTab === 'edit' && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                <Save size={14} />
                <span>{isSaving ? 'Guardando...' : 'Guardar Ficha'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Contenido según Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          {activeTab === 'preview' ? (
            /* VISTA PREVIA FORMATO HOJA A4 */
            <div className="flex justify-center">
              <div className="bg-white rounded-xl shadow-md border border-slate-200/80 w-full max-w-[820px] transition-all">
                <NotaryOperationSummaryDocument data={formData} />
              </div>
            </div>
          ) : (
            /* FORMULARIO DE EDICIÓN */
            <div className="max-w-4xl mx-auto space-y-6">
              {/* 1. DATOS DE FIRMA Y NOTARÍA */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
                  <Building2 className="w-5 h-5 text-[#8B1D2C]" />
                  <h3 className="font-bold text-sm">1. Datos de Firma y Notaría</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Fecha de Firma
                    </Label>
                    <Input
                      type="text"
                      value={formData.signingDate}
                      onChange={e => handleFieldChange('signingDate', e.target.value)}
                      placeholder="ej: Día 7 de septiembre de 2026"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Hora de Firma
                    </Label>
                    <Input
                      type="text"
                      value={formData.signingTime}
                      onChange={e => handleFieldChange('signingTime', e.target.value)}
                      placeholder="ej: 9:30 am ó 10:00 h"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Notaría (Notario/a)
                    </Label>
                    <Input
                      type="text"
                      value={formData.notaryName}
                      onChange={e => handleFieldChange('notaryName', e.target.value)}
                      placeholder="ej: D. Javier Gómez"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Dirección Notaría
                    </Label>
                    <Input
                      type="text"
                      value={formData.notaryAddress}
                      onChange={e => handleFieldChange('notaryAddress', e.target.value)}
                      placeholder="ej: Calle Miguel Íscar 21, Valladolid"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Oficial Asignado
                    </Label>
                    <Input
                      type="text"
                      value={formData.notaryOfficer}
                      onChange={e => handleFieldChange('notaryOfficer', e.target.value)}
                      placeholder="ej: Olga Salas"
                      className="text-xs h-9 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. OBJETO DE LA COMPRAVENTA Y FINCAS REGISTRALES */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 text-slate-900">
                    <FileText className="w-5 h-5 text-[#8B1D2C]" />
                    <h3 className="font-bold text-sm">2. Título de la Operación y Fincas Registrales</h3>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddFinca}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-dashed border-rose-300 text-rose-800 hover:bg-rose-50"
                  >
                    <Plus size={13} />
                    <span>Añadir Finca</span>
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    Título Legal de la Operación (Subtítulo en documento)
                  </Label>
                  <Input
                    type="text"
                    value={formData.operationTitle}
                    onChange={e => handleFieldChange('operationTitle', e.target.value)}
                    placeholder="ej: COMPRAVENTA DE LA VIVIENDA Y TRASTERO EN CALLE MANZANA Nº 4, 3º B (VALLADOLID)"
                    className="text-xs h-9 bg-white font-semibold uppercase"
                  />
                </div>

                {/* Lista de Fincas */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Desglose de Fincas ({formData.fincas.length})
                  </div>

                  {formData.fincas.map((finca, idx) => (
                    <div
                      key={finca.id}
                      className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Finca #{idx + 1}
                        </span>

                        {formData.fincas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFinca(finca.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Eliminar esta finca"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                            Denominación / Elemento
                          </Label>
                          <Input
                            type="text"
                            value={finca.label}
                            onChange={e => handleFincaChange(finca.id, 'label', e.target.value)}
                            placeholder="ej: Vivienda, Trastero, Garaje..."
                            className="text-xs h-8 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                            Inscripción Registral
                          </Label>
                          <Input
                            type="text"
                            value={finca.registryDescription}
                            onChange={e => handleFincaChange(finca.id, 'registryDescription', e.target.value)}
                            placeholder="ej: Inscrita en el Registro de la Propiedad TRES de Valladolid. Finca 44106."
                            className="text-xs h-8 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                            Precio Asignado (€)
                          </Label>
                          <Input
                            type="number"
                            value={finca.price || ''}
                            onChange={e => handleFincaChange(finca.id, 'price', Number(e.target.value) || 0)}
                            placeholder="295000"
                            className="text-xs h-8 bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. RESUMEN DE PAGOS DE LA COMPRAVENTA */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2.5">
                  <Euro className="w-5 h-5 text-[#8B1D2C]" />
                  <h3 className="font-bold text-sm">3. Resumen de Pagos y Medios de Otorgamiento</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                  {/* Precio Total */}
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Precio Total Compraventa (€)
                    </Label>
                    <Input
                      type="number"
                      value={formData.totalPrice || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        handleFieldChange('totalPrice', val);
                        handleFieldChange('remainingAmount', Math.max(0, val - (formData.arrasAmount || 0)));
                      }}
                      className="text-xs h-9 bg-white font-bold font-mono text-blue-900"
                    />
                  </div>

                  {/* Arras Importe */}
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Importe Arras / Señal (€)
                    </Label>
                    <Input
                      type="number"
                      value={formData.arrasAmount || ''}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        handleFieldChange('arrasAmount', val);
                        handleFieldChange('remainingAmount', Math.max(0, (formData.totalPrice || 0) - val));
                      }}
                      className="text-xs h-9 bg-white font-mono"
                    />
                  </div>

                  {/* Arras Medio */}
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Medio Pago de Arras
                    </Label>
                    <Input
                      type="text"
                      value={formData.arrasMethod}
                      onChange={e => handleFieldChange('arrasMethod', e.target.value)}
                      placeholder="Transferencia"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  {/* Resto Pago Importe */}
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Resto Pago a Otorgamiento (€)
                    </Label>
                    <Input
                      type="number"
                      value={formData.remainingAmount || ''}
                      onChange={e => handleFieldChange('remainingAmount', Number(e.target.value) || 0)}
                      className="text-xs h-9 bg-white font-mono font-bold"
                    />
                  </div>

                  {/* Resto Medio */}
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Medio del Resto
                    </Label>
                    <Input
                      type="text"
                      value={formData.remainingMethod}
                      onChange={e => handleFieldChange('remainingMethod', e.target.value)}
                      placeholder="Cheque bancario"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  {/* Resto Detalle (Comprador o cheques) */}
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Titular Cheque / Comprador
                    </Label>
                    <Input
                      type="text"
                      value={formData.remainingDetail}
                      onChange={e => handleFieldChange('remainingDetail', e.target.value)}
                      placeholder="Nombre del comprador emisor del cheque"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  {/* Observaciones adicionales */}
                  <div className="md:col-span-12 space-y-1 pt-1">
                    <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Observaciones y Aclaraciones para la Notaría (opcional)
                    </Label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={e => handleFieldChange('notes', e.target.value)}
                      placeholder="Anotaciones relativas a certificados bancarios, llaves, retenciones de IBI o comunidad..."
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción del formulario */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('preview')}
                  className="text-xs h-9 bg-white"
                >
                  Volver a Vista Previa
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
                >
                  <Save size={15} />
                  <span>{isSaving ? 'Guardando en expediente...' : 'Guardar y Aplicar Cambios'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Diseño corporativo oficial de <strong>Terravall Servicios Inmobiliarios</strong>
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 text-slate-600"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 bg-[#8B1D2C] hover:bg-[#721523] text-white font-bold gap-1.5 shadow-xs"
            >
              <Printer size={14} />
              <span>Imprimir / Descargar PDF</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
