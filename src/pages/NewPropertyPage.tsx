import React from 'react';
import { useLocation } from 'react-router-dom';
import { PropertyForm } from '@/components/PropertyForm';

export const NewPropertyPage: React.FC = () => {
  const location = useLocation();
  const prefilledData = location.state?.prefillValuation;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PropertyForm initialData={prefilledData} />
    </div>
  );
};
