import React from 'react';
import { Check } from 'lucide-react';
import type { StepItem } from './types';

interface PropertyStepperProps {
  currentStep: number;
  steps: StepItem[];
  onStepClick: (stepId: number) => Promise<void> | void;
}

export const PropertyStepper: React.FC<PropertyStepperProps> = ({
  currentStep,
  steps,
  onStepClick
}) => {
  return (
    <div className="w-full mb-10 bg-white rounded-2xl border border-slate-150 p-6 shadow-xs">
      <div className="flex justify-between items-center relative max-w-4xl mx-auto">
        {/* Connecting Line Background */}
        <div className="absolute left-0 right-0 top-[20px] -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
        {/* Active Line Fill */}
        <div 
          className="absolute left-0 top-[20px] -translate-y-1/2 h-0.5 bg-primary transition-colors duration-500 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((s) => {
          const StepIcon = s.icon;
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onStepClick(s.id)}
              className="flex flex-col items-center relative z-10 group cursor-pointer focus:outline-none"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                isActive 
                  ? 'border-primary bg-primary text-white scale-110 shadow-md shadow-primary/20' 
                  : isCompleted 
                    ? 'border-primary bg-white text-primary' 
                    : 'border-slate-200 bg-white text-slate-400 group-hover:border-slate-350'
              }`}>
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : <StepIcon size={16} />}
              </div>
              <div className="mt-2.5 text-center">
                <span className={`text-xs font-bold block transition-colors ${
                  isActive ? 'text-primary' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {s.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden md:block mt-0.5">
                  {s.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
