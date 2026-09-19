import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';

export interface PortalConfig {
  idealistaClientId: string;
  idealistaClientSecret: string;
  idealistaSync: boolean;
  fotocasaApiKey: string;
  fotocasaOfficeCode: string;
  fotocasaSync: boolean;
}

interface ConfigPortalsTabProps {
  portals: PortalConfig;
  setPortals: React.Dispatch<React.SetStateAction<PortalConfig>>;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  handleSavePortals: (e: React.FormEvent) => void;
}

export const ConfigPortalsTab: React.FC<ConfigPortalsTabProps> = ({
  portals,
  setPortals,
  geminiApiKey,
  setGeminiApiKey,
  handleSavePortals,
}) => {
  return (
    <form onSubmit={handleSavePortals} className="space-y-8 max-w-4xl">
      {/* Idealista Panel */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#e6f54c]/30 text-lime-800 rounded-xl flex items-center justify-center font-bold text-sm">
              Id
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Idealista Connect</h3>
              <p className="text-xs text-slate-500">Configura la pasarela oficial para exportar tu inventario.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              portals.idealistaSync 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
            }`}>
              {portals.idealistaSync ? 'API Activa' : 'Sincronización Pausada'}
            </span>
            <label htmlFor="idealista-sync-toggle" className="relative inline-flex items-center cursor-pointer">
              <span className="sr-only">Activar sincronización con Idealista</span>
              <input 
                id="idealista-sync-toggle"
                aria-label="Activar sincronización con Idealista"
                type="checkbox" 
                checked={portals.idealistaSync} 
                onChange={(e) => setPortals({...portals, idealistaSync: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="idealista-client-id" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client ID (API Key)</label>
            <input 
              id="idealista-client-id"
              aria-label="Idealista Client ID"
              type="text" 
              value={portals.idealistaClientId}
              onChange={(e) => setPortals({...portals, idealistaClientId: e.target.value})}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="idealista-client-secret" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client Secret</label>
            <input 
              id="idealista-client-secret"
              aria-label="Idealista Client Secret"
              type="password" 
              value={portals.idealistaClientSecret}
              onChange={(e) => setPortals({...portals, idealistaClientSecret: e.target.value})}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
            />
          </div>
        </div>

        {/* Feed URL Display */}
        <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">URL del Feed XML para Idealista (Kyero v3)</span>
            <code className="text-xs text-slate-800 font-mono break-all select-all">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-feed?token=terravall_secure_token_xml</code>
          </div>
          <button 
            type="button" 
            onClick={() => {
              navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-feed?token=terravall_secure_token_xml`);
              alert("¡Enlace de Feed XML seguro copiado!");
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-black rounded-lg text-xs font-semibold shadow-sm shrink-0 cursor-pointer border border-gray-200 transition-colors"
          >
            Copiar Enlace
          </button>
        </div>
      </div>

      {/* Fotocasa Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center font-bold text-amber-600 text-sm">
              FC
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Fotocasa</h3>
              <p className="text-xs text-slate-500">Publicación pasarela directa XML / Feed</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              portals.fotocasaSync 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              {portals.fotocasaSync ? 'XML Activo' : 'Sincronización Pausada'}
            </span>
            <label htmlFor="fotocasa-sync-toggle" className="relative inline-flex items-center cursor-pointer">
              <span className="sr-only">Activar sincronización con Fotocasa</span>
              <input 
                id="fotocasa-sync-toggle"
                aria-label="Activar sincronización con Fotocasa"
                type="checkbox" 
                checked={portals.fotocasaSync} 
                onChange={(e) => setPortals({...portals, fotocasaSync: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="fotocasa-api-key" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fotocasa Token/Key</label>
            <input 
              id="fotocasa-api-key"
              aria-label="Fotocasa Token o Key"
              type="text" 
              value={portals.fotocasaApiKey}
              onChange={(e) => setPortals({...portals, fotocasaApiKey: e.target.value})}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="fotocasa-office-code" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Código de Oficina</label>
            <input 
              id="fotocasa-office-code"
              aria-label="Fotocasa Código de Oficina"
              type="text" 
              value={portals.fotocasaOfficeCode}
              onChange={(e) => setPortals({...portals, fotocasaOfficeCode: e.target.value})}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Gemini AI Panel */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
              AI
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Inteligencia Artificial (Google Gemini)</h3>
              <p className="text-xs text-slate-500">Configura la IA para generar descripciones comerciales automáticas.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-2">
          <div className="space-y-2">
            <label htmlFor="gemini-api-key-input" className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              Gemini API Key
              <span className="text-[10px] text-slate-400 lowercase font-normal">(se guarda de forma segura en tu navegador)</span>
            </label>
            <input 
              id="gemini-api-key-input"
              aria-label="Gemini API Key"
              type="password" 
              placeholder="Pega aquí tu API Key de Gemini..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800 placeholder-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              Puedes obtener una API Key gratuita en la consola de Google AI Studio: {" "}
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-semibold"
              >
                Google AI Studio
              </a>.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 max-w-md">
          <AlertTriangle size={14} className="text-yellow-500 shrink-0" />
          Asegúrate de que las API Keys concuerden con las contratadas en los portales para evitar rechazos en las pasarelas.
        </div>
        <button 
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/95 transition-colors cursor-pointer shadow-md shadow-primary/10 shrink-0"
        >
          <Save size={16} />
          Guardar Credenciales
        </button>
      </div>
    </form>
  );
};
