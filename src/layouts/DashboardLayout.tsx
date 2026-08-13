import React, { useState } from 'react';
import { NavLink, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Building2, Settings, LogOut, Search, Menu, X, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const DashboardLayout: React.FC = () => {
  const { userEmail } = useOutletContext<{ userEmail: string }>();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/crm', icon: <LayoutDashboard size={20} /> },
    { name: 'Inmuebles', path: '/crm/inmuebles', icon: <Building2 size={20} /> },
    { name: 'Alta Inmueble', path: '/crm/inmuebles/nuevo', icon: <PlusCircle size={20} /> },
    { name: 'Valoraciones ACM', path: '/crm/valoraciones', icon: <Calculator size={20} /> },
    { name: 'Simulador Hipoteca', path: '/crm/simulador', icon: <Calculator size={20} /> },
    { name: 'Configuración', path: '/crm/configuracion', icon: <Settings size={20} /> },
  ];

  const isItemActive = (path: string) => {
    if (path === '/crm') {
      return location.pathname === '/crm';
    }
    if (path === '/crm/inmuebles') {
      return location.pathname.startsWith('/crm/inmuebles') && location.pathname !== '/crm/inmuebles/nuevo';
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Backdrop para móviles y tablets */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shrink-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo-terravall.png" alt="TERRAVALL" className="h-7 w-auto object-contain" />
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">CRM</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = isItemActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-650'}`}>
                  {item.icon}
                </span>
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agente</span>
              <span className="text-sm font-semibold text-slate-700 truncate" title={userEmail}>{userEmail}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 gap-3">
          <div className="flex items-center gap-3 w-full max-w-md">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden shrink-0 transition-colors cursor-pointer"
              title="Desplegar / Recoger menú"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center text-gray-400 w-full bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search size={18} className="shrink-0" />
              <input 
                type="text" 
                placeholder="Buscar por referencia, dirección..." 
                className="bg-transparent border-none outline-none text-sm w-full ml-2 text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
             <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {userEmail.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <Outlet context={{ userEmail }} />
        </div>
      </main>
      
    </div>
  );
};
