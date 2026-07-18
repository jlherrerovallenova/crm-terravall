import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Home, 
  Tag, 
  Eye, 
  Plus, 
  TrendingUp, 
  Settings, 
  ArrowUpRight, 
  Globe, 
  CheckCircle,
  FileText,
  Key,
  ShieldCheck
} from 'lucide-react';

interface DashboardStats {
  total: number;
  venta: number;
  alquiler: number;
  traspaso: number;
  publishWeb: number;
  publishIdealista: number;
  publishFotocasa: number;
  typePiso: number;
  typeChalet: number;
  typeLocal: number;
  typeOficina: number;
  typeTerreno: number;
  typeNave: number;
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    venta: 0,
    alquiler: 0,
    traspaso: 0,
    publishWeb: 0,
    publishIdealista: 0,
    publishFotocasa: 0,
    typePiso: 0,
    typeChalet: 0,
    typeLocal: 0,
    typeOficina: 0,
    typeTerreno: 0,
    typeNave: 0,
  });
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch properties for stats computation
      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('type, operation, publish_web, publish_idealista, publish_fotocasa');

      if (propsError) throw propsError;

      // 2. Fetch recent properties
      const { data: recent, error: recentError } = await supabase
        .from('properties')
        .select('id, title, type, operation, price, address_public, area_built, condition, created_at, internal_reference, property_media(url)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      if (properties) {
        const computedStats: DashboardStats = {
          total: properties.length,
          venta: properties.filter(p => p.operation === 'venta').length,
          alquiler: properties.filter(p => p.operation === 'alquiler').length,
          traspaso: properties.filter(p => p.operation === 'traspaso').length,
          publishWeb: properties.filter(p => p.publish_web).length,
          publishIdealista: properties.filter(p => p.publish_idealista).length,
          publishFotocasa: properties.filter(p => p.publish_fotocasa).length,
          typePiso: properties.filter(p => p.type === 'piso').length,
          typeChalet: properties.filter(p => p.type === 'chalet').length,
          typeLocal: properties.filter(p => p.type === 'local').length,
          typeOficina: properties.filter(p => p.type === 'oficina').length,
          typeTerreno: properties.filter(p => p.type === 'terreno').length,
          typeNave: properties.filter(p => p.type === 'nave').length,
        };
        setStats(computedStats);
      }

      setRecentProperties(recent || []);
    } catch (error) {
      console.error('Error al cargar datos del Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  };

  const formatType = (type: string) => {
    const types: Record<string, string> = { piso: 'Piso', chalet: 'Chalet', local: 'Local', oficina: 'Oficina', terreno: 'Terreno', nave: 'Nave Industrial' };
    return types[type] || type;
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Cargando datos del panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen del estado actual de tu cartera inmobiliaria.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/web"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:text-black transition-all shadow-sm"
          >
            <Globe size={18} className="text-gray-400" />
            Ver Web Pública
            <ArrowUpRight size={14} className="opacity-70" />
          </a>
          <Link to="/crm/inmuebles/nuevo">
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer">
              <Plus size={18} />
              Añadir Inmueble
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Inmuebles</span>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Home size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">unidades</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle size={12} className="text-green-500" />
            Activos en base de datos
          </div>
        </div>

        {/* Card 2: En Venta */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">En Venta</span>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Tag size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{stats.venta}</span>
            <span className="text-xs text-slate-400 font-medium">{calculatePercentage(stats.venta, stats.total)}% del total</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-emerald-500" />
            Para transacciones de compra
          </div>
        </div>

        {/* Card 3: En Alquiler */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">En Alquiler</span>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Key size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{stats.alquiler}</span>
            <span className="text-xs text-slate-400 font-medium">{calculatePercentage(stats.alquiler, stats.total)}% del total</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-indigo-500" />
            Para arrendamiento mensual
          </div>
        </div>

        {/* Card 4: Publicado Web */}
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Publicados Web</span>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <Eye size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{stats.publishWeb}</span>
            <span className="text-xs text-slate-400 font-medium">{calculatePercentage(stats.publishWeb, stats.total)}% visibilidad</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-violet-500" />
            Visibles en la página pública
          </div>
        </div>
      </div>

      {/* Main Grid: Distributions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Grid: Distributions */}
        <div className="space-y-6">
          {/* Card: Tipos de Inmueble */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-slate-400" />
              Tipos de Inmueble
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Pisos / Apartamentos', value: stats.typePiso, color: 'bg-primary' },
                { label: 'Chalets / Casas', value: stats.typeChalet, color: 'bg-emerald-600' },
                { label: 'Locales Comerciales', value: stats.typeLocal, color: 'bg-indigo-600' },
                { label: 'Oficinas', value: stats.typeOficina, color: 'bg-amber-500' },
                { label: 'Terrenos', value: stats.typeTerreno, color: 'bg-orange-500' },
                { label: 'Naves Industriales', value: stats.typeNave, color: 'bg-purple-600' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value} ({calculatePercentage(item.value, stats.total)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${item.color} h-full rounded-full transition-all duration-1000`} 
                      style={{ width: `${calculatePercentage(item.value, stats.total)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Estado de Portales */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Globe size={18} className="text-slate-400" />
              Sindicación en Portales
            </h3>
            
            <div className="space-y-4">
              {/* Web Propia */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Web Corporativa</span>
                </div>
                <span className="text-sm font-bold text-slate-950">{stats.publishWeb} inmuebles</span>
              </div>

              {/* Idealista */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="text-sm font-medium text-slate-700">Idealista</span>
                </div>
                <span className="text-sm font-bold text-slate-950">{stats.publishIdealista} inmuebles</span>
              </div>

              {/* Fotocasa */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-slate-700">Fotocasa</span>
                </div>
                <span className="text-sm font-bold text-slate-950">{stats.publishFotocasa} inmuebles</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl text-slate-300 shadow-lg relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] text-slate-800 opacity-20 pointer-events-none">
              <Settings size={140} />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Accesos Directos</h3>
            <p className="text-xs text-slate-400 mb-4">Accede rápidamente a las secciones principales de configuración y utilidades.</p>
            <div className="grid grid-cols-2 gap-3 font-medium">
              <Link to="/crm/configuracion" className="flex items-center gap-2 p-2.5 bg-slate-850 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <Settings size={14} className="text-slate-400" />
                Configuración
              </Link>
              <Link to="/crm/inmuebles" className="flex items-center gap-2 p-2.5 bg-slate-850 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 text-xs text-slate-200 cursor-pointer">
                <FileText size={14} className="text-slate-400" />
                Ver Todos
              </Link>
            </div>
          </div>
        </div>

        {/* Right Grid: Recent Additions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-400" />
              Últimas Propiedades Registradas
            </h3>
            <Link to="/crm/inmuebles" className="text-xs font-semibold text-primary hover:text-primary/90 flex items-center gap-0.5 cursor-pointer">
              Ver todo el catálogo
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentProperties.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Home size={32} className="text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No hay inmuebles registrados</p>
              <p className="text-xs text-slate-400 mt-1">Comienza añadiendo una nueva propiedad a tu cartera.</p>
              <Link to="/crm/inmuebles/nuevo" className="mt-4">
                <button className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-medium transition-all cursor-pointer">
                  Añadir Inmueble
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-slate-100">
              {recentProperties.map((property) => (
                <div key={property.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/40 rounded-lg px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-105">
                      {property.property_media?.[0]?.url ? (
                        <img src={property.property_media[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate" title={property.title}>
                        {property.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                        {property.internal_reference && <span className="font-semibold text-primary bg-primary/5 px-1 py-0.5 rounded text-[10px] uppercase border border-primary/10 mr-1">{property.internal_reference}</span>}
                        <span className="font-medium text-slate-700">{formatType(property.type)}</span>
                        <span>•</span>
                        <span>{property.area_built} m²</span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{property.address_public}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-955">{formatPrice(property.price)}</div>
                      <div className="text-[10px] font-bold text-primary capitalize mt-0.5 inline-flex items-center px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">
                        {property.operation}
                      </div>
                    </div>
                    <Link to={`/crm/inmuebles/${property.id}`} className="cursor-pointer">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all cursor-pointer">
                        <ArrowUpRight size={18} />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
