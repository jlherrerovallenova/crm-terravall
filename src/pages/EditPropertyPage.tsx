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
    if (id) fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Combinamos las características específicas para que el formulario las reconozca correctamente
      const initialData = {
        id: data.id,
        type: data.type,
        operation: data.operation,
        price: data.price,
        address_hidden: data.address_hidden,
        address_public: data.address_public,
        area_useful: data.area_useful,
        area_built: data.area_built,
        title: data.title,
        description: data.description,
        condition: data.condition,
        subtype: data.subtype || undefined,
        city: data.city,
        province: data.province,
        zipcode: data.zipcode,
        hide_exact_address: data.hide_exact_address,
        energy_certificate: data.energy_certificate,
        publish_web: data.publish_web,
        publish_idealista: data.publish_idealista,
        publish_fotocasa: data.publish_fotocasa,
        specific_features: data.specific_features || {}
      };

      setProperty(initialData);
    } catch (error) {
      console.error('Error al cargar inmueble:', error);
      alert('Error al cargar el inmueble para edición');
      navigate('/inmuebles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Cargando datos del inmueble...</div>;
  }

  if (!property) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-5xl mx-auto mb-6">
        <button onClick={() => navigate(`/inmuebles/${id}`)} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} />
          Volver a Detalles
        </button>
      </div>
      <PropertyForm initialData={property} />
    </div>
  );
};
