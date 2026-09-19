import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RentalContractData } from '../RentalContractDocument';
import { type CivilStatus } from '@/schema/rentalContract.schema';
import { FileText, Home } from 'lucide-react';

interface RentalPartiesSectionProps {
  formData: RentalContractData;
  setFormData: React.Dispatch<React.SetStateAction<RentalContractData>>;
}

export const RentalPartiesSection: React.FC<RentalPartiesSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      {/* Sección 2: El Propietario (Arrendador) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Home size={16} className="text-primary" />
          2. Datos del Propietario (Arrendador)
        </h3>
        
        {/* Desglose 6 campos del Propietario 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Nombre y Apellidos del Arrendador *</Label>
            <Input
              value={formData.owner1Name}
              onChange={e => setFormData(p => ({ ...p, owner1Name: e.target.value }))}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="md:col-span-3">
            <Label className="whitespace-nowrap">DNI / NIE / Pasaporte *</Label>
            <Input
              value={formData.owner1Dni}
              onChange={e => setFormData(p => ({ ...p, owner1Dni: e.target.value }))}
              placeholder="12345678Z"
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="rental-owner1-civil-status" className="whitespace-nowrap">Estado Civil</Label>
            <select
              id="rental-owner1-civil-status"
              aria-label="Estado Civil Arrendador 1"
              value={formData.owner1CivilStatus}
              onChange={e => setFormData(p => ({ ...p, owner1CivilStatus: e.target.value as CivilStatus }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
            >
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="pareja_de_hecho">Pareja de Hecho</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="separado">Separado/a</option>
              <option value="viudo">Viudo/a</option>
            </select>
          </div>
        </div>

        {/* Desglose Dirección Propietario 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-4">
            <Label className="whitespace-nowrap">Domicilio (Calle, Avda, Plaza)</Label>
            <Input
              value={formData.owner1Street}
              onChange={e => setFormData(p => ({ ...p, owner1Street: e.target.value }))}
              placeholder="Ej. Calle Santiago"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Número</Label>
            <Input
              value={formData.owner1Number}
              onChange={e => setFormData(p => ({ ...p, owner1Number: e.target.value }))}
              placeholder="12"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Piso y Letra</Label>
            <Input
              value={formData.owner1FloorLetter}
              onChange={e => setFormData(p => ({ ...p, owner1FloorLetter: e.target.value }))}
              placeholder="3º B"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Municipio</Label>
            <Input
              value={formData.owner1City}
              onChange={e => setFormData(p => ({ ...p, owner1City: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Provincia</Label>
            <Input
              value={formData.owner1Province}
              onChange={e => setFormData(p => ({ ...p, owner1Province: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
        </div>
      </div>

      {/* Sección 3: El Inquilino (Arrendatario) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileText size={16} className="text-primary" />
          3. Datos del Inquilino (Arrendatario)
        </h3>

        {/* Desglose 6 campos del Inquilino 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Nombre y Apellidos del Inquilino *</Label>
            <Input
              value={formData.tenant1Name}
              onChange={e => setFormData(p => ({ ...p, tenant1Name: e.target.value }))}
              placeholder="Ej. María García López"
            />
          </div>
          <div className="md:col-span-3">
            <Label className="whitespace-nowrap">DNI / NIE / Pasaporte *</Label>
            <Input
              value={formData.tenant1Dni}
              onChange={e => setFormData(p => ({ ...p, tenant1Dni: e.target.value }))}
              placeholder="87654321X"
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="rental-tenant1-civil-status" className="whitespace-nowrap">Estado Civil</Label>
            <select
              id="rental-tenant1-civil-status"
              aria-label="Estado Civil Arrendatario 1"
              value={formData.tenant1CivilStatus}
              onChange={e => setFormData(p => ({ ...p, tenant1CivilStatus: e.target.value as CivilStatus }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white"
            >
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="pareja_de_hecho">Pareja de Hecho</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="separado">Separado/a</option>
              <option value="viudo">Viudo/a</option>
            </select>
          </div>
        </div>

        {/* Desglose Dirección Inquilino 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-4">
            <Label className="whitespace-nowrap">Domicilio Habitual (Calle, Avda)</Label>
            <Input
              value={formData.tenant1Street}
              onChange={e => setFormData(p => ({ ...p, tenant1Street: e.target.value }))}
              placeholder="Ej. Plaza Mayor"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Número</Label>
            <Input
              value={formData.tenant1Number}
              onChange={e => setFormData(p => ({ ...p, tenant1Number: e.target.value }))}
              placeholder="8"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Piso y Letra</Label>
            <Input
              value={formData.tenant1FloorLetter}
              onChange={e => setFormData(p => ({ ...p, tenant1FloorLetter: e.target.value }))}
              placeholder="1º A"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Municipio</Label>
            <Input
              value={formData.tenant1City}
              onChange={e => setFormData(p => ({ ...p, tenant1City: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Provincia</Label>
            <Input
              value={formData.tenant1Province}
              onChange={e => setFormData(p => ({ ...p, tenant1Province: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Email del Inquilino (Notificaciones)</Label>
            <Input
              type="email"
              value={formData.tenantEmail}
              onChange={e => setFormData(p => ({ ...p, tenantEmail: e.target.value }))}
              placeholder="inquilino@ejemplo.com"
            />
          </div>
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Teléfono del Inquilino</Label>
            <Input
              type="tel"
              value={formData.tenantPhone}
              onChange={e => setFormData(p => ({ ...p, tenantPhone: e.target.value }))}
              placeholder="600000000"
            />
          </div>
        </div>
      </div>
    </>
  );
};
