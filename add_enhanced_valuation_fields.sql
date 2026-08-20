-- =======================================================
-- MIGRACIÓN: Campos Avanzados para Módulo de Valoraciones (ACM)
-- CRM TERRAVALL
-- =======================================================

ALTER TABLE property_valuations 
  ADD COLUMN IF NOT EXISTS zone TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'venta',
  ADD COLUMN IF NOT EXISTS energy_certificate TEXT DEFAULT 'en_tramite',
  ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'Sur',
  ADD COLUMN IF NOT EXISTS floor_height TEXT DEFAULT 'Planta Intermedia',
  ADD COLUMN IF NOT EXISTS has_views BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_storage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_heating BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS cadastral_reference TEXT,
  ADD COLUMN IF NOT EXISTS year_built INT DEFAULT 2005,
  ADD COLUMN IF NOT EXISTS gross_yield NUMERIC,
  ADD COLUMN IF NOT EXISTS per_years NUMERIC,
  ADD COLUMN IF NOT EXISTS coefficients JSONB,
  ADD COLUMN IF NOT EXISTS comparable_properties JSONB;
