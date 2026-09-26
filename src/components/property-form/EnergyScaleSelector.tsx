import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { energyOptions } from './types';

interface EnergyScaleSelectorProps {
  label: string;
  fieldName: 'energy_certificate' | 'emissions_certificate';
}

const getEnergyButtonStyle = (opt: string, isSelected: boolean): string => {
  if (!isSelected) {
    return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350';
  }
  switch (opt) {
    case 'A': return 'bg-[#00a651] text-white border-[#00a651] font-bold shadow-xs';
    case 'B': return 'bg-[#5cb85c] text-white border-[#5cb85c] font-bold shadow-xs';
    case 'C': return 'bg-[#bfd730] text-black border-[#bfd730] font-bold shadow-xs';
    case 'D': return 'bg-[#fff200] text-black border-[#fff200] font-bold shadow-xs';
    case 'E': return 'bg-[#ffc20e] text-black border-[#ffc20e] font-bold shadow-xs';
    case 'F': return 'bg-[#f58220] text-white border-[#f58220] font-bold shadow-xs';
    case 'G': return 'bg-[#ed1c24] text-white border-[#ed1c24] font-bold shadow-xs';
    default:  return 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs';
  }
};

export const EnergyScaleSelector: React.FC<EnergyScaleSelectorProps> = ({ label, fieldName }) => {
  const form = useFormContext<any>();
  const currentVal = form.watch(fieldName);

  return (
    <div className="space-y-3">
      <Label className="font-semibold text-slate-700 whitespace-nowrap">{label}</Label>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {energyOptions.map((opt) => {
          const isSelected = currentVal === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => form.setValue(fieldName, opt as any, { shouldValidate: true })}
              className={`h-10 rounded-lg border text-[11px] flex items-center justify-center transition-colors cursor-pointer ${getEnergyButtonStyle(opt, isSelected)}`}
            >
              <span className="notranslate" translate="no">
                {opt === 'en_tramite' ? 'En trámite' : opt.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
