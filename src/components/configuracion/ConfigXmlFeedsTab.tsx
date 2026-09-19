import React from 'react';
import { FileCode, Eye, Download, Globe, Copy } from 'lucide-react';
import type { PropertyXMLData } from '@/lib/xmlFeedGenerator';

interface ConfigXmlFeedsTabProps {
  properties: PropertyXMLData[];
  xmlTargetPortal: 'all' | 'idealista' | 'fotocasa' | 'web';
  setXmlTargetPortal: (portal: 'all' | 'idealista' | 'fotocasa' | 'web') => void;
  xmlFormat: 'kyero' | 'idealista';
  setXmlFormat: (format: 'kyero' | 'idealista') => void;
  handlePreviewXml: (format: 'kyero' | 'idealista') => void;
  handleGenerateAndDownloadXml: (format: 'kyero' | 'idealista') => void;
  triggerSuccessMessage: (msg: string) => void;
}

export const ConfigXmlFeedsTab: React.FC<ConfigXmlFeedsTabProps> = ({
  properties,
  xmlTargetPortal,
  setXmlTargetPortal,
  xmlFormat,
  setXmlFormat,
  handlePreviewXml,
  handleGenerateAndDownloadXml,
  triggerSuccessMessage,
}) => {
  const idealistaCount = properties.filter(p => p.publish_idealista).length;
  const fotocasaCount = properties.filter(p => p.publish_fotocasa).length;
  const webCount = properties.filter(p => p.publish_web).length;
  const totalPublishedCount = properties.filter(p => p.publish_idealista || p.publish_fotocasa || p.publish_web).length;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header & Metrics */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <FileCode className="text-primary" size={22} />
              Exportación de Feeds XML para Portales
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Genera y descarga en tiempo real el archivo XML listo para importar en **Idealista, Fotocasa, Kyero, Habitaclia** y agregadores nacionales.
            </p>
          </div>
        </div>

        {/* Status Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Idealista</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{idealistaCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">inmuebles listos</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fotocasa</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{fotocasaCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">inmuebles listos</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Web Terravall</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{webCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">inmuebles listos</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-primary/20 bg-primary/5">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Total Sindicados</span>
            <span className="text-2xl font-extrabold text-primary mt-1 block">{totalPublishedCount}</span>
            <span className="text-[11px] text-primary/80 mt-0.5 block">de {properties.length} en cartera</span>
          </div>
        </div>
      </div>

      {/* XML Generator Config Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h4 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">Configurar y Generar Feed XML</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="xml-target-portal-select" className="text-sm font-semibold text-slate-700">Filtrar Inmuebles a Exportar</label>
            <select
              id="xml-target-portal-select"
              aria-label="Filtrar Inmuebles a Exportar"
              value={xmlTargetPortal}
              onChange={(e) => setXmlTargetPortal(e.target.value as any)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">Todos los Inmuebles Marcados para Publicar ({totalPublishedCount})</option>
              <option value="idealista">Solo los marcados para Idealista ({idealistaCount})</option>
              <option value="fotocasa">Solo los marcados para Fotocasa ({fotocasaCount})</option>
              <option value="web">Solo los marcados para Web ({webCount})</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="xml-format-select" className="text-sm font-semibold text-slate-700">Formato del Estándar XML</label>
            <select
              id="xml-format-select"
              aria-label="Formato del Estándar XML"
              value={xmlFormat}
              onChange={(e) => setXmlFormat(e.target.value as any)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="kyero">Kyero V3 (Universal - Idealista, Fotocasa, Kyero, Green-Acres)</option>
              <option value="idealista">Idealista NATIVO XML</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handlePreviewXml(xmlFormat)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Eye size={16} />
            Vista Previa del Código XML
          </button>

          <button
            type="button"
            onClick={() => handleGenerateAndDownloadXml(xmlFormat)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-colors cursor-pointer shadow-md shadow-primary/10"
          >
            <Download size={16} />
            Descargar Fichero XML (.xml)
          </button>
        </div>
      </div>

      {/* Direct Feed URL Box */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Globe size={14} />
            URL Pública del Feed Automático (Sincronización en la nube)
          </span>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">PÚBLICO / SEGURO</span>
        </div>
        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl gap-3 border border-slate-700">
          <code className="text-xs text-slate-300 font-mono break-all select-all">
            {import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-feed?portal={xmlTargetPortal}&amp;format={xmlFormat}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-feed?portal=${xmlTargetPortal}&format=${xmlFormat}`);
              triggerSuccessMessage("¡Enlace del Feed XML copiado al portapapeles!");
            }}
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Copy size={14} />
            Copiar URL
          </button>
        </div>
      </div>
    </div>
  );
};
