import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FeatureSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  options: SelectOption[];
}

export const FeatureSelect: React.FC<FeatureSelectProps> = ({ id, label, options, className, ...props }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="whitespace-nowrap">{label}</Label>
    <select
      id={id}
      className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm", className)}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export interface NumericFeatureInputProps {
  id: string;
  label: string;
  error?: string;
  registerProps: any;
}

export const NumericFeatureInput: React.FC<NumericFeatureInputProps> = ({ id, label, error, registerProps }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className={error ? "text-red-500 whitespace-nowrap" : "whitespace-nowrap"}>
      {label}
    </Label>
    <Input id={id} type="number" error={!!error} {...registerProps} />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);
