-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase

CREATE TYPE property_visibility AS ENUM ('exact', 'street_only', 'hidden');
CREATE TYPE exceptional_situation AS ENUM ('ocupada', 'alquilada', 'nuda_propiedad', 'ninguna');
CREATE TYPE notes_visibility AS ENUM ('solo_yo', 'oficina');

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_top_floor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_stairs TEXT,
ADD COLUMN IF NOT EXISTS door TEXT,
ADD COLUMN IF NOT EXISTS urbanization_name TEXT,
ADD COLUMN IF NOT EXISTS visibility property_visibility NOT NULL DEFAULT 'exact',
ADD COLUMN IF NOT EXISTS is_bank_owned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exceptional_situation exceptional_situation DEFAULT 'ninguna',
ADD COLUMN IF NOT EXISTS energy_consumption INTEGER,
ADD COLUMN IF NOT EXISTS emissions_certificate energy_cert_type DEFAULT 'en_tramite',
ADD COLUMN IF NOT EXISTS emissions INTEGER,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS capture_agent TEXT,
ADD COLUMN IF NOT EXISTS sales_agent TEXT,
ADD COLUMN IF NOT EXISTS internal_reference TEXT,
ADD COLUMN IF NOT EXISTS private_notes TEXT,
ADD COLUMN IF NOT EXISTS notes_visibility notes_visibility DEFAULT 'solo_yo';
