import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, Globe } from 'lucide-react';
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid';
import { DashboardDistributions } from '@/components/dashboard/DashboardDistributions';
import { DashboardRecentList, type RecentPropertyItem } from '@/components/dashboard/DashboardRecentList';

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
  const [recentProperties, setRecentProperties] = useState<RecentPropertyItem[]>([]);
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
    <div className="space-y-8 transition-opacity duration-500 font-sans pb-12">
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:text-black transition-colors shadow-sm"
          >
            <Globe size={18} className="text-gray-400" />
            Ver Web Pública
            <ArrowUpRight size={14} className="opacity-70" />
          </a>
          <Link to="/crm/inmuebles/nuevo">
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/10 transition-colors cursor-pointer">
              <Plus size={18} />
              Añadir Inmueble
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <DashboardKpiGrid stats={stats} />

      {/* Main Grid: Distributions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Grid: Distributions */}
        <DashboardDistributions stats={stats} />

        {/* Right Grid: Recent Additions */}
        <DashboardRecentList recentProperties={recentProperties} />
      </div>
    </div>
  );
};
