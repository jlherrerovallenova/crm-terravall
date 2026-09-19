import React from 'react';
import { Building2 } from 'lucide-react';
import type { ValuationFormData } from './types';

interface ValuationTechnicalSectionProps {
  formData: ValuationFormData;
}

export const ValuationTechnicalSection: React.FC<ValuationTechnicalSectionProps> = ({ formData }) => {
  const {
    propertyType, setPropertyType,
    areaBuilt, setAreaBuilt,
    areaUseful, setAreaUseful,
    yearBuilt, setYearBuilt,
    rooms, setRooms,
    bathrooms, setBathrooms,
    condition, setCondition,
    energyCertificate, setEnergyCertificate,
    orientation, setOrientation,
    floorHeight, setFloorHeight,
    hasElevator, setHasElevator,
    hasParking, setHasParking,
    hasTerrace, setHasTerrace,
    hasPool, setHasPool,
    hasStorage, setHasStorage,
    hasHeating, setHasHeating,
    hasViews, setHasViews
  } = formData;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Building2 size={16} className="text-primary" />
        3. Tipología, Superficie y Calificaciones Técnicas
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
        <div className="md:col-span-3">
          <label htmlFor="val-property-type" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Tipología Inmueble *</label>
          <select
            id="val-property-type"
            aria-label="Tipología Inmueble"
            value={propertyType}
            onChange={e => setPropertyType(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
          >
            <option value="piso">Piso / Apartamento</option>
            <option value="chalet">Chalet / Adosado</option>
            <option value="local">Local Comercial</option>
            <option value="oficina">Oficina</option>
            <option value="terreno">Terreno / Parcela</option>
            <option value="nave">Nave Industrial</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="val-area-built" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">M² Construidos *</label>
          <input
            id="val-area-built"
            aria-label="Metros cuadrados construidos"
            type="number"
            required
            min={1}
            value={areaBuilt}
            onChange={e => setAreaBuilt(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor="val-area-useful" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">M² Útiles</label>
          <input
            id="val-area-useful"
            aria-label="Metros cuadrados útiles"
            type="number"
            min={1}
            value={areaUseful}
            onChange={e => setAreaUseful(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor="val-year-built" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Año Construcción</label>
          <input
            id="val-year-built"
            aria-label="Año de Construcción"
            type="number"
            placeholder="2008"
            value={yearBuilt}
            onChange={e => setYearBuilt(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
        <div className="md:col-span-2">
          <label htmlFor="val-rooms" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Dormitorios</label>
          <input
            id="val-rooms"
            aria-label="Número de dormitorios"
            type="number"
            min={0}
            value={rooms}
            onChange={e => setRooms(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="val-bathrooms" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Baños / Aseos</label>
          <input
            id="val-bathrooms"
            aria-label="Número de baños o aseos"
            type="number"
            min={0}
            value={bathrooms}
            onChange={e => setBathrooms(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor="val-condition" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Estado Conservación</label>
          <select
            id="val-condition"
            aria-label="Estado de Conservación"
            value={condition}
            onChange={e => setCondition(e.target.value as any)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
          >
            <option value="buen_estado">Buen estado (estándar)</option>
            <option value="obra_nueva">Excelente / Obra nueva / Reformado</option>
            <option value="a_reformar">A reformar integralmente</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="val-energy-certificate" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Cert. Energética</label>
          <select
            id="val-energy-certificate"
            aria-label="Certificación Energética"
            value={energyCertificate}
            onChange={e => setEnergyCertificate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white font-bold"
          >
            <option value="A">Clase A</option>
            <option value="B">Clase B</option>
            <option value="C">Clase C</option>
            <option value="D">Clase D</option>
            <option value="E">Clase E</option>
            <option value="F">Clase F</option>
            <option value="G">Clase G</option>
            <option value="en_tramite">En trámite</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="val-orientation" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Orientación Principal</label>
          <select
            id="val-orientation"
            aria-label="Orientación Principal"
            value={orientation}
            onChange={e => setOrientation(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
          >
            <option value="Sur">Sur (Luminosidad óptima)</option>
            <option value="Sureste">Sureste</option>
            <option value="Este">Este (Sol de mañana)</option>
            <option value="Suroeste">Suroeste</option>
            <option value="Oeste">Oeste (Sol de tarde)</option>
            <option value="Norte">Norte</option>
            <option value="Noroeste">Noroeste</option>
            <option value="Noreste">Noreste</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-2">
        <div className="md:col-span-4">
          <label htmlFor="val-floor-height" className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">Altura de Planta</label>
          <select
            id="val-floor-height"
            aria-label="Altura de Planta"
            value={floorHeight}
            onChange={e => setFloorHeight(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-xs bg-white"
          >
            <option value="Planta Intermedia">Planta Intermedia (2ª a 4ª)</option>
            <option value="Ático / Última planta">Ático / Última planta</option>
            <option value="Planta Alta">Planta Alta (5ª+)</option>
            <option value="Bajo / Entreplanta">Bajo / Entreplanta</option>
          </select>
        </div>

        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <label htmlFor="val-has-elevator" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input id="val-has-elevator" aria-label="Dispone de Ascensor" type="checkbox" checked={hasElevator} onChange={e => setHasElevator(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Ascensor</span>
          </label>

          <label htmlFor="val-has-parking" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input id="val-has-parking" aria-label="Dispone de Garaje" type="checkbox" checked={hasParking} onChange={e => setHasParking(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Garaje</span>
          </label>

          <label htmlFor="val-has-terrace" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input id="val-has-terrace" aria-label="Dispone de Terraza" type="checkbox" checked={hasTerrace} onChange={e => setHasTerrace(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Terraza</span>
          </label>

          <label htmlFor="val-has-pool" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input id="val-has-pool" aria-label="Dispone de Piscina" type="checkbox" checked={hasPool} onChange={e => setHasPool(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Piscina</span>
          </label>

          <label htmlFor="val-has-storage" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input id="val-has-storage" aria-label="Dispone de Trastero" type="checkbox" checked={hasStorage} onChange={e => setHasStorage(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Trastero</span>
          </label>

          <label htmlFor="val-has-heating" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100">
            <input id="val-has-heating" aria-label="Dispone de Calefacción" type="checkbox" checked={hasHeating} onChange={e => setHasHeating(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Calefacción</span>
          </label>

          <label htmlFor="val-has-views" className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-100 sm:col-span-2">
            <input id="val-has-views" aria-label="Vistas Despejadas" type="checkbox" checked={hasViews} onChange={e => setHasViews(e.target.checked)} className="rounded text-primary focus:ring-primary h-4 w-4" />
            <span className="whitespace-nowrap">Vistas Despejadas</span>
          </label>
        </div>
      </div>
    </div>
  );
};
