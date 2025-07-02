import React from "react";
import { Input } from "@/components/ui/input";

export interface StartTimeEditorProps {
  grouped: Record<string, { id: string; label: string; startTime: string }[]>; // day -> visible variants
  onChange: (id: string, newTime: string) => void;
}

const StartTimeEditor: React.FC<StartTimeEditorProps> = ({
  grouped,
  onChange,
}) => {
  return (
    <div className="mb-4">
      <span className="font-medium">Starttijden:</span>
      {Object.entries(grouped).map(([day, variants]) => (
        <div key={day} className="mt-2 pl-2">
          <div className="font-semibold mb-1">{day}</div>
          <div className="flex flex-wrap gap-4">
            {variants.map((variant) => (
              <label key={variant.id} className="flex items-center gap-2">
                <span>{variant.label}:</span>
                <Input
                  type="time"
                  value={variant.startTime}
                  onChange={(e) => onChange(variant.id, e.target.value)}
                  className="w-24"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StartTimeEditor;
