import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RentalContractData } from '../RentalContractDocument';
import { FileText, Home, Search } from 'lucide-react';
import { RentalPartiesSection } from './RentalPartiesSection';

interface RentalContractFormTabProps {
  formData: RentalContractData;
  setFormData: React.Dispatch<React.SetStateAction<RentalContractData>>;
  loadingCatastro: boolean;
  onLookupCatastro: () => void;
  onContinue: () => void;
}

export const RentalContractFormTab: React.FC<RentalContractFormTabProps> = ({
  formData,
  setFormData,
  loadingCatastro,
  onLookupCatastro,
  onContinue
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Sección 1: Datos Generales */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileText size={16} className="text-primary" />
          1. Lugar y Fecha del Contrato
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Municipio de Firma *</Label>
            <Input
              value={formData.city}
              onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Fecha del Contrato *</Label>
            <Input
              value={formData.dateStr}
              onChange={e => setFormData(p => ({ ...p, dateStr: e.target.value }))}
              placeholder="28/08/2026"
            />
          </div>
        </div>
      </div>

      {/* Secciones 2 y 3: Propietarios e Inquilinos */}
      <RentalPartiesSection formData={formData} setFormData={setFormData} />

      {/* Sección 4: Datos de la Finca / Inmueble Arrendado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Home size={16} className="text-primary" />
            4. Identificación Físico-Registral de la Vivienda
          </h3>
          <button
            type="button"
            onClick={onLookupCatastro}
            disabled={loadingCatastro}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search size={13} />
            {loadingCatastro ? 'Consultando Catastro...' : 'Auto-Completar con Catastro'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <Label className="whitespace-nowrap">Calle / Avenida de la Vivienda *</Label>
            <Input
              value={formData.propertyStreet}
              onChange={e => setFormData(p => ({ ...p, propertyStreet: e.target.value }))}
              placeholder="Ej. Plaza Mayor"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Número</Label>
            <Input
              value={formData.propertyNumber}
              onChange={e => setFormData(p => ({ ...p, propertyNumber: e.target.value }))}
              placeholder="8"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Piso y Letra</Label>
            <Input
              value={formData.propertyFloorLetter}
              onChange={e => setFormData(p => ({ ...p, propertyFloorLetter: e.target.value }))}
              placeholder="1º A"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Municipio</Label>
            <Input
              value={formData.propertyCity}
              onChange={e => setFormData(p => ({ ...p, propertyCity: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="whitespace-nowrap">Provincia</Label>
            <Input
              value={formData.propertyProvince}
              onChange={e => setFormData(p => ({ ...p, propertyProvince: e.target.value }))}
              placeholder="Valladolid"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Referencia Catastral (20 Caracteres)</Label>
            <Input
              value={formData.cadastralReference}
              onChange={e => setFormData(p => ({ ...p, cadastralReference: e.target.value }))}
              placeholder="6227309UM5162E0024WM"
              className="font-mono uppercase"
            />
          </div>
          <div className="md:col-span-3">
            <Label className="whitespace-nowrap">Nº Finca Registral</Label>
            <Input
              value={formData.registryNumber}
              onChange={e => setFormData(p => ({ ...p, registryNumber: e.target.value }))}
              placeholder="14520"
            />
          </div>
          <div className="md:col-span-3">
            <Label className="whitespace-nowrap">CRU (Código Registro Único)</Label>
            <Input
              value={formData.cru}
              onChange={e => setFormData(p => ({ ...p, cru: e.target.value }))}
              placeholder="47012000123456"
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-3">
            <Label className="whitespace-nowrap">Nº Máximo Ocupantes</Label>
            <Input
              type="number"
              min={1}
              value={formData.maxOccupants}
              onChange={e => setFormData(p => ({ ...p, maxOccupants: Number(e.target.value) }))}
            />
          </div>

          <div className="md:col-span-9 flex items-center gap-4 flex-wrap pt-4">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.kitchenEquipped}
                onChange={e => setFormData(p => ({ ...p, kitchenEquipped: e.target.checked }))}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span>Cocina Equipada</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFurnished}
                onChange={e => setFormData(p => ({ ...p, isFurnished: e.target.checked }))}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span>Casa Amueblada</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.petsAllowed}
                onChange={e => setFormData(p => ({ ...p, petsAllowed: e.target.checked }))}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span>Se Permiten Mascotas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sección 5: Renta, Garantías e IBAN */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileText size={16} className="text-primary" />
          5. Condiciones Económicas, Renta e IBAN
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <Label className="whitespace-nowrap">Renta Mensual (€/mes) *</Label>
            <Input
              type="number"
              value={formData.monthlyRent}
              onChange={e => {
                const val = Number(e.target.value);
                setFormData(p => ({
                  ...p,
                  monthlyRent: val,
                  depositAmount: val,
                  additionalGuarantee: val
                }));
              }}
              placeholder="700"
            />
          </div>

          <div className="md:col-span-4">
            <Label className="whitespace-nowrap">Fianza Legal (€) [1 mes LAU] *</Label>
            <Input
              type="number"
              value={formData.depositAmount}
              onChange={e => setFormData(p => ({ ...p, depositAmount: Number(e.target.value) }))}
            />
          </div>

          <div className="md:col-span-4">
            <Label className="whitespace-nowrap">Garantía Adicional (€)</Label>
            <Input
              type="number"
              value={formData.additionalGuarantee}
              onChange={e => setFormData(p => ({ ...p, additionalGuarantee: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Titular de la Cuenta Bancaria *</Label>
            <Input
              value={formData.ibanHolder}
              onChange={e => setFormData(p => ({ ...p, ibanHolder: e.target.value }))}
              placeholder="Juan Pérez"
            />
          </div>

          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Número de Cuenta IBAN *</Label>
            <Input
              value={formData.iban}
              onChange={e => setFormData(p => ({ ...p, iban: e.target.value }))}
              placeholder="ES21 0000 0000 0000 0000 0000"
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Índice de Actualización Anual</Label>
            <Input
              value={formData.rentIndex}
              onChange={e => setFormData(p => ({ ...p, rentIndex: e.target.value }))}
              placeholder="I.R.A.V. (INE)"
            />
          </div>

          <div className="md:col-span-6">
            <Label className="whitespace-nowrap">Email del Propietario (Notificaciones)</Label>
            <Input
              type="email"
              value={formData.ownerEmail}
              onChange={e => setFormData(p => ({ ...p, ownerEmail: e.target.value }))}
              placeholder="juanh73@gmail.com"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onContinue}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer"
        >
          Continuar a Firmas Digitales →
        </Button>
      </div>
    </div>
  );
};
