import React from 'react';
import { Save } from 'lucide-react';

export interface AgencyConfig {
  name: string;
  commercialName: string;
  cif: string;
  phone: string;
  email: string;
  address: string;
  website: string;
}

interface ConfigAgencyTabProps {
  agency: AgencyConfig;
  setAgency: React.Dispatch<React.SetStateAction<AgencyConfig>>;
  handleSaveAgency: (e: React.FormEvent) => void;
}

export const ConfigAgencyTab: React.FC<ConfigAgencyTabProps> = ({
  agency,
  setAgency,
  handleSaveAgency,
}) => {
  return (
    <form onSubmit={handleSaveAgency} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="agency_name" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Razón Social</label>
          <input 
            id="agency_name"
            type="text" 
            value={agency.name}
            onChange={(e) => setAgency({...agency, name: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agency_commercial_name" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Nombre Comercial</label>
          <input 
            id="agency_commercial_name"
            type="text" 
            value={agency.commercialName}
            onChange={(e) => setAgency({...agency, commercialName: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agency_cif" className="text-sm font-semibold text-slate-700 whitespace-nowrap">CIF / NIF</label>
          <input 
            id="agency_cif"
            type="text" 
            value={agency.cif}
            onChange={(e) => setAgency({...agency, cif: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agency_phone" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Teléfono de Contacto</label>
          <input 
            id="agency_phone"
            type="text" 
            value={agency.phone}
            onChange={(e) => setAgency({...agency, phone: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agency_email" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Email Central</label>
          <input 
            id="agency_email"
            type="email" 
            value={agency.email}
            onChange={(e) => setAgency({...agency, email: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agency_website" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Sitio Web</label>
          <input 
            id="agency_website"
            type="url" 
            value={agency.website}
            onChange={(e) => setAgency({...agency, website: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="agency_address" className="text-sm font-semibold text-slate-700 whitespace-nowrap">Dirección Física de la Oficina</label>
          <input 
            id="agency_address"
            type="text" 
            value={agency.address}
            onChange={(e) => setAgency({...agency, address: e.target.value})}
            required
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors text-slate-800"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button 
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/95 transition-colors cursor-pointer shadow-md shadow-primary/10"
        >
          <Save size={16} />
          Guardar Cambios de Agencia
        </button>
      </div>
    </form>
  );
};
