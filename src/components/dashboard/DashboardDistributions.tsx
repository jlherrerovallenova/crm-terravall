import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Globe, Settings, FileText } from 'lucide-react';

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

const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const DashboardDistributions: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
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
          ].map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value} ({calculatePercentage(item.value, stats.total)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`${item.color} h-full rounded-full transition-colors duration-1000`} 
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
          <Link to="/crm/configuracion" className="flex items-center gap-2 p-2.5 bg-slate-850 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 text-xs text-slate-200 cursor-pointer">
            <Settings size={14} className="text-slate-400" />
            Configuración
          </Link>
          <Link to="/crm/inmuebles" className="flex items-center gap-2 p-2.5 bg-slate-850 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 text-xs text-slate-200 cursor-pointer">
            <FileText size={14} className="text-slate-400" />
            Ver Todos
          </Link>
        </div>
      </div>
    </div>
  );
};
