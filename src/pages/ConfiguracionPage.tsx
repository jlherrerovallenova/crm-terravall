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
  FileCode,
  Download,
  Copy,
  Eye,
  Edit,
  Trash2,
  Plus,
  Phone,
  Mail,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateKyeroXmlFeed, generateIdealistaXmlFeed, downloadXmlFile, type PropertyXMLData } from '@/lib/xmlFeedGenerator';

export interface AgentItem {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  roleTitle: string;
  status: 'activo' | 'inactivo';
  created_at?: string;
}

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
  const [activeTab, setActiveTab] = useState<'agency' | 'portals' | 'xml_export' | 'agents'>('agency');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Agents state
  const [agentsList, setAgentsList] = useState<AgentItem[]>([]);
  const [, setLoadingAgents] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentItem | null>(null);
  const [agentFormData, setAgentFormData] = useState<AgentItem>({
    name: '',
    email: '',
    phone: '',
    roleTitle: 'Agente Comercial',
    status: 'activo'
  });

  // XML Feed State
  const [properties, setProperties] = useState<PropertyXMLData[]>([]);
  const [, setLoadingProperties] = useState(false);
  const [xmlTargetPortal, setXmlTargetPortal] = useState<'all' | 'idealista' | 'fotocasa' | 'web'>('all');
  const [xmlFormat, setXmlFormat] = useState<'kyero' | 'idealista'>('kyero');
  const [xmlPreview, setXmlPreview] = useState<string>('');
  const [showXmlModal, setShowXmlModal] = useState(false);

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

  // Load configs from Supabase and fallback to localStorage on mount
  useEffect(() => {
    // 1. Carga inicial desde localStorage para renderizado inmediato
    const savedAgency = localStorage.getItem('crm_agency_config');
    const savedPortals = localStorage.getItem('crm_portals_config');
    const savedGeminiKey = localStorage.getItem('gemini_api_key');
    
    if (savedAgency) {
      try { setAgency(JSON.parse(savedAgency)); } catch (e) { console.error('Error parsing agency config', e); }
    }
    if (savedPortals) {
      try { setPortals(JSON.parse(savedPortals)); } catch (e) { console.error('Error parsing portals config', e); }
    }
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }

    // 2. Sincronización desde Supabase (Multidispositivo)
    fetchAgencySettingsFromSupabase();
    fetchAgentsFromSupabase();
    fetchPropertiesForXml();
  }, []);

  const fetchAgentsFromSupabase = async () => {
    setLoadingAgents(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setAgentsList(data.map(item => ({ ...item, roleTitle: item.roleTitle || item.role || 'Agente Comercial' })));
      } else {
        // Fallback datos iniciales
        const defaultAgents: AgentItem[] = [
          { name: 'Mª del Mar Rivas', email: 'mar.terravall@hotmail.com', phone: '983 12 34 56', roleTitle: 'Administrador', status: 'activo' },
          { name: 'Yolanda Alba', email: 'yolanda@terravall.com', phone: '600 00 00 02', roleTitle: 'Agente Captador', status: 'activo' },
          { name: 'Juan L. Herrero', email: 'juan@terravall.com', phone: '600 00 00 03', roleTitle: 'Agente Comercial', status: 'activo' }
        ];
        setAgentsList(defaultAgents);
      }
    } catch (e) {
      console.warn('Error cargando agentes desde Supabase:', e);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleOpenAddAgent = () => {
    setEditingAgent(null);
    setAgentFormData({
      name: '',
      email: '',
      phone: '',
      roleTitle: 'Agente Comercial',
      status: 'activo'
    });
    setShowAgentModal(true);
  };

  const handleOpenEditAgent = (agent: AgentItem) => {
    setEditingAgent(agent);
    setAgentFormData({ ...agent });
    setShowAgentModal(true);
  };

  const handleSaveAgentModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentFormData.name || !agentFormData.email) {
      alert('El nombre y el email son obligatorios.');
      return;
    }

    try {
      if (editingAgent?.id) {
        // Actualizar agente existente
        const agentPayload: Record<string, any> = {
          name: agentFormData.name,
          email: agentFormData.email,
          phone: agentFormData.phone || '',
          status: agentFormData.status
        };
        agentPayload['role'] = agentFormData.roleTitle;

        const { error } = await supabase
          .from('agents')
          .update({
            ...agentPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAgent.id);

        if (error) throw error;
        triggerSuccessMessage(`¡Datos del agente "${agentFormData.name}" actualizados!`);
      } else {
        // Crear nuevo agente
        const agentPayload: Record<string, any> = {
          name: agentFormData.name,
          email: agentFormData.email,
          phone: agentFormData.phone || '',
          status: agentFormData.status
        };
        agentPayload['role'] = agentFormData.roleTitle;

        const { error } = await supabase
          .from('agents')
          .insert([agentPayload]);

        if (error) throw error;
        triggerSuccessMessage(`¡Agente "${agentFormData.name}" añadido correctamente!`);
      }

      setShowAgentModal(false);
      fetchAgentsFromSupabase();
    } catch (err: any) {
      console.error('Error al guardar agente:', err);
      alert(err.message || 'Error al guardar el agente en la base de datos.');
    }
  };

  const handleToggleAgentStatus = async (agent: AgentItem) => {
    const newStatus = agent.status === 'activo' ? 'inactivo' : 'activo';
    try {
      if (agent.id) {
        const { error } = await supabase
          .from('agents')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', agent.id);
        if (error) throw error;
      }
      setAgentsList(prev => prev.map(a => a.email === agent.email ? { ...a, status: newStatus } : a));
      triggerSuccessMessage(`Agente ${agent.name} marcado como ${newStatus}`);
    } catch (err: any) {
      alert('Error cambiando estado del agente');
    }
  };

  const handleDeleteAgent = async (agent: AgentItem) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al agente "${agent.name}"?`)) return;

    try {
      if (agent.id) {
        const { error } = await supabase.from('agents').delete().eq('id', agent.id);
        if (error) throw error;
      }
      setAgentsList(prev => prev.filter(a => a.email !== agent.email));
      triggerSuccessMessage(`Agente "${agent.name}" eliminado`);
    } catch (err: any) {
      alert('Error al eliminar el agente');
    }
  };

  const fetchAgencySettingsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        const loadedAgency: AgencyConfig = {
          name: data.name || 'Terravall Inmobiliaria S.L.',
          commercialName: data.commercial_name || 'Terravall',
          cif: data.cif || 'B-47123456',
          phone: data.phone || '983 12 34 56',
          email: data.email || 'info@terravall.com',
          address: data.address || 'Paseo de Zorrilla 48, 47006 Valladolid',
          website: data.website || 'https://www.terravall.com',
        };
        const loadedPortals: PortalConfig = {
          idealistaClientId: data.idealista_client_id || 'id_client_terravall_prod_7781',
          idealistaClientSecret: data.idealista_client_secret || '••••••••••••••••••••••••••••••••',
          idealistaSync: data.idealista_sync !== false,
          fotocasaApiKey: data.fotocasa_api_key || 'fc_key_99812_trvl',
          fotocasaOfficeCode: data.fotocasa_office_code || 'OFC-47001-A',
          fotocasaSync: data.fotocasa_sync === true,
        };

        setAgency(loadedAgency);
        setPortals(loadedPortals);
        if (data.gemini_api_key) setGeminiApiKey(data.gemini_api_key);

        // Actualizar caché de localStorage
        localStorage.setItem('crm_agency_config', JSON.stringify(loadedAgency));
        localStorage.setItem('crm_portals_config', JSON.stringify(loadedPortals));
        if (data.gemini_api_key) localStorage.setItem('gemini_api_key', data.gemini_api_key);
      }
    } catch (e) {
      console.warn('No se pudo cargar la configuración desde Supabase, usando caché local:', e);
    }
  };

  const fetchPropertiesForXml = async () => {
    setLoadingProperties(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_media(url)');
      
      if (!error && data) {
        setProperties(data as PropertyXMLData[]);
      }
    } catch (err) {
      console.error('Error al cargar propiedades para XML:', err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const triggerSuccessMessage = (message: string) => {
    setSaveSuccess(message);
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_agency_config', JSON.stringify(agency));
    
    // Guardar en Supabase para sincronización multidispositivo
    try {
      await supabase.from('agency_settings').upsert({
        id: 'default',
        name: agency.name,
        commercial_name: agency.commercialName,
        cif: agency.cif,
        phone: agency.phone,
        email: agency.email,
        address: agency.address,
        website: agency.website,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error guardando configuración en Supabase:', err);
    }

    triggerSuccessMessage('¡Configuración de la agencia guardada y sincronizada en Supabase!');
  };

  const handleSavePortals = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('crm_portals_config', JSON.stringify(portals));
    localStorage.setItem('gemini_api_key', geminiApiKey);

    // Guardar en Supabase para sincronización multidispositivo
    try {
      await supabase.from('agency_settings').upsert({
        id: 'default',
        idealista_client_id: portals.idealistaClientId,
        idealista_client_secret: portals.idealistaClientSecret,
        idealista_sync: portals.idealistaSync,
        fotocasa_api_key: portals.fotocasaApiKey,
        fotocasa_office_code: portals.fotocasaOfficeCode,
        fotocasa_sync: portals.fotocasaSync,
        gemini_api_key: geminiApiKey,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error guardando credenciales en Supabase:', err);
    }

    triggerSuccessMessage('¡Credenciales y API Keys sincronizadas correctamente en Supabase!');
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

  const handleGenerateAndDownloadXml = (format: 'kyero' | 'idealista') => {
    const xmlContent = format === 'kyero' 
      ? generateKyeroXmlFeed(properties, xmlTargetPortal)
      : generateIdealistaXmlFeed(properties);

    const filename = format === 'kyero' 
      ? `feed_kyero_terravall_${xmlTargetPortal}.xml`
      : `feed_idealista_terravall.xml`;

    downloadXmlFile(xmlContent, filename);
    triggerSuccessMessage(`¡Archivo ${filename} generado y descargado!`);
  };

  const handlePreviewXml = (format: 'kyero' | 'idealista') => {
    const xmlContent = format === 'kyero' 
      ? generateKyeroXmlFeed(properties, xmlTargetPortal)
      : generateIdealistaXmlFeed(properties);

    setXmlPreview(xmlContent);
    setShowXmlModal(true);
  };

  // Counts for published properties
  const idealistaCount = properties.filter(p => p.publish_idealista).length;
  const fotocasaCount = properties.filter(p => p.publish_fotocasa).length;
  const webCount = properties.filter(p => p.publish_web).length;
  const totalPublishedCount = properties.filter(p => p.publish_idealista || p.publish_fotocasa || p.publish_web).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Configuración del Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona los datos de tu agencia, credenciales de portales y exportador de feeds XML.</p>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-medium">{saveSuccess}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('agency')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'agency' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 size={18} />
          Datos de Agencia
        </button>
        <button
          onClick={() => setActiveTab('portals')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'portals' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe size={18} />
          Portales y Sindicación
        </button>
        <button
          onClick={() => setActiveTab('xml_export')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'xml_export' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCode size={18} />
          Exportador XML
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'agents' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-900'
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
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nombre Comercial</label>
                <input 
                  type="text" 
                  value={agency.commercialName}
                  onChange={(e) => setAgency({...agency, commercialName: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">CIF / NIF</label>
                <input 
                  type="text" 
                  value={agency.cif}
                  onChange={(e) => setAgency({...agency, cif: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  value={agency.phone}
                  onChange={(e) => setAgency({...agency, phone: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Principal</label>
                <input 
                  type="email" 
                  value={agency.email}
                  onChange={(e) => setAgency({...agency, email: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Página Web</label>
                <input 
                  type="url" 
                  value={agency.website}
                  onChange={(e) => setAgency({...agency, website: e.target.value})}
                  required
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
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
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/95 transition-all cursor-pointer shadow-md shadow-primary/10"
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client Secret</label>
                  <input 
                    type="password" 
                    value={portals.idealistaClientSecret}
                    onChange={(e) => setPortals({...portals, idealistaClientSecret: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Código de Oficina</label>
                  <input 
                    type="text" 
                    value={portals.fotocasaOfficeCode}
                    onChange={(e) => setPortals({...portals, fotocasaOfficeCode: e.target.value})}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800"
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
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-slate-800 placeholder-slate-400"
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/95 transition-all cursor-pointer shadow-md shadow-primary/10 shrink-0"
              >
                <Save size={16} />
                Guardar Credenciales
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: XML Exportador */}
        {activeTab === 'xml_export' && (
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
                  <label className="text-sm font-semibold text-slate-700">Filtrar Inmuebles a Exportar</label>
                  <select
                    value={xmlTargetPortal}
                    onChange={(e) => setXmlTargetPortal(e.target.value as any)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="all">Todos los Inmuebles Marcados para Publicar ({totalPublishedCount})</option>
                    <option value="idealista">Solo los marcados para Idealista ({idealistaCount})</option>
                    <option value="fotocasa">Solo los marcados para Fotocasa ({fotocasaCount})</option>
                    <option value="web">Solo los marcados para Web ({webCount})</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Formato del Estándar XML</label>
                  <select
                    value={xmlFormat}
                    onChange={(e) => setXmlFormat(e.target.value as any)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
                >
                  <Eye size={16} />
                  Vista Previa del Código XML
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAndDownloadXml(xmlFormat)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-primary/10"
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
        )}

        {/* Tab 4: Agents */}
        {activeTab === 'agents' && (
          <div className="space-y-8">
            {/* Active User Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  {userEmail?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    Tu Cuenta Activa
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
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

            {/* Dynamic Agents List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Agentes Autorizados</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Gestión de agentes y usuarios con permisos de captación y venta.</p>
                </div>
                <button 
                  onClick={handleOpenAddAgent}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  Añadir Nuevo Agente
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3">Nombre</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Teléfono</th>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {agentsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                          No hay agentes registrados. Haz clic en "Añadir Nuevo Agente".
                        </td>
                      </tr>
                    ) : (
                      agentsList.map((agent) => (
                        <tr key={agent.id || agent.email} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {agent.name.charAt(0).toUpperCase()}
                            </span>
                            {agent.name}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600">{agent.email}</td>
                          <td className="px-6 py-4 text-xs text-slate-500">{agent.phone || '-'}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {agent.roleTitle}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleAgentStatus(agent)}
                              className="cursor-pointer"
                              title="Haz clic para alternar estado"
                            >
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                agent.status === 'activo'
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}>
                                {agent.status === 'activo' ? <UserCheck size={10} /> : <UserX size={10} />}
                                {agent.status === 'activo' ? 'Activo' : 'Inactivo'}
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-1">
                              <button
                                onClick={() => handleOpenEditAgent(agent)}
                                className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                                title="Editar agente"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteAgent(agent)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar agente"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Agent Create / Edit Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus size={18} className="text-primary" />
                {editingAgent ? 'Editar Datos del Agente' : 'Añadir Nuevo Agente'}
              </h3>
              <button 
                onClick={() => setShowAgentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAgentModal} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mª del Mar Rivas"
                  value={agentFormData.name}
                  onChange={e => setAgentFormData({ ...agentFormData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Profesional *</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@terravall.com"
                  value={agentFormData.email}
                  onChange={e => setAgentFormData({ ...agentFormData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="tel"
                  placeholder="Ej. 600 00 00 00"
                  value={agentFormData.phone || ''}
                  onChange={e => setAgentFormData({ ...agentFormData, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol</label>
                  <select
                    value={agentFormData.roleTitle}
                    onChange={e => setAgentFormData({ ...agentFormData, roleTitle: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs bg-white"
                  >
                    <option value="Agente Comercial">Agente Comercial</option>
                    <option value="Agente Captador">Agente Captador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={agentFormData.status}
                    onChange={e => setAgentFormData({ ...agentFormData, status: e.target.value as 'activo' | 'inactivo' })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs bg-white"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {editingAgent ? 'Guardar Cambios' : 'Añadir Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* XML Code Preview Modal */}
      {showXmlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 text-white">
                <FileCode className="text-primary" size={20} />
                <span className="font-bold text-sm">Vista Previa Feed XML ({xmlFormat.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(xmlPreview);
                    alert("¡Código XML copiado al portapapeles!");
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Copy size={14} />
                  Copiar XML
                </button>
                <button
                  onClick={() => setShowXmlModal(false)}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre leading-relaxed bg-slate-900/90">
              {xmlPreview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
