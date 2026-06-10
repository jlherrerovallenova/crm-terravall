import React from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Building2, Settings, LogOut, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const DashboardLayout: React.FC = () => {
  const { userEmail } = useOutletContext<{ userEmail: string }>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Inmuebles', path: '/inmuebles', icon: <Building2 size={20} /> },
    { name: 'Alta Inmueble', path: '/inmuebles/nuevo', icon: <PlusCircle size={20} /> },
    { name: 'Configuración', path: '/configuracion', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 bg-slate-950/50">
          <span className="text-white font-bold text-xl tracking-tight">Terravall CRM</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-medium' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 bg-slate-950/30 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="text-xs font-medium text-slate-400">Agente</span>
              <span className="text-sm text-slate-200 truncate" title={userEmail}>{userEmail}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center text-gray-400 w-full max-w-md bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por referencia, dirección..." 
              className="bg-transparent border-none outline-none text-sm w-full ml-2 text-gray-700 placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {userEmail.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
};
