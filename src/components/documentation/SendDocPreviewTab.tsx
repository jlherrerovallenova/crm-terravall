import React from 'react';

interface SendDocPreviewTabProps {
  recipientEmail: string;
  subject: string;
  selectedDocsCount: number;
  previewHtml: string;
}

export const SendDocPreviewTab: React.FC<SendDocPreviewTabProps> = ({
  recipientEmail,
  subject,
  selectedDocsCount,
  previewHtml
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div>
          <strong>Para:</strong> {recipientEmail || '(introduce un email)'} &bull; <strong>Asunto:</strong> {subject}
        </div>
        <div className="font-mono text-slate-400">
          {selectedDocsCount} documentos incluidos
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <div 
          className="p-4 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
};
