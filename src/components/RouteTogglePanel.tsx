import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

export interface RouteTogglePanelProps {
  grouped: Record<
    string,
    { id: string; label: string; color: string; visible: boolean }[]
  >; // day -> variants
  onToggle: (id: string) => void;
}

const RouteTogglePanel: React.FC<RouteTogglePanelProps> = ({
  grouped,
  onToggle,
}) => {
  return (
    <Accordion type="multiple" className="mb-4">
      {Object.entries(grouped).map(([day, variants]) => (
        <AccordionItem value={day} key={day}>
          <AccordionTrigger>{day}</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2 pl-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={variant.visible}
                    onCheckedChange={() => onToggle(variant.id)}
                    id={`route-toggle-${encodeURIComponent(variant.id)}`}
                  />
                  <label
                    htmlFor={`route-toggle-${encodeURIComponent(variant.id)}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: variant.color }}
                      aria-hidden="true"
                    />
                    <span className="sr-only">Route tonen: </span>
                    <span>{variant.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default RouteTogglePanel;
