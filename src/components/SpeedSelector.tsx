import React, { useState } from "react";
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
  const [minSpeedValue, setMinSpeedValue] = useState(String(minSpeed));
  const [maxSpeedValue, setMaxSpeedValue] = useState(String(maxSpeed));

  return (
    <>
      <div className="grid grid-flow-col grid-cols-[auto_1fr_auto] items-start sm:items-center gap-2 justify-center">
        <Label htmlFor="min-speed">Minimum snelheid</Label>
        <div className="flex justify-center">
          <Input
            id="min-speed"
            type="text"
            min={0}
            max={11}
            step={0.1}
            value={minSpeedValue}
            inputMode="decimal"
            onChange={(e) => {
              setMinSpeedValue(e.target.value);

              let numberValue = parseFloat(e.target.value.replace(",", "."));
              if (Number.isNaN(numberValue)) {
                numberValue = 0;
              }

              const min = Math.max(0, Math.min(11, numberValue));
              if (min > maxSpeed) {
                onChange(min, min);
              } else {
                onChange(min, maxSpeed);
              }
            }}
            className="w-28"
          />
        </div>
        <span className="text-xs text-muted-foreground text-right mr-4">
          km/u
        </span>
        <div className="mx-auto row-span-3">-</div>
        <Label htmlFor="max-speed">Maximum snelheid</Label>
        <Input
          id="max-speed"
          type="text"
          min={0}
          max={11}
          step={0.1}
          value={maxSpeedValue}
          inputMode="decimal"
          onChange={(e) => {
            setMaxSpeedValue(e.target.value);

            let numberValue = parseFloat(e.target.value.replace(",", "."));
            if (Number.isNaN(numberValue)) {
              numberValue = 0;
            }

            const max = Math.max(0, Math.min(11, numberValue));
            if (minSpeed > max) {
              onChange(max, max);
            } else {
              onChange(minSpeed, max);
            }
          }}
          className="w-28"
        />
        <span className="text-xs text-muted-foreground text-right mr-4">
          km/u
        </span>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Doorkomst tijden worden berekend met een gemiddelde snelheid tussen de{" "}
        {String(minSpeed).replace(".", ",")} km/h en{" "}
        {String(maxSpeed).replace(".", ",")} km/h.
      </p>
    </>
  );
};

export default SpeedRangeSelector;
