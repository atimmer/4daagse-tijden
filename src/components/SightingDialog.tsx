import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { formatKm } from "../lib/tracking";

export interface SightingOption {
  distanceKm: number;
  /** Set when the tapped point is passed twice (out and back). */
  direction?: string;
}

export interface PendingSighting {
  personId: string;
  personName: string;
  options: SightingOption[];
}

interface SightingDialogProps {
  pending: PendingSighting;
  /** Prefilled time, normally "now". */
  defaultTime: string;
  onConfirm: (option: SightingOption, time: string) => void;
  onCancel: () => void;
}

const SightingDialog: React.FC<SightingDialogProps> = ({
  pending,
  defaultTime,
  onConfirm,
  onCancel,
}) => {
  const [time, setTime] = useState(defaultTime);
  const [optionIndex, setOptionIndex] = useState(0);

  const { personName, options } = pending;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Doorkomst van {personName}</DialogTitle>
          <DialogDescription>
            {options.length > 1
              ? "Dit punt wordt twee keer gepasseerd. Welke richting was het, en hoe laat?"
              : `Gezien bij km ${formatKm(options[0].distanceKm)}. Hoe laat was dat?`}
          </DialogDescription>
        </DialogHeader>

        {options.length > 1 && (
          <RadioGroup
            value={String(optionIndex)}
            onValueChange={(value) => setOptionIndex(Number(value))}
          >
            {options.map((option, index) => (
              <Label
                key={index}
                className="flex items-center gap-2 font-normal"
              >
                <RadioGroupItem value={String(index)} />
                {option.direction} · km {formatKm(option.distanceKm)}
              </Label>
            ))}
          </RadioGroup>
        )}

        <div className="flex items-center gap-2">
          <Label htmlFor="sighting-time" className="font-normal">
            Tijdstip
          </Label>
          <Input
            id="sighting-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-fit"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
          <Button
            onClick={() => time && onConfirm(options[optionIndex], time)}
            disabled={!time}
          >
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SightingDialog;
