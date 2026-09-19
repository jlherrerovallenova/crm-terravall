import React from 'react';
import { Home, Tag, Key, Eye, CheckCircle, TrendingUp, ShieldCheck } from 'lucide-react';

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

export const DashboardKpiGrid: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Total */}
      <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-colors group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
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
      <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-colors group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
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
      <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-colors group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
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
      <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-colors group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
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
  );
};
