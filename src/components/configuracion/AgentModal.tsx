import React from 'react';
import { UserPlus, X } from 'lucide-react';
import type { AgentItem } from '@/pages/ConfiguracionPage';

interface AgentModalProps {
  showAgentModal: boolean;
  setShowAgentModal: (show: boolean) => void;
  editingAgent: AgentItem | null;
  agentFormData: AgentItem;
  setAgentFormData: React.Dispatch<React.SetStateAction<AgentItem>>;
  handleSaveAgentModal: (e: React.FormEvent) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  showAgentModal,
  setShowAgentModal,
  editingAgent,
  agentFormData,
  setAgentFormData,
  handleSaveAgentModal,
}) => {
  if (!showAgentModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-opacity duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            {editingAgent ? 'Editar Datos del Agente' : 'Añadir Nuevo Agente'}
          </h3>
          <button 
            type="button"
            onClick={() => setShowAgentModal(false)}
            aria-label="Cerrar modal de agente"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveAgentModal} className="space-y-4 text-xs font-sans">
          <div>
            <label htmlFor="agent-form-name" className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
            <input
              id="agent-form-name"
              aria-label="Nombre Completo del Agente"
              type="text"
              required
              placeholder="Ej. Mª del Mar Rivas"
              value={agentFormData.name}
              onChange={e => setAgentFormData({ ...agentFormData, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
            />
          </div>

          <div>
            <label htmlFor="agent-form-email" className="block font-semibold text-slate-700 mb-1">Email Profesional *</label>
            <input
              id="agent-form-email"
              aria-label="Email Profesional del Agente"
              type="email"
              required
              placeholder="ejemplo@terravall.com"
              value={agentFormData.email}
              onChange={e => setAgentFormData({ ...agentFormData, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
            />
          </div>

          <div>
            <label htmlFor="agent-form-phone" className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
            <input
              id="agent-form-phone"
              aria-label="Teléfono de Contacto del Agente"
              type="tel"
              placeholder="Ej. 600 00 00 00"
              value={agentFormData.phone || ''}
              onChange={e => setAgentFormData({ ...agentFormData, phone: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="agent-form-role" className="block font-semibold text-slate-700 mb-1">Rol</label>
              <select
                id="agent-form-role"
                aria-label="Rol del Agente"
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
              <label htmlFor="agent-form-status" className="block font-semibold text-slate-700 mb-1">Estado</label>
              <select
                id="agent-form-status"
                aria-label="Estado del Agente"
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
  );
};
