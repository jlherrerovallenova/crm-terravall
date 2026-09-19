import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8 text-center space-y-3">
      <div className="p-3 bg-primary/10 rounded-2xl">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
      <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Cargando...</p>
    </div>
  );
};
