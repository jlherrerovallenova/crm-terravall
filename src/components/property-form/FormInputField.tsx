import React from 'react';
import { Label } from '../ui/label';
import { Input, type InputProps } from '../ui/input';
import { cleanErrorMessage } from './types';

export interface FormInputFieldProps extends Omit<InputProps, 'error'> {
  id: string;
  label: string;
  error?: unknown;
  hint?: string;
  labelExtra?: React.ReactNode;
}

export const FormInputField: React.FC<FormInputFieldProps> = ({
  id,
  label,
  error,
  hint,
  labelExtra,
  className = "h-11 rounded-xl",
  ...props
}) => {
  const hasError = !!error;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label
          htmlFor={id}
          className={`whitespace-nowrap ${hasError ? "text-red-500" : "font-semibold text-slate-800"}`}
        >
          {label}
        </Label>
        {labelExtra}
      </div>
      <Input
        id={id}
        error={hasError}
        className={className}
        {...props}
      />
      {hasError && (
        <p className="text-xs text-red-500">{cleanErrorMessage(error)}</p>
      )}
      {hint && (
        <span className="text-[10px] text-slate-400 block">{hint}</span>
      )}
    </div>
  );
};
