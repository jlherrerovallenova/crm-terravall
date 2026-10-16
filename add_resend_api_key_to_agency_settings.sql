-- =========================================================================================
-- MIGRACIÓN: Soporte de Resend API Key en la tabla agency_settings de Supabase
-- =========================================================================================

ALTER TABLE IF EXISTS public.agency_settings 
ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
