import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SpeedRangeSelectorProps {
  minSpeed: number;
  maxSpeed: number;
  onChange: (min: number, max: number) => void;
}

const SpeedRangeSelector: React.FC<SpeedRangeSelectorProps> = ({
  minSpeed,
  maxSpeed,
  onChange,
}) => {
  return (
    <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="min-speed">Langzaamste snelheid</Label>
        <Input
          id="min-speed"
          type="number"
          min={0}
          max={11}
          step={0.1}
          value={minSpeed}
          onChange={(e) => {
            const min = Math.max(0, Math.min(11, Number(e.target.value)));
            if (min > maxSpeed) {
              onChange(min, min);
            } else {
              onChange(min, maxSpeed);
            }
          }}
          className="w-28"
        />
        <span className="text-xs text-muted-foreground">km/u</span>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="max-speed">Snelste snelheid</Label>
        <Input
          id="max-speed"
          type="number"
          min={0}
          max={11}
          step={0.1}
          value={maxSpeed}
          onChange={(e) => {
            const max = Math.max(0, Math.min(11, Number(e.target.value)));
            if (minSpeed > max) {
              onChange(max, max);
            } else {
              onChange(minSpeed, max);
            }
          }}
          className="w-28"
        />
        <span className="text-xs text-muted-foreground">km/u</span>
      </div>
    </div>
  );
};

export default SpeedRangeSelector;
