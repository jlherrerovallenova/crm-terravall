import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type RentalContractData } from './RentalContractDocument';
import { buildRentalAddressString as buildAddressString } from '../lib/utils';
import { fetchCatastroData } from '@/lib/catastro';
import { RentalContractFormTab } from './rental/RentalContractFormTab';
import { RentalSignaturesTab } from './rental/RentalSignaturesTab';
import { RentalPreviewTab } from './rental/RentalPreviewTab';
import { X, Printer, FileText, Save, BookmarkCheck, PenTool } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onSaveSuccess?: (updatedData?: any) => void;
}

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

const RentalContractModalContent: React.FC<Props> = ({ isOpen: _isOpen, onClose, property, onSaveSuccess }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 transition-opacity duration-200">
        
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
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              {draftSaved ? <BookmarkCheck size={14} /> : <Save size={14} />}
              {draftSaved ? '¡Guardado!' : 'Guardar Contrato'}
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar modal de contrato de arrendamiento"
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
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            1. Formulario del Contrato
          </button>
          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'signatures' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool size={14} />
            2. Firmas Digitales
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'preview' ? 'bg-white text-primary shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer size={14} />
            3. Vista Previa / Imprimir PDF
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'form' && (
            <RentalContractFormTab
              formData={formData}
              setFormData={setFormData}
              loadingCatastro={loadingCatastro}
              onLookupCatastro={handleLookupCatastro}
              onContinue={() => setActiveTab('signatures')}
            />
          )}

          {activeTab === 'signatures' && (
            <RentalSignaturesTab
              formData={formData}
              setFormData={setFormData}
              onBack={() => setActiveTab('form')}
              onContinue={() => setActiveTab('preview')}
            />
          )}

          {activeTab === 'preview' && (
            <RentalPreviewTab
              formData={formData}
              onPrint={handlePrint}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const RentalContractModal: React.FC<Props> = (props) => {
  if (!props.isOpen) return null;
  return <RentalContractModalContent key={props.property?.id || 'rental-modal'} {...props} />;
};
