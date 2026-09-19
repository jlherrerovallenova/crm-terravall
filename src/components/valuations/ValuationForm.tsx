import React from 'react';
import { Sparkles, User, MapPin } from 'lucide-react';
import type { ValuationFormData } from './types';
import { ValuationTechnicalSection } from './ValuationTechnicalSection';

interface ValuationFormProps {
  formData: ValuationFormData;
  validationErrors: Record<string, string>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ValuationForm: React.FC<ValuationFormProps> = ({
  formData,
  validationErrors,
  loading,
  onSubmit
}) => {
  const {
    clientName, setClientName,
    clientPhone, setClientPhone,
    clientEmail, setClientEmail,
    purpose, setPurpose,
    address, setAddress,
    zone, setZone,
    city, setCity,
    province, setProvince,
    zipcode, setZipcode,
    cadastralReference, setCadastralReference
  } = formData;

  return (
    <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 max-w-5xl">
      {/* Section 1: Cliente/Propietario y Finalidad */}
      <div className="space-y-4 border-b border-slate-100 pb-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User size={16} className="text-primary" />
          1. Datos del Solicitante / Propietario & Finalidad
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label htmlFor="val-client-name" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Nombre Completo *</label>
            <input
              id="val-client-name"
              type="text"
              required
              placeholder="Ej. Pedro Martínez Alonso"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
            {validationErrors.client_name && <p className="text-[10px] text-red-500 mt-0.5">{validationErrors.client_name}</p>}
          </div>
          <div className="md:col-span-3">
            <label htmlFor="val-client-phone" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Teléfono</label>
            <input
              id="val-client-phone"
              type="tel"
              placeholder="600 00 00 00"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="val-client-email" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Email</label>
            <input
              id="val-client-email"
              type="email"
              placeholder="cliente@ejemplo.com"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="val-purpose" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Finalidad *</label>
            <select
              id="val-purpose"
              value={purpose}
              onChange={e => setPurpose(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
            >
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="herencia">Herencia</option>
              <option value="hipotecaria_orientativa">Hipotecaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Ubicación Fina y Zona */}
      <div className="space-y-4 border-b border-slate-100 pb-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          2. Ubicación Precisa y Registro Catastral
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label htmlFor="val-address" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Dirección / Calle</label>
            <input
              id="val-address"
              type="text"
              placeholder="Ej. Calle Santiago 12"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="val-zone" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Zona / Barrio *</label>
            <input
              id="val-zone"
              type="text"
              placeholder="Ej. Parquesol / Centro"
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="val-city" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Municipio *</label>
            <input
              id="val-city"
              type="text"
              required
              placeholder="Valladolid"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="val-province" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Provincia *</label>
            <input
              id="val-province"
              type="text"
              required
              placeholder="Valladolid"
              value={province}
              onChange={e => setProvince(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label htmlFor="val-zipcode" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Código Postal</label>
            <input
              id="val-zipcode"
              type="text"
              placeholder="47001"
              value={zipcode}
              onChange={e => setZipcode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
            />
          </div>
          <div className="md:col-span-9">
            <label htmlFor="val-cadastral" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Referencia Catastral (20 Caracteres)</label>
            <input
              id="val-cadastral"
              type="text"
              placeholder="Ej. 1452001UM5015S0001WX"
              value={cadastralReference}
              onChange={e => setCadastralReference(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs font-mono uppercase"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Datos Técnicos del Inmueble */}
      <ValuationTechnicalSection formData={formData} />

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles size={18} />
          {loading ? 'Calculando Homogeneización & Generando Informe...' : 'Generar Valoración ACM Homogeneizada & Dictamen IA'}
        </button>
      </div>
    </form>
  );
};
