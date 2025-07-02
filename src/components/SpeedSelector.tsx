import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface SpeedSelectorProps {
  speed: number;
  options: number[];
  onChange: (speed: number) => void;
}

const SpeedSelector: React.FC<SpeedSelectorProps> = ({
  speed,
  options,
  onChange,
}) => {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="font-medium">Snelheid:</span>
      <RadioGroup
        value={speed.toString()}
        onValueChange={(v) => onChange(Number(v))}
        className="flex flex-row gap-4"
      >
        {options.map((option) => (
          <div key={option} className="flex items-center gap-1">
            <RadioGroupItem value={option.toString()} id={`speed-${option}`} />
            <label htmlFor={`speed-${option}`}>{option} km/u</label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default SpeedSelector;
