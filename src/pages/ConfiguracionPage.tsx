import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Building2, 
  Globe, 
  Users, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  Shield,
  KeyRound,
  FileCode
} from 'lucide-react';

interface AgencyConfig {
  name: string;
  commercialName: string;
  cif: string;
  phone: string;
  email: string;
  address: string;
  website: string;
}

interface PortalConfig {
  idealistaClientId: string;
  idealistaClientSecret: string;
  idealistaSync: boolean;
  fotocasaApiKey: string;
  fotocasaOfficeCode: string;
  fotocasaSync: boolean;
}

export const ConfiguracionPage: React.FC = () => {
  const context = useOutletContext<{ userEmail: string }>() as { userEmail: string } | null;
  const userEmail = context?.userEmail || '';
  const [activeTab, setActiveTab] = useState<'agency' | 'portals' | 'agents'>('agency');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Agency state
  const [agency, setAgency] = useState<AgencyConfig>({
    name: 'Terravall Inmobiliaria S.L.',
    commercialName: 'Terravall',
    cif: 'B-47123456',
    phone: '983 12 34 56',
    email: 'info@terravall.com',
    address: 'Paseo de Zorrilla 48, 47006 Valladolid',
    website: 'https://www.terravall.com',
  });

  // Portal state
  const [portals, setPortals] = useState<PortalConfig>({
    idealistaClientId: 'id_client_terravall_prod_7781',
    idealistaClientSecret: '••••••••••••••••••••••••••••••••',
    idealistaSync: true,
    fotocasaApiKey: 'fc_key_99812_trvl',
    fotocasaOfficeCode: 'OFC-47001-A',
    fotocasaSync: false,
  });

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  // Load configs from localStorage on mount
  useEffect(() => {
    const savedAgency = localStorage.getItem('crm_agency_config');
    const savedPortals = localStorage.getItem('crm_portals_config');
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    
    if (savedAgency) {
      try {
        setAgency(JSON.parse(savedAgency));
      } catch (e) {
        console.error('Error parsing agency config', e);
      }
    }
    
    if (savedPortals) {
      try {
        setPortals(JSON.parse(savedPortals));
      } catch (e) {
        console.error('Error parsing portals config', e);
      }
    }

    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }
  }, []);

  const triggerSuccessMessage = (message: string) => {
    setSaveSuccess(message);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_agency_config', JSON.stringify(agency));
    triggerSuccessMessage('¡Configuración de la agencia guardada correctamente!');
  };

  const handleSavePortals = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_portals_config', JSON.stringify(portals));
    localStorage.setItem('gemini_api_key', geminiApiKey);
    triggerSuccessMessage('¡Credenciales y configuraciones actualizadas!');
  };

  const handleInviteAgent = () => {
    const email = prompt('Introduce el correo electrónico del agente que deseas invitar:');
    if (email) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(`Se ha enviado una invitación de acceso a: ${email}`);
      } else {
        alert('Por favor, introduce un correo electrónico válido.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Configuración del Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona los datos de tu agencia, credenciales de portales y agentes autorizados.</p>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-medium">{saveSuccess}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('agency')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'agency' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 size={18} />
          Datos de Agencia
        </button>
        <button
          onClick={() => setActiveTab('portals')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'portals' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Globe size={18} />
          Portales y Sindicación
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'agents' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users size={18} />
          Gestión de Agentes
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8">
        
        {/* Tab 1: Agency Config */}
        {activeTab === 'agency' && (
          <form onSubmit={handleSaveAgency} className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Razón Social</label>
                <input 
                  type="text" 
                  value={agency.name}
                  onChange={(e) => setAgency({...agency, name: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nombre Comercial</label>
                <input 
                  type="text" 
                  value={agency.commercialName}
                  onChange={(e) => setAgency({...agency, commercialName: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">CIF / NIF</label>
                <input 
                  type="text" 
                  value={agency.cif}
                  onChange={(e) => setAgency({...agency, cif: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  value={agency.phone}
                  onChange={(e) => setAgency({...agency, phone: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Principal</label>
                <input 
                  type="email" 
                  value={agency.email}
                  onChange={(e) => setAgency({...agency, email: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Página Web</label>
                <input 
                  type="url" 
                  value={agency.website}
                  onChange={(e) => setAgency({...agency, website: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Dirección Física de la Oficina</label>
              <input 
                type="text" 
                value={agency.address}
                onChange={(e) => setAgency({...agency, address: e.target.value})}
                required
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/5"
              >
                <Save size={16} />
                Guardar Cambios de Agencia
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Portals Config */}
        {activeTab === 'portals' && (
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
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={portals.idealistaSync} 
                      onChange={(e) => setPortals({...portals, idealistaSync: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client ID (API Key)</label>
                  <input 
                    type="text" 
                    value={portals.idealistaClientId}
                    onChange={(e) => setPortals({...portals, idealistaClientId: e.target.value})}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client Secret</label>
                  <input 
                    type="password" 
                    value={portals.idealistaClientSecret}
                    onChange={(e) => setPortals({...portals, idealistaClientSecret: e.target.value})}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Feed URL Display */}
              <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">URL del Feed XML para Idealista (Kyero v3)</span>
                  <code className="text-xs text-blue-900 font-mono break-all select-all">https://uwffjqjskzlevpozjueo.supabase.co/functions/v1/idealista-feed?token=terravall_secure_token_xml</code>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    navigator.clipboard.writeText("https://uwffjqjskzlevpozjueo.supabase.co/functions/v1/idealista-feed?token=terravall_secure_token_xml");
                    alert("¡Enlace de Feed XML seguro copiado!");
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-black rounded-lg text-xs font-semibold shadow-sm shrink-0 cursor-pointer border border-gray-200 transition-colors"
                >
                  Copiar Enlace
                </button>
              </div>
            </div>

            {/* Fotocasa Panel */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold text-sm">
                    Fc
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Fotocasa XML Sync</h3>
                    <p className="text-xs text-slate-500">Configura la pasarela mediante pasarela XML o API directa.</p>
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
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={portals.fotocasaSync} 
                      onChange={(e) => setPortals({...portals, fotocasaSync: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fotocasa Token/Key</label>
                  <input 
                    type="text" 
                    value={portals.fotocasaApiKey}
                    onChange={(e) => setPortals({...portals, fotocasaApiKey: e.target.value})}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Código de Oficina</label>
                  <input 
                    type="text" 
                    value={portals.fotocasaOfficeCode}
                    onChange={(e) => setPortals({...portals, fotocasaOfficeCode: e.target.value})}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
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
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    Gemini API Key
                    <span className="text-[10px] text-slate-400 lowercase font-normal">(se guarda de forma segura en tu navegador)</span>
                  </label>
                  <input 
                    type="password" 
                    placeholder="Pega aquí tu API Key de Gemini..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Puedes obtener una API Key gratuita en la consola de Google AI Studio: {" "}
                    <a 
                      href="https://aistudio.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline font-semibold"
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/5 shrink-0"
              >
                <Save size={16} />
                Guardar Credenciales
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Agents */}
        {activeTab === 'agents' && (
          <div className="space-y-8">
            {/* Active User Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                  {userEmail?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    Tu Cuenta Activa
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      <Shield size={10} />
                      Administrador
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{userEmail}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="text-xs text-right hidden md:block">
                  <span className="text-slate-400 font-medium block">Estado de la sesión</span>
                  <span className="text-emerald-600 font-bold">Conectado (Supabase Auth)</span>
                </div>
              </div>
            </div>

            {/* Other Agents List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Agentes Autorizados</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Los agentes de esta lista pueden acceder a la cartera y dar de alta propiedades.</p>
                </div>
                <button 
                  onClick={handleInviteAgent}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  <UserPlus size={14} />
                  Invitar Agente
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Nombre</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-6 py-4 font-medium text-slate-900">Laura Gómez</td>
                      <td className="px-6 py-4">laura@terravall.com</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">Agente Captador</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Activo</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-slate-900">Carlos Pérez</td>
                      <td className="px-6 py-4">carlos@terravall.com</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">Agente Comercial</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Activo</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-slate-900">Sofía Martín</td>
                      <td className="px-6 py-4">sofia@terravall.com</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">Agente Captador</td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-400 border border-gray-200">Inactivo</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
