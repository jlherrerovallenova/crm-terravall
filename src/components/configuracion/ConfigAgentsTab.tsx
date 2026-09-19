import React from 'react';
import { Shield, Plus, UserCheck, UserX, Edit, Trash2 } from 'lucide-react';
import type { AgentItem } from '@/pages/ConfiguracionPage';

interface ConfigAgentsTabProps {
  userEmail: string;
  agentsList: AgentItem[];
  handleOpenAddAgent: () => void;
  handleToggleAgentStatus: (agent: AgentItem) => void;
  handleOpenEditAgent: (agent: AgentItem) => void;
  handleDeleteAgent: (agent: AgentItem) => void;
}

export const ConfigAgentsTab: React.FC<ConfigAgentsTabProps> = ({
  userEmail,
  agentsList,
  handleOpenAddAgent,
  handleToggleAgentStatus,
  handleOpenEditAgent,
  handleDeleteAgent,
}) => {
  return (
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            Añadir Nuevo Agente
          </button>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
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
                        type="button"
                        onClick={() => handleToggleAgentStatus(agent)}
                        className="cursor-pointer"
                        title="Haz clic para alternar estado"
                        aria-label={`Cambiar estado de ${agent.name} (actual: ${agent.status})`}
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
                          type="button"
                          onClick={() => handleOpenEditAgent(agent)}
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                          title="Editar agente"
                          aria-label={`Editar agente ${agent.name}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAgent(agent)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar agente"
                          aria-label={`Eliminar agente ${agent.name}`}
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
  );
};
