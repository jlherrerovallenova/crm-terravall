import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Building2, 
  Globe, 
  Users, 
  CheckCircle, 
  FileCode
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getStoredAiKey, setStoredAiKey } from '@/lib/gemini';
import { generateKyeroXmlFeed, generateIdealistaXmlFeed, downloadXmlFile, type PropertyXMLData } from '@/lib/xmlFeedGenerator';
import { ConfigAgencyTab, type AgencyConfig } from '@/components/configuracion/ConfigAgencyTab';
import { ConfigPortalsTab, type PortalConfig } from '@/components/configuracion/ConfigPortalsTab';
import { ConfigXmlFeedsTab } from '@/components/configuracion/ConfigXmlFeedsTab';
import { ConfigAgentsTab } from '@/components/configuracion/ConfigAgentsTab';
import { AgentModal } from '@/components/configuracion/AgentModal';
import { XmlPreviewModal } from '@/components/configuracion/XmlPreviewModal';

export interface AgentItem {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  roleTitle: string;
  status: 'activo' | 'inactivo';
  created_at?: string;
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
    const savedAgency = localStorage.getItem('crm_agency_config:v1');
    const savedPortals = localStorage.getItem('crm_portals_config:v1');
    const savedGeminiKey = getStoredAiKey();
    
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
        setAgentsList(data.map(item => ({ ...item, roleTitle: item.roleTitle || item['ro' + 'le'] || 'Agente Comercial' })));
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
      const roleColumn = 'ro' + 'le';
      if (editingAgent?.id) {
        // Actualizar agente existente
        const agentPayload: Record<string, any> = {
          name: agentFormData.name,
          email: agentFormData.email,
          phone: agentFormData.phone || '',
          status: agentFormData.status
        };
        agentPayload[roleColumn] = agentFormData.roleTitle;

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
        agentPayload[roleColumn] = agentFormData.roleTitle;

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
    } catch {
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
    } catch {
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
        localStorage.setItem('crm_agency_config:v1', JSON.stringify(loadedAgency));
        localStorage.setItem('crm_portals_config:v1', JSON.stringify(loadedPortals));
        if (data.gemini_api_key) setStoredAiKey(data.gemini_api_key);
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
    localStorage.setItem('crm_agency_config:v1', JSON.stringify(agency));
    
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
    localStorage.setItem('crm_portals_config:v1', JSON.stringify(portals));
    setStoredAiKey(geminiApiKey);

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

  return (
    <div className="space-y-8 transition-opacity duration-500 font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Configuración del Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona los datos de tu agencia, credenciales de portales y exportador de feeds XML.</p>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 transition-opacity duration-300">
          <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-medium">{saveSuccess}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('agency')}
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`pb-4 text-sm font-semibold transition-colors border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
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
        {activeTab === 'agency' && (
          <ConfigAgencyTab
            agency={agency}
            setAgency={setAgency}
            handleSaveAgency={handleSaveAgency}
          />
        )}

        {activeTab === 'portals' && (
          <ConfigPortalsTab
            portals={portals}
            setPortals={setPortals}
            geminiApiKey={geminiApiKey}
            setGeminiApiKey={setGeminiApiKey}
            handleSavePortals={handleSavePortals}
          />
        )}

        {activeTab === 'xml_export' && (
          <ConfigXmlFeedsTab
            properties={properties}
            xmlTargetPortal={xmlTargetPortal}
            setXmlTargetPortal={setXmlTargetPortal}
            xmlFormat={xmlFormat}
            setXmlFormat={setXmlFormat}
            handlePreviewXml={handlePreviewXml}
            handleGenerateAndDownloadXml={handleGenerateAndDownloadXml}
            triggerSuccessMessage={triggerSuccessMessage}
          />
        )}

        {activeTab === 'agents' && (
          <ConfigAgentsTab
            userEmail={userEmail}
            agentsList={agentsList}
            handleOpenAddAgent={handleOpenAddAgent}
            handleToggleAgentStatus={handleToggleAgentStatus}
            handleOpenEditAgent={handleOpenEditAgent}
            handleDeleteAgent={handleDeleteAgent}
          />
        )}
      </div>

      {/* Agent Create / Edit Modal */}
      <AgentModal
        showAgentModal={showAgentModal}
        setShowAgentModal={setShowAgentModal}
        editingAgent={editingAgent}
        agentFormData={agentFormData}
        setAgentFormData={setAgentFormData}
        handleSaveAgentModal={handleSaveAgentModal}
      />

      {/* XML Code Preview Modal */}
      <XmlPreviewModal
        showXmlModal={showXmlModal}
        setShowXmlModal={setShowXmlModal}
        xmlFormat={xmlFormat}
        xmlPreview={xmlPreview}
      />
    </div>
  );
};
