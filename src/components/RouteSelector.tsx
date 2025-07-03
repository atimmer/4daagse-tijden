import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";

export interface RouteSelectorProps {
  days: string[];
  distancesByDay: Record<
    string,
    { key: string; label: string; color: string }[]
  >;
  selectedDay: string;
  onDayChange: (day: string) => void;
  selectedDistances: string[]; // keys of selected distances for the selected day
  onDistanceToggle: (distanceKey: string) => void;
  startTimes: Record<string, string>; // distanceKey -> time
  onStartTimeChange: (distanceKey: string, newTime: string) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  days,
  distancesByDay,
  selectedDay,
  onDayChange,
  selectedDistances,
  onDistanceToggle,
  startTimes,
  onStartTimeChange,
}) => {
  return (
    <Tabs value={selectedDay} onValueChange={onDayChange} className="mb-4">
      <TabsList className="mb-2">
        {days.map((day) => (
          <TabsTrigger key={day} value={day} className="capitalize">
            {day}
          </TabsTrigger>
        ))}
      </TabsList>
      {days.map((day) => (
        <TabsContent key={day} value={day}>
          <div className="flex flex-col gap-2">
            {distancesByDay[day]?.map((dist) => (
              <Label key={dist.key} className="flex items-center gap-3">
                <Checkbox
                  checked={selectedDistances.includes(dist.key)}
                  onCheckedChange={() => onDistanceToggle(dist.key)}
                  id={dist.key}
                />
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: dist.color }}
                ></span>
                <span className="select-none">{dist.label}</span>
                {selectedDistances.includes(dist.key) && (
                  <Input
                    type="time"
                    value={startTimes[dist.key] || "07:00"}
                    onChange={(e) =>
                      onStartTimeChange(dist.key, e.target.value)
                    }
                    className="w-24 ml-2"
                  />
                )}
              </Label>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default RouteSelector;
