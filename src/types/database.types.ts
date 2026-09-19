/**
 * Supabase Database Types for CRM Terravall
 * Auto-generated and maintained schema definitions matching Supabase PostgreSQL database tables.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PropertyType = 'piso' | 'chalet' | 'local' | 'oficina' | 'terreno' | 'nave';
export type PropertyOperation = 'venta' | 'alquiler' | 'traspaso';
export type PropertyCondition = 'buen_estado' | 'a_reformar' | 'obra_nueva';
export type PropertyVisibility = 'exact' | 'street_only' | 'hidden';
export type ExceptionalSituation = 'ocupada' | 'alquilada' | 'nuda_propiedad' | 'ninguna';
export type NotesVisibility = 'solo_yo' | 'oficina';
export type CommissionType = 'porcentaje' | 'fija';
export type CivilStatus = 'soltero' | 'casado' | 'pareja_de_hecho' | 'divorciado' | 'separado' | 'viudo';
export type MatrimonialRegime = 'gananciales' | 'separacion_bienes' | 'participacion';
export type RelationshipType = 'ninguna' | 'casados_entre_si' | 'pareja_hecho_entre_si';
export type DocumentCategory = 'vendedor' | 'comprador' | 'proceso' | 'otros';
export type EmailRecipientType = 'notaria' | 'banco' | 'gestoria' | 'personalizado';
export type EmailStatus = 'sent' | 'failed' | 'simulated';

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: PropertyRow;
        Insert: PropertyInsert;
        Update: PropertyUpdate;
        Relationships: [];
      };
      property_media: {
        Row: PropertyMediaRow;
        Insert: PropertyMediaInsert;
        Update: PropertyMediaUpdate;
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
      property_documents: {
        Row: PropertyDocumentRow;
        Insert: PropertyDocumentInsert;
        Update: PropertyDocumentUpdate;
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
      documentation_emails: {
        Row: DocumentationEmailRow;
        Insert: DocumentationEmailInsert;
        Update: DocumentationEmailUpdate;
        Relationships: [
          {
            foreignKeyName: "documentation_emails_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
      agency_settings: {
        Row: AgencySettingsRow;
        Insert: AgencySettingsInsert;
        Update: AgencySettingsUpdate;
        Relationships: [];
      };
      agents: {
        Row: AgentRow;
        Insert: AgentInsert;
        Update: AgentUpdate;
        Relationships: [];
      };
      property_valuations: {
        Row: PropertyValuationRow;
        Insert: PropertyValuationInsert;
        Update: PropertyValuationUpdate;
        Relationships: [];
      };
      rental_contracts: {
        Row: RentalContractRow;
        Insert: RentalContractInsert;
        Update: RentalContractUpdate;
        Relationships: [
          {
            foreignKeyName: "rental_contracts_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      property_type: PropertyType;
      property_operation: PropertyOperation;
      property_condition: PropertyCondition;
      property_visibility: PropertyVisibility;
      exceptional_situation: ExceptionalSituation;
      notes_visibility: NotesVisibility;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export interface PropertyRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;

  type: PropertyType;
  subtype: string | null;
  operation: PropertyOperation;
  price: number;

  // Ubicación desglosada
  address_hidden: string;
  address_public: string | null;
  city: string;
  province: string;
  zipcode: string;
  block_stairs: string | null;
  door: string | null;
  urbanization_name: string | null;
  visibility: PropertyVisibility;
  hide_exact_address: boolean;
  is_top_floor: boolean;

  // Situación y dimensiones
  is_bank_owned: boolean;
  exceptional_situation: ExceptionalSituation;
  area_useful: number | null;
  area_built: number;
  condition: PropertyCondition;

  // Certificados energéticos
  energy_certificate: string;
  energy_consumption: number | null;
  emissions_certificate: string;
  emissions: number | null;

  // Textos comerciales y SEO
  title: string;
  description: string;

  // Publicación en portales
  publish_web: boolean;
  publish_idealista: boolean;
  publish_fotocasa: boolean;

  // Datos internos y gestión comercial
  website_url: string | null;
  capture_agent: string | null;
  sales_agent: string | null;
  internal_reference: string | null;
  private_notes: string | null;
  notes_visibility: NotesVisibility;

  // Propietario 1 (Principal)
  owner_name: string | null;
  owner_dni: string | null;
  owner_civil_status: CivilStatus | null;
  owner_matrimonial_regime: MatrimonialRegime | null;
  owner_address: string | null;
  owner_street: string | null;
  owner_number: string | null;
  owner_floor_letter: string | null;
  owner_city: string | null;
  owner_province: string | null;
  owner_zipcode: string | null;
  owner_phone: string | null;
  owner_email: string | null;

  // Propietario 2
  has_owner2: boolean | null;
  owner2_name: string | null;
  owner2_dni: string | null;
  owner2_civil_status: CivilStatus | null;
  owner2_matrimonial_regime: MatrimonialRegime | null;
  owner2_address: string | null;
  owner2_street: string | null;
  owner2_number: string | null;
  owner2_floor_letter: string | null;
  owner2_city: string | null;
  owner2_province: string | null;
  owner2_zipcode: string | null;
  seller2_same_address: boolean | null;
  owners_relationship: RelationshipType | null;

  // Honorarios
  commission_type: CommissionType;
  commission_value: number | null;
  exclusivity_months: number | null;

  // Comprador 1
  buyer1_name: string | null;
  buyer1_dni: string | null;
  buyer1_civil_status: CivilStatus | null;
  buyer1_matrimonial_regime: MatrimonialRegime | null;
  buyer1_address: string | null;
  buyer1_street: string | null;
  buyer1_number: string | null;
  buyer1_floor_letter: string | null;
  buyer1_city: string | null;
  buyer1_province: string | null;
  buyer1_zipcode: string | null;

  // Comprador 2
  has_buyer2: boolean | null;
  buyer2_name: string | null;
  buyer2_dni: string | null;
  buyer2_civil_status: CivilStatus | null;
  buyer2_matrimonial_regime: MatrimonialRegime | null;
  buyer2_address: string | null;
  buyer2_street: string | null;
  buyer2_number: string | null;
  buyer2_floor_letter: string | null;
  buyer2_city: string | null;
  buyer2_province: string | null;
  buyer2_zipcode: string | null;
  buyer2_same_address: boolean | null;
  buyers_relationship: RelationshipType | null;

  // Contrato de Arras y Fincas
  seller_iban: string | null;
  notary_deadline: string | null;
  jurisdiction_city: string | null;
  arras_amount_num: number | null;
  cru: string | null;
  cadastral_reference: string | null;
  charges_option: string | null;
  retention_amount: string | null;
  return_days: string | null;
  management_months: string | null;
  include_kitchen_clause: boolean | null;
  include_furniture_clause: boolean | null;
  furniture_description: string | null;
  include_photo_report_clause: boolean | null;
  include_mortgage_suspensive_clause: boolean | null;
  mortgage_days: string | null;
  mortgage_amount: string | null;
  fincas_data: Json | null;
  arras_contract_data: Json | null;

  // Características dinámicas
  specific_features: Record<string, any>;
}

export type PropertyInsert = Partial<Omit<PropertyRow, 'id' | 'created_at' | 'updated_at'>> & {
  type: PropertyType;
  operation: PropertyOperation;
  price: number;
  title: string;
  description: string;
  address_hidden: string;
  city: string;
  province: string;
  zipcode: string;
  area_built: number;
  condition: PropertyCondition;
};

export type PropertyUpdate = Partial<PropertyRow>;

export interface PropertyMediaRow {
  id: string;
  property_id: string;
  type: 'image' | 'video' | 'virtual_tour';
  url: string;
  sort_order: number;
  created_at: string;
}

export type PropertyMediaInsert = Omit<PropertyMediaRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type PropertyMediaUpdate = Partial<PropertyMediaRow>;

export interface PropertyDocumentRow {
  id: string;
  property_id: string;
  category: DocumentCategory;
  document_type: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyDocumentInsert = Omit<PropertyDocumentRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PropertyDocumentUpdate = Partial<PropertyDocumentRow>;

export interface DocumentationEmailRow {
  id: string;
  property_id: string;
  recipient_type: EmailRecipientType;
  recipient_name: string | null;
  recipient_email: string;
  cc_emails: string | null;
  subject: string;
  message_body: string | null;
  selected_documents: Json;
  status: EmailStatus;
  error_message: string | null;
  created_at: string;
}

export type DocumentationEmailInsert = Omit<DocumentationEmailRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type DocumentationEmailUpdate = Partial<DocumentationEmailRow>;

export interface AgencySettingsRow {
  id: string;
  name: string | null;
  commercial_name: string | null;
  cif: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  idealista_client_id: string | null;
  idealista_client_secret: string | null;
  idealista_sync: boolean | null;
  fotocasa_api_key: string | null;
  fotocasa_office_code: string | null;
  fotocasa_sync: boolean | null;
  gemini_api_key: string | null;
  brevo_api_key?: string | null;
  resend_api_key?: string | null;
  created_at: string;
  updated_at: string;
}

export type AgencySettingsInsert = Partial<AgencySettingsRow>;
export type AgencySettingsUpdate = Partial<AgencySettingsRow>;

export interface AgentRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export type AgentInsert = Omit<AgentRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AgentUpdate = Partial<AgentRow>;

export interface PropertyValuationRow {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  property_type: string;
  city: string;
  province: string;
  zone: string | null;
  zipcode: string | null;
  address: string | null;
  cadastral_reference: string | null;
  year_built: number | null;
  area_built: number;
  area_useful: number | null;
  rooms: number | null;
  bathrooms: number | null;
  condition: string | null;
  energy_certificate: string | null;
  orientation: string | null;
  floor_height: string | null;
  purpose: string | null;
  has_elevator: boolean | null;
  has_parking: boolean | null;
  has_terrace: boolean | null;
  has_pool: boolean | null;
  has_storage: boolean | null;
  has_heating: boolean | null;
  has_views: boolean | null;
  price_min: number;
  price_target: number;
  price_max: number;
  rent_target: number | null;
  price_per_m2: number;
  gross_yield: number | null;
  per_years: number | null;
  ai_opinion: string | null;
  agent_name: string | null;
  comparable_properties: Json | null;
  created_at: string;
  updated_at: string;
}

export type PropertyValuationInsert = Omit<PropertyValuationRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PropertyValuationUpdate = Partial<PropertyValuationRow>;

export interface RentalContractRow {
  id: string;
  property_id: string | null;
  city: string | null;
  date_str: string;
  owner1_name: string;
  owner1_dni: string;
  owner1_civil_status: string | null;
  owner1_street: string | null;
  owner1_number: string | null;
  owner1_floor_letter: string | null;
  owner1_city: string | null;
  owner1_province: string | null;
  owner1_zipcode: string | null;
  has_owner2: boolean | null;
  owner2_name: string | null;
  owner2_dni: string | null;
  owner2_civil_status: string | null;
  owner2_street: string | null;
  owner2_number: string | null;
  owner2_floor_letter: string | null;
  owner2_city: string | null;
  owner2_province: string | null;
  owner2_zipcode: string | null;
  tenant1_name: string;
  tenant1_dni: string;
  tenant1_civil_status: string | null;
  tenant1_street: string | null;
  tenant1_number: string | null;
  tenant1_floor_letter: string | null;
  tenant1_city: string | null;
  tenant1_province: string | null;
  tenant1_zipcode: string | null;
  has_tenant2: boolean | null;
  tenant2_name: string | null;
  tenant2_dni: string | null;
  tenant2_civil_status: string | null;
  tenant2_street: string | null;
  tenant2_number: string | null;
  tenant2_floor_letter: string | null;
  tenant2_city: string | null;
  tenant2_province: string | null;
  tenant2_zipcode: string | null;
  property_address: string;
  property_street: string | null;
  property_number: string | null;
  property_floor_letter: string | null;
  property_city: string | null;
  property_province: string | null;
  property_zipcode: string | null;
  finca_number: string | null;
  registry_city: string | null;
  cadastral_reference: string | null;
  monthly_rent: number;
  payment_day_limit: number | null;
  landlord_iban: string | null;
  deposit_months: number | null;
  deposit_amount: number | null;
  guarantee_months: number | null;
  guarantee_amount: number | null;
  duration_years: number | null;
  start_date: string | null;
  inventory_description: string | null;
  community_expenses_included: boolean | null;
  ibi_included: boolean | null;
  supplies_by_tenant: boolean | null;
  pets_allowed: boolean | null;
  jurisdiction_city: string | null;
  has_guarantor: boolean | null;
  guarantor_name: string | null;
  guarantor_dni: string | null;
  guarantor_street: string | null;
  guarantor_number: string | null;
  guarantor_floor_letter: string | null;
  guarantor_city: string | null;
  guarantor_province: string | null;
  guarantor_zipcode: string | null;
  created_at: string;
  updated_at: string;
}

export type RentalContractInsert = Omit<RentalContractRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type RentalContractUpdate = Partial<RentalContractRow>;

/**
 * Composite helper types for Property with its Media items
 */
export type PropertyWithMedia = PropertyRow & {
  property_media: PropertyMediaRow[];
};
