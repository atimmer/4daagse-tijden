import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useIsMobile } from "../lib/layout-hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DaySelectorProps {
  days: string[];
  selectedDay: string;
  onDayChange: (day: string) => void;
  className?: string;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  selectedDay,
  onDayChange,
  className,
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Select onValueChange={onDayChange} value={selectedDay}>
        <SelectTrigger className="bg-white w-[150px]">
          <SelectValue placeholder="Selecteer een dag" />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      {days.map((day) => (
        <Button
          key={day}
          variant={selectedDay === day ? "default" : "outline"}
          onClick={() => onDayChange(day)}
          className={selectedDay === day ? "font-bold" : ""}
          aria-pressed={selectedDay === day}
        >
          {day}
        </Button>
      ))}
    </div>
  );
};

export interface RouteSelectorProps {
  distancesByDay: Record<
    string,
    { key: string; label: string; color: string }[]
  >;
  selectedDay: string;
  selectedDistances: string[]; // keys of selected distances for the selected day
  onDistanceToggle: (distanceKey: string) => void;
  startTimes: Record<string, string>; // distanceKey -> time
  onStartTimeChange: (distanceKey: string, newTime: string) => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({
  distancesByDay,
  selectedDay,
  selectedDistances,
  onDistanceToggle,
  startTimes,
  onStartTimeChange,
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-2">
        <span className="font-semibold text-sm">Routes</span>
        <span className="font-semibold text-sm pr-2">Starttijd</span>
      </div>
      <div className="flex flex-col gap-2">
        {distancesByDay[selectedDay]?.map((dist) => (
          <Label
            key={dist.key}
            className="flex items-center gap-3 justify-between w-full min-h-[44px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Checkbox
                checked={selectedDistances.includes(dist.key)}
                onCheckedChange={() => onDistanceToggle(dist.key)}
                id={dist.key}
              />
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: dist.color }}
              ></span>
              <span className="select-none truncate">{dist.label}</span>
            </div>
            <div className="w-24 ml-2 flex justify-end">
              {selectedDistances.includes(dist.key) ? (
                <Input
                  type="time"
                  value={startTimes[dist.key] || "07:00"}
                  onChange={(e) => onStartTimeChange(dist.key, e.target.value)}
                  className="w-full text-right"
                />
              ) : null}
            </div>
          </Label>
        ))}
      </div>
    </div>
  );
};

export default RouteSelector;
