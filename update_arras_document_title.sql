-- =========================================================================================
-- MIGRACIÓN: Eliminar "(opcional pero muy recomendable)" del título del contrato de arras
-- =========================================================================================

UPDATE public.property_documents
SET title = 'Contrato de arras',
    updated_at = NOW()
WHERE document_type = 'proceso_contrato_arras'
   OR title ILIKE '%(opcional pero muy recomendable)%';
