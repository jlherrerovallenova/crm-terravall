-- ==============================================================================
-- Migración: Añadir columna notary_summary_data a la tabla properties
-- Propósito: Almacenar los datos de la ficha / guía resumen de la operación para Notaría
-- ==============================================================================

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS notary_summary_data JSONB DEFAULT NULL;

COMMENT ON COLUMN properties.notary_summary_data IS 'Datos estructurados de la ficha resumen de la operación y guía de firma para la Notaría (datos de firma, notaría, oficial, fincas registrales desglosadas y medios de pago)';
