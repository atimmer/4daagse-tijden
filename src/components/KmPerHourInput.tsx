import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KmPerHourInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  id: string;
  placeholder?: string;
  className?: string;
}

const KmPerHourInput: React.FC<KmPerHourInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 11,
  step = 0.1,
  id,
  placeholder = "0,0",
  className = "",
}) => {
  return (
    <div className="w-full">
      <Label htmlFor={id} className="block mb-1 text-sm font-medium">
        {label}
      </Label>
      <div className="flex items-center rounded-md bg-white px-3 border border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
        <Input
          id={id}
          type="text"
          min={min}
          max={max}
          step={step}
          value={value}
          inputMode="decimal"
          onChange={onChange}
          placeholder={placeholder}
          className={`border-0 shadow-none px-0 py-1.5 text-base text-gray-900 placeholder:text-gray-400 flex-1 bg-transparent focus-visible:ring-0 focus-visible:border-transparent ${className}`}
          aria-describedby={`${id}-unit`}
        />
        <div
          id={`${id}-unit`}
          className="shrink-0 text-sm text-muted-foreground select-none ml-2"
        >
          km/h
        </div>
      </div>
    </div>
  );
};

export default KmPerHourInput;
