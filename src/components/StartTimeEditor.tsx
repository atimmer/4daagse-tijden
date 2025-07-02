import React from "react";

export interface StartTimeEditorProps {
  startTimes: { name: string; time: string }[];
  onChange: (routeName: string, newTime: string) => void;
}

const StartTimeEditor: React.FC<StartTimeEditorProps> = ({
  startTimes,
  onChange,
}) => {
  return (
    <div className="flex gap-4 mb-4 items-center">
      <span className="font-medium">Starttijden:</span>
      {startTimes.map((route) => (
        <label
          key={route.name}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span>{route.name}:</span>
          <input
            type="time"
            value={route.time}
            onChange={(e) => onChange(route.name, e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </label>
      ))}
    </div>
  );
};

export default StartTimeEditor;
