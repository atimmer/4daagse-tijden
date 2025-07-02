import React from "react";

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
    <div className="flex gap-4 mb-4 items-center">
      <span className="font-medium">Snelheid:</span>
      {options.map((option) => (
        <label key={option} className="flex items-center gap-1 cursor-pointer">
          <input
            type="radio"
            name="speed"
            value={option}
            checked={speed === option}
            onChange={() => onChange(option)}
            className="accent-green-600"
          />
          <span>{option} km/u</span>
        </label>
      ))}
    </div>
  );
};

export default SpeedSelector;
