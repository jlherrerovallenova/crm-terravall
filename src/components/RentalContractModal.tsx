import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RentalContractDocument, buildAddressString, type RentalContractData } from './RentalContractDocument';
import { type CivilStatus } from '@/schema/rentalContract.schema';
import { SignatureCanvas } from './SignatureCanvas';
import { fetchCatastroData } from '@/lib/catastro';
import { X, Printer, Check, FileText, Save, BookmarkCheck, Search, PenTool, Home } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onSaveSuccess?: (updatedData?: any) => void;
}

export const RentalContractModal: React.FC<Props> = ({ isOpen, onClose, property, onSaveSuccess }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'signatures' | 'preview'>('form');
  const [draftSaved, setDraftSaved] = useState(false);
  const [loadingCatastro, setLoadingCatastro] = useState(false);

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

  const [formData, setFormData] = useState<RentalContractData>({
    city: 'Valladolid',
    dateStr,
    startDate: dateStr,
    durationYears: 1,
    monthlyRent: property?.price || 700,
    depositAmount: property?.price || 700,
    additionalGuarantee: property?.price || 700,
    ibanHolder: property?.owner_name || '',
    iban: property?.seller_iban || '',
    ownerEmail: property?.owner_email || 'juanh73@gmail.com',
    tenantEmail: property?.buyer1_email || '',
    tenantPhone: property?.buyer1_phone || '',
    rentIndex: 'I.R.A.V.',
    kitchenEquipped: property?.include_kitchen_clause || false,
    isFurnished: property?.include_furniture_clause || false,
    maxOccupants: 1,
    petsAllowed: false,
    communityPaidByOwner: true,
    ibiPaidByOwner: true,

    // Propietario 1
    owner1Name: property?.owner_name || '',
    owner1Dni: property?.owner_dni || '',
    owner1CivilStatus: property?.owner_civil_status || 'soltero',
    owner1Street: property?.owner_street || '',
    owner1Number: property?.owner_number || '',
    owner1FloorLetter: property?.owner_floor_letter || '',
    owner1City: property?.owner_city || property?.city || 'Valladolid',
    owner1Province: property?.owner_province || property?.province || 'Valladolid',
    owner1Zipcode: property?.owner_zipcode || property?.zipcode || '',
    owner1Address: property?.owner_address || '',

    // Propietario 2
    hasOwner2: property?.has_owner2 || false,
    owner2Name: property?.owner2_name || '',
    owner2Dni: property?.owner2_dni || '',
    owner2CivilStatus: property?.owner2_civil_status || 'soltero',
    owner2Street: property?.owner2_street || '',
    owner2Number: property?.owner2_number || '',
    owner2FloorLetter: property?.owner2_floor_letter || '',
    owner2City: property?.owner2_city || '',
    owner2Province: property?.owner2_province || '',
    owner2Zipcode: property?.owner2_zipcode || '',

    // Inquilino 1
    tenant1Name: property?.buyer1_name || '',
    tenant1Dni: property?.buyer1_dni || '',
    tenant1CivilStatus: property?.buyer1_civil_status || 'soltero',
    tenant1Street: property?.buyer1_street || '',
    tenant1Number: property?.buyer1_number || '',
    tenant1FloorLetter: property?.buyer1_floor_letter || '',
    tenant1City: property?.buyer1_city || property?.city || 'Valladolid',
    tenant1Province: property?.buyer1_province || property?.province || 'Valladolid',
    tenant1Zipcode: property?.buyer1_zipcode || property?.zipcode || '',
    tenant1Address: property?.buyer1_address || '',

    // Inquilino 2
    hasTenant2: property?.has_buyer2 || false,
    tenant2Name: property?.buyer2_name || '',
    tenant2Dni: property?.buyer2_dni || '',
    tenant2CivilStatus: property?.buyer2_civil_status || 'soltero',
    tenant2Street: property?.buyer2_street || '',
    tenant2Number: property?.buyer2_number || '',
    tenant2FloorLetter: property?.buyer2_floor_letter || '',
    tenant2City: property?.buyer2_city || '',
    tenant2Province: property?.buyer2_province || '',
    tenant2Zipcode: property?.buyer2_zipcode || '',

    // Inmueble
    propertyAddress: property?.address_hidden || property?.title || '',
    propertyStreet: property?.address_street || '',
    propertyNumber: property?.address_number || '',
    propertyFloorLetter: property?.address_floor_letter || '',
    propertyCity: property?.city || 'Valladolid',
    propertyProvince: property?.province || 'Valladolid',
    propertyZipcode: property?.zipcode || '',
    cadastralReference: property?.cadastral_reference || '6227309UM5162E0024WM',
    registryNumber: property?.fincas_data?.[0]?.registryNumber || '',
    registryCity: property?.fincas_data?.[0]?.registryCity || property?.city || 'Valladolid',
    cru: property?.cru || '',
    signatures: {}
  });

  useEffect(() => {
    if (property) {
      setFormData(prev => ({
        ...prev,
        owner1Name: property.owner_name || prev.owner1Name,
        owner1Dni: property.owner_dni || prev.owner1Dni,
        owner1Street: property.owner_street || prev.owner1Street,
        owner1Number: property.owner_number || prev.owner1Number,
        owner1FloorLetter: property.owner_floor_letter || prev.owner1FloorLetter,
        owner1City: property.owner_city || property.city || prev.owner1City,
        owner1Province: property.owner_province || property.province || prev.owner1Province,
        owner1Zipcode: property.owner_zipcode || prev.owner1Zipcode,
        monthlyRent: property.price || prev.monthlyRent,
        depositAmount: property.price || prev.depositAmount,
        additionalGuarantee: property.price || prev.additionalGuarantee,
        cadastralReference: property.cadastral_reference || prev.cadastralReference,
        propertyStreet: property.address_street || prev.propertyStreet,
        propertyNumber: property.address_number || prev.propertyNumber,
        propertyFloorLetter: property.address_floor_letter || prev.propertyFloorLetter,
        propertyCity: property.city || prev.propertyCity,
        propertyProvince: property.province || prev.propertyProvince,
        propertyZipcode: property.zipcode || prev.propertyZipcode,
      }));
    }
  }, [property]);

  const handleLookupCatastro = async () => {
    if (!formData.cadastralReference || formData.cadastralReference.length < 14) {
      alert('Introduce una Referencia Catastral válida (14-20 caracteres).');
      return;
    }
    setLoadingCatastro(true);
    try {
      const data = await fetchCatastroData(formData.cadastralReference);
      if (data) {
        setFormData(prev => ({
          ...prev,
          cadastralReference: data.refCat,
          propertyStreet: data.street || prev.propertyStreet,
          propertyNumber: data.number || prev.propertyNumber,
          propertyFloorLetter: data.floorLetter || prev.propertyFloorLetter,
          propertyCity: data.city || prev.propertyCity,
          propertyProvince: data.province || prev.propertyProvince,
        }));
        alert('Datos de Catastro importados correctamente.');
      }
    } catch (err: any) {
      alert(err.message || 'Error al consultar el Catastro.');
    } finally {
      setLoadingCatastro(false);
    }
  };

  const handleSaveToSupabase = async () => {
    try {
      const payload = {
        property_id: property?.id || null,
        city: formData.city,
        date_str: formData.dateStr,
        owner1_name: formData.owner1Name,
        owner1_dni: formData.owner1Dni,
        owner1_civil_status: formData.owner1CivilStatus,
        owner1_street: formData.owner1Street,
        owner1_number: formData.owner1Number,
        owner1_floor_letter: formData.owner1FloorLetter,
        owner1_city: formData.owner1City,
        owner1_province: formData.owner1Province,
        owner1_zipcode: formData.owner1Zipcode,
        has_owner2: formData.hasOwner2,
        owner2_name: formData.owner2Name,
        owner2_dni: formData.owner2Dni,
        tenant1_name: formData.tenant1Name,
        tenant1_dni: formData.tenant1Dni,
        tenant1_civil_status: formData.tenant1CivilStatus,
        tenant1_street: formData.tenant1Street,
        tenant1_number: formData.tenant1Number,
        tenant1_floor_letter: formData.tenant1FloorLetter,
        tenant1_city: formData.tenant1City,
        tenant1_province: formData.tenant1Province,
        tenant1_zipcode: formData.tenant1Zipcode,
        has_tenant2: formData.hasTenant2,
        tenant2_name: formData.tenant2Name,
        tenant2_dni: formData.tenant2Dni,
        property_address: buildAddressString(formData.propertyStreet, formData.propertyNumber, formData.propertyFloorLetter, formData.propertyCity, formData.propertyProvince, formData.propertyZipcode, formData.propertyAddress),
        cadastral_reference: formData.cadastralReference,
        registry_number: formData.registryNumber,
        registry_city: formData.registryCity,
        cru: formData.cru,
        kitchen_equipped: formData.kitchenEquipped,
        is_furnished: formData.isFurnished,
        max_occupants: formData.maxOccupants,
        pets_allowed: formData.petsAllowed,
        start_date: formData.startDate,
        duration_years: formData.durationYears,
        monthly_rent: formData.monthlyRent,
        iban: formData.iban,
        iban_holder: formData.ibanHolder,
        owner_email: formData.ownerEmail,
        tenant_email: formData.tenantEmail,
        tenant_phone: formData.tenantPhone,
        deposit_amount: formData.depositAmount,
        additional_guarantee: formData.additionalGuarantee,
        signatures: formData.signatures
      };

      const { error } = await supabase.from('rental_contracts').insert([payload]);
      if (error) throw error;

      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
      if (onSaveSuccess) onSaveSuccess(payload);
    } catch (err: any) {
      alert('Error al guardar el contrato en Supabase: ' + err.message);
    }
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contrato de Arrendamiento de Vivienda - Terravall</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 15mm; }
          body { background: white; color: black; font-family: ui-serif, Georgia, Cambria, serif; }
        </style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => {
      printWin.print();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 text-primary rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Generador de Contrato de Arrendamiento (LAU)</h2>
              <p className="text-xs text-slate-400">Contrato de alquiler de vivienda habitual según Ley 29/1994 y Ley 12/2023</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToSupabase}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              {draftSaved ? <BookmarkCheck size={14} /> : <Save size={14} />}
              {draftSaved ? '¡Guardado!' : 'Guardar Contrato'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 border-b border-slate-200 px-6 py-2 gap-2">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            1. Formulario del Contrato
          </button>
          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'signatures' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool size={14} />
            2. Firmas Digitales
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview' ? 'bg-white text-primary shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer size={14} />
            3. Vista Previa / Imprimir PDF
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* TAB 1: FORMULARIO */}
          {activeTab === 'form' && (
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
                    <Label className="whitespace-nowrap">Estado Civil</Label>
                    <select
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
                    <Label className="whitespace-nowrap">Estado Civil</Label>
                    <select
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

              {/* Sección 4: Datos de la Finca / Inmueble Arrendado */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Home size={16} className="text-primary" />
                    4. Identificación Físico-Registral de la Vivienda
                  </h3>
                  <button
                    type="button"
                    onClick={handleLookupCatastro}
                    disabled={loadingCatastro}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
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
                  onClick={() => setActiveTab('signatures')}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Continuar a Firmas Digitales →
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: FIRMAS DIGITALES */}
          {activeTab === 'signatures' && (
            <div className="space-y-6 max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <PenTool size={18} className="text-primary" />
                Captura de Firmas Manuscritas Digitales
              </h3>
              <p className="text-xs text-slate-500">
                Puedes dibujar la firma digital en pantalla para que aparezca impresa automáticamente en la hoja de firmas del contrato legal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {/* Firma Propietario */}
                <div className="space-y-2">
                  <Label className="whitespace-nowrap font-bold text-slate-800">Firma del Propietario ({formData.owner1Name || 'Propietario'})</Label>
                  <SignatureCanvas
                    onSave={(dataUrl) => setFormData(p => ({
                      ...p,
                      signatures: { ...p.signatures, owner1: dataUrl || undefined }
                    }))}
                  />
                  {formData.signatures?.owner1 && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <Check size={14} /> Firma del Propietario capturada
                    </p>
                  )}
                </div>

                {/* Firma Inquilino */}
                <div className="space-y-2">
                  <Label className="whitespace-nowrap font-bold text-slate-800">Firma del Inquilino ({formData.tenant1Name || 'Inquilino'})</Label>
                  <SignatureCanvas
                    onSave={(dataUrl) => setFormData(p => ({
                      ...p,
                      signatures: { ...p.signatures, tenant1: dataUrl || undefined }
                    }))}
                  />
                  {formData.signatures?.tenant1 && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <Check size={14} /> Firma del Inquilino capturada
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={() => setActiveTab('form')}>
                  ← Volver al Formulario
                </Button>
                <Button
                  onClick={() => setActiveTab('preview')}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Ver Vista Previa del Documento →
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: VISTA PREVIA Y PDF */}
          {activeTab === 'preview' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Documento Final Generado</h4>
                  <p className="text-xs text-slate-500">Listo para revisión legal, descarga en PDF o impresión física.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Printer size={16} />
                    Imprimir / Descargar PDF
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto p-4 bg-slate-200/60 rounded-2xl flex justify-center">
                <RentalContractDocument data={formData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
