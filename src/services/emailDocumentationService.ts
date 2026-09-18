import { supabase } from '@/lib/supabase';
import type { PropertyDocument, DocumentationEmail, EmailRecipientType } from '@/schema/property.schema';

export interface SendDocumentationEmailParams {
  propertyId: string;
  propertyTitle?: string;
  propertyAddress?: string;
  propertyCadastralRef?: string;
  propertyRegistryCity?: string;
  propertyRegistryNumber?: string;
  propertyRegistryEstate?: string;
  sellers?: Array<{ name: string; dni?: string }>;
  buyers?: Array<{ name: string; dni?: string }>;
  recipientType: EmailRecipientType;
  recipientName: string;
  recipientEmail: string;
  ccEmails?: string;
  subject: string;
  messageBody?: string;
  selectedDocuments: PropertyDocument[];
}

export interface SendEmailResult {
  success: boolean;
  mode: 'api' | 'simulated';
  status: 'sent' | 'simulated' | 'failed';
  message: string;
  emailId?: string;
}

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Generador del HTML corporativo para el correo a Notaría / Banco / Gestoría
 */
export const generateDocumentationEmailHtml = (params: SendDocumentationEmailParams): string => {
  const {
    propertyTitle,
    propertyAddress,
    propertyCadastralRef,
    propertyRegistryCity,
    propertyRegistryNumber,
    propertyRegistryEstate,
    sellers = [],
    buyers = [],
    recipientName,
    messageBody,
    selectedDocuments
  } = params;

  const docsHtml = selectedDocuments.map((doc, idx) => {
    const categoryLabel = 
      doc.category === 'vendedor' ? 'Vendedor' :
      doc.category === 'comprador' ? 'Comprador' :
      doc.category === 'proceso' ? 'Proceso / Arras' : 'Otros';

    const categoryBadgeColor = 
      doc.category === 'vendedor' ? '#0f766e' :
      doc.category === 'comprador' ? '#2563eb' :
      doc.category === 'proceso' ? '#059669' : '#d97706';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 14px; font-size: 13px; color: #64748b; font-weight: bold; width: 32px; text-align: center;">
          ${idx + 1}
        </td>
        <td style="padding: 12px 14px;">
          <span style="display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; background-color: #f1f5f9; color: ${categoryBadgeColor}; margin-bottom: 4px;">
            ${categoryLabel}
          </span>
          <div style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 2px;">
            ${doc.title}
          </div>
          <div style="font-size: 12px; color: #64748b;">
            ${doc.file_name} &bull; <span style="font-family: monospace;">${formatFileSize(doc.file_size)}</span>
          </div>
        </td>
        <td style="padding: 12px 14px; text-align: right; vertical-align: middle;">
          <a href="${doc.file_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; padding: 7px 14px; border-radius: 6px;">
            Descargar documento
          </a>
        </td>
      </tr>
    `;
  }).join('');

  const sellersText = sellers.length > 0 
    ? sellers.map(s => `<strong>${s.name}</strong>${s.dni ? ` (DNI/CIF: ${s.dni})` : ''}`).join(', ')
    : 'No especificado';

  const buyersText = buyers.length > 0 
    ? buyers.map(b => `<strong>${b.name}</strong>${b.dni ? ` (DNI/CIF: ${b.dni})` : ''}`).join(', ')
    : 'No especificado';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${params.subject}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- CABECERA CORPORATIVA -->
    <div style="background-color: #0f766e; padding: 24px 30px; color: #ffffff;">
      <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px;">
        TERRAVALL INMOBILIARIA
      </div>
      <div style="font-size: 13px; opacity: 0.9;">
        Expediente de Compraventa &bull; Gestión y Custodia Documental
      </div>
    </div>

    <!-- CUERPO PRINCIPAL -->
    <div style="padding: 30px;">
      
      <!-- SALUDO -->
      <div style="font-size: 15px; margin-bottom: 20px; color: #1e293b; line-height: 1.5;">
        Estimado/a <strong>${recipientName || 'señor/a'}</strong>,
      </div>

      <!-- MENSAJE PERSONALIZADO -->
      ${messageBody ? `
        <div style="background-color: #f8fafc; border-left: 4px solid #0f766e; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
          ${messageBody.replace(/\n/g, '<br/>')}
        </div>
      ` : ''}

      <!-- FICHA RESUMEN DEL INMUEBLE Y PARTES -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px 20px; margin-bottom: 26px;">
        <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px;">
          Datos del Expediente
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          ${propertyTitle ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 140px;">Inmueble:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${propertyTitle}</td>
          </tr>` : ''}
          ${propertyAddress ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Dirección:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${propertyAddress}</td>
          </tr>` : ''}
          ${propertyCadastralRef ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Ref. Catastral:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a; font-family: monospace;">${propertyCadastralRef}</td>
          </tr>` : ''}
          ${(propertyRegistryCity || propertyRegistryEstate) ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Datos Registrales:</td>
            <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">
              ${propertyRegistryEstate ? `Finca nº ${propertyRegistryEstate}` : ''}
              ${propertyRegistryCity ? ` &bull; Registro de la Propiedad de ${propertyRegistryCity}` : ''}
              ${propertyRegistryNumber ? ` (Nº ${propertyRegistryNumber})` : ''}
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Parte Vendedora:</td>
            <td style="padding: 4px 0; color: #0f172a;">${sellersText}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Parte Compradora:</td>
            <td style="padding: 4px 0; color: #0f172a;">${buyersText}</td>
          </tr>
        </table>
      </div>

      <!-- TABLA DE DOCUMENTOS -->
      <div style="margin-bottom: 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: #0f172a;">
            Documentación Aportada (${selectedDocuments.length} archivos)
          </h3>
        </div>

        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
              <th style="padding: 10px 14px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">#</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Documento</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; text-align: right;">Acceso</th>
            </tr>
          </thead>
          <tbody>
            ${docsHtml}
          </tbody>
        </table>
      </div>

      <!-- AVISO DE DESCARGA SEGURA -->
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #065f46; line-height: 1.5; margin-bottom: 26px;">
        <strong>Custodia y Enlaces Seguros:</strong> Los enlaces de descarga directa son seguros, de alta disponibilidad y permiten descargar cada archivo individualmente en su formato original sin límite de tamaño ni restricciones por cortafuegos corporativos.
      </div>

      <!-- DESPEDIDA -->
      <div style="font-size: 14px; line-height: 1.5; color: #334155; margin-bottom: 20px;">
        Quedamos a su entera disposición para cualquier aclaración o solicitud de documentación adicional que precisen.
        <br/><br/>
        Atentamente,<br/>
        <strong>Departamento de Gestión Documental</strong><br/>
        Terravall Inmobiliaria
      </div>

    </div>

    <!-- PIE LEGAL / RGPD -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
      <p style="margin: 0 0 8px 0;">
        <strong>AVISO DE CONFIDENCIALIDAD:</strong> Este correo electrónico y los archivos adjuntos o enlazados son confidenciales y están dirigidos exclusivamente a la Notaría, Entidad Financiera o destinatario indicado. Si ha recibido este mensaje por error, le rogamos proceda a su eliminación inmediata y nos lo notifique.
      </p>
      <p style="margin: 0;">
        Terravall Inmobiliaria &bull; Paseo de Zorrilla 48, 47006 Valladolid &bull; Tel: 983 12 34 56 &bull; info@terravall.com
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Obtener configuración de correo (de agency_settings o env)
 */
const getEmailConfiguration = async () => {
  try {
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error || !data) {
      return {
        brevoApiKey: import.meta.env.VITE_BREVO_API_KEY || '',
        resendApiKey: import.meta.env.VITE_RESEND_API_KEY || '',
        senderEmail: import.meta.env.VITE_EMAIL_SENDER || 'info@terravall.com',
        senderName: 'Terravall Inmobiliaria'
      };
    }

    return {
      brevoApiKey: data.brevo_api_key || import.meta.env.VITE_BREVO_API_KEY || '',
      resendApiKey: data.resend_api_key || import.meta.env.VITE_RESEND_API_KEY || '',
      senderEmail: data.email || import.meta.env.VITE_EMAIL_SENDER || 'info@terravall.com',
      senderName: data.commercial_name || data.name || 'Terravall Inmobiliaria'
    };
  } catch {
    return {
      brevoApiKey: import.meta.env.VITE_BREVO_API_KEY || '',
      resendApiKey: import.meta.env.VITE_RESEND_API_KEY || '',
      senderEmail: 'info@terravall.com',
      senderName: 'Terravall Inmobiliaria'
    };
  }
};

/**
 * Función principal para enviar el correo y registrarlo en el historial
 */
export const sendDocumentationEmail = async (
  params: SendDocumentationEmailParams
): Promise<SendEmailResult> => {
  const htmlContent = generateDocumentationEmailHtml(params);
  const config = await getEmailConfiguration();

  let emailStatus: 'sent' | 'simulated' | 'failed' = 'simulated';
  let mode: 'api' | 'simulated' = 'simulated';
  let resultMessage = '';
  let errorMessage: string | null = null;

  // Preparar lista de documentos seleccionados para el JSONB
  const docsData = params.selectedDocuments.map(d => ({
    id: d.id,
    title: d.title,
    file_name: d.file_name,
    file_url: d.file_url,
    file_size: d.file_size,
    category: d.category
  }));

  // Separar emails de copia CC si existen
  const ccArray = params.ccEmails
    ? params.ccEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    : [];

  try {
    // 1. Intentar envío vía Brevo API si hay API key configurada
    if (config.brevoApiKey) {
      mode = 'api';
      const brevoPayload = {
        sender: {
          name: config.senderName,
          email: config.senderEmail
        },
        to: [
          {
            email: params.recipientEmail.trim(),
            name: params.recipientName.trim() || undefined
          }
        ],
        ...(ccArray.length > 0 && {
          cc: ccArray.map(email => ({ email }))
        }),
        subject: params.subject,
        htmlContent: htmlContent
      };

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': config.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(brevoPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${response.status} en Brevo API`);
      }

      emailStatus = 'sent';
      resultMessage = `Correo enviado con éxito a ${params.recipientEmail} vía Brevo API.`;
    } 
    // 2. Si no hay API key todavía, ejecutar en modo de Simulación y Registro
    else {
      mode = 'simulated';
      emailStatus = 'simulated';
      resultMessage = `Envío registrado correctamente en el historial para ${params.recipientEmail}. (Modo simulación: para activar el envío automático real por servidor, introduce tu API key de Brevo en Ajustes).`;
    }

  } catch (err: unknown) {
    emailStatus = 'failed';
    errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar el correo';
    resultMessage = `Error en el envío: ${errorMessage}`;
  }

  // 3. Registrar el envío en la tabla 'documentation_emails'
  let savedId: string | undefined;
  try {
    const { data: insertedData, error: dbError } = await supabase
      .from('documentation_emails')
      .insert({
        property_id: params.propertyId,
        recipient_type: params.recipientType,
        recipient_name: params.recipientName.trim() || null,
        recipient_email: params.recipientEmail.trim(),
        cc_emails: params.ccEmails?.trim() || null,
        subject: params.subject,
        message_body: params.messageBody || null,
        selected_documents: docsData,
        status: emailStatus,
        error_message: errorMessage
      })
      .select('id')
      .single();

    if (!dbError && insertedData) {
      savedId = insertedData.id;
    }
  } catch (dbErr) {
    console.error('Error al guardar en documentation_emails:', dbErr);
  }

  return {
    success: emailStatus !== 'failed',
    mode,
    status: emailStatus,
    message: resultMessage,
    emailId: savedId
  };
};

/**
 * Cargar el historial de envíos de un inmueble
 */
export const fetchDocumentationEmailHistory = async (propertyId: string): Promise<DocumentationEmail[]> => {
  try {
    const { data, error } = await supabase
      .from('documentation_emails')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar historial de envíos:', error);
      return [];
    }

    return (data as DocumentationEmail[]) || [];
  } catch (err) {
    console.error('Excepción al cargar historial de envíos:', err);
    return [];
  }
};
