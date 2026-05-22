import React from 'react';
import { PropertyForm } from '@/components/PropertyForm';

export const NewPropertyPage: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PropertyForm />
    </div>
  );
};
