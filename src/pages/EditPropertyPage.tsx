import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { PropertyForm } from '@/components/PropertyForm';
import { ArrowLeft } from 'lucide-react';

export const EditPropertyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProperty = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!isMounted) return;
        
        // Combinamos todas las columnas y las características específicas para que el formulario las reconozca correctamente
        const initialData = {
          ...data,
          subtype: data.subtype || undefined,
          specific_features: data.specific_features || {}
        };

        setProperty(initialData);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error al cargar inmueble:', error);
        alert('Error al cargar el inmueble para edición');
        navigate('/crm/inmuebles');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) fetchProperty();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Cargando datos del inmueble...</div>;
  }

  if (!property) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto mb-6">
        <button onClick={() => navigate(`/crm/inmuebles/${id}`)} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} />
          Volver a Detalles
        </button>
      </div>
      <PropertyForm initialData={property} />
    </div>
  );
};
