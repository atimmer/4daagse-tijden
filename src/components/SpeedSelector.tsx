import React, { useState } from "react";
import KmPerHourInput from "./KmPerHourInput";

export interface SpeedRangeSelectorProps {
  minSpeed: number;
  maxSpeed: number;
  onChange: (min: number, max: number) => void;
}

/*

  <div>
    <label
      htmlFor="price"
      className="block text-sm/6 font-medium text-gray-900"
    >
      Price
    </label>
    <div className="mt-2">
      <div className="flex items-center rounded-md bg-white px-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
          $
        </div>
        <input
          id="price"
          name="price"
          type="text"
          placeholder="0.00"
          aria-describedby="price-currency"
          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
        />
        <div
          id="price-currency"
          className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6"
        >
          USD
        </div>
      </div>
    </div>
  </div>;
  */

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
        <KmPerHourInput
          id="min-speed"
          label="Minimum snelheid"
          value={minSpeedValue}
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
          min={0}
          max={11}
          step={0.1}
          placeholder="0,0"
          className="w-16"
        />
        <div className="mx-auto row-span-2"></div>
        <KmPerHourInput
          id="max-speed"
          label="Maximum snelheid"
          value={maxSpeedValue}
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
          min={0}
          max={11}
          step={0.1}
          placeholder="0,0"
          className="w-16"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Doorkomst tijden worden berekend met een gemiddelde snelheid tussen de{" "}
        {String(minSpeed).replace(".", ",")} km/h en{" "}
        {String(maxSpeed).replace(".", ",")} km/h.
      </p>
    </>
  );
};

export default SpeedRangeSelector;
