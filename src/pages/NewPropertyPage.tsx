import React from 'react';
import { useLocation } from 'react-router-dom';
import { PropertyForm } from '@/components/PropertyForm';

export const NewPropertyPage: React.FC = () => {
  const location = useLocation();
  const prefilledData = location.state?.prefillValuation;

  return (
    <div className="transition-opacity duration-500">
      <PropertyForm initialData={prefilledData} />
    </div>
  );
};
