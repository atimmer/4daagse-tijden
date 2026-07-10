import React, { useState } from "react";
import KmPerHourInput from "./KmPerHourInput";

const MIN_SPEED = 1;
const MAX_SPEED = 11;

function parseSpeed(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatSpeed(value: number) {
  return String(value).replace(".", ",");
}

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
  const [minSpeedDraft, setMinSpeedDraft] = useState<string | null>(null);
  const [maxSpeedDraft, setMaxSpeedDraft] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-flow-col grid-cols-[auto_1fr_auto] items-start sm:items-center gap-2 justify-center">
        <KmPerHourInput
          id="min-speed"
          label="Minimum snelheid"
          value={minSpeedDraft ?? formatSpeed(minSpeed)}
          onChange={(e) => {
            const value = e.target.value;
            setMinSpeedDraft(value);
            const parsed = parseSpeed(value);
            if (parsed === null || parsed < MIN_SPEED || parsed > MAX_SPEED) {
              return;
            }
            const min = parsed;
            if (min > maxSpeed) {
              onChange(min, min);
            } else {
              onChange(min, maxSpeed);
            }
          }}
          onFocus={() => setMinSpeedDraft(formatSpeed(minSpeed))}
          onBlur={() => setMinSpeedDraft(null)}
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={0.1}
          placeholder="0,0"
          className="w-16"
        />
        <div className="mx-auto row-span-2"></div>
        <KmPerHourInput
          id="max-speed"
          label="Maximum snelheid"
          value={maxSpeedDraft ?? formatSpeed(maxSpeed)}
          onChange={(e) => {
            const value = e.target.value;
            setMaxSpeedDraft(value);
            const parsed = parseSpeed(value);
            if (parsed === null || parsed < MIN_SPEED || parsed > MAX_SPEED) {
              return;
            }
            const max = parsed;
            if (minSpeed > max) {
              onChange(max, max);
            } else {
              onChange(minSpeed, max);
            }
          }}
          onFocus={() => setMaxSpeedDraft(formatSpeed(maxSpeed))}
          onBlur={() => setMaxSpeedDraft(null)}
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={0.1}
          placeholder="0,0"
          className="w-16"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Doorkomsttijden worden berekend met een gemiddelde snelheid tussen de{" "}
        {String(minSpeed).replace(".", ",")} km/h en{" "}
        {String(maxSpeed).replace(".", ",")} km/h.
      </p>
    </>
  );
};

export default SpeedRangeSelector;
