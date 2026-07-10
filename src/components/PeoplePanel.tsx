import React, { useState } from "react";
import {
  ChevronDownIcon,
  CrosshairIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  formatKm,
  minutesToTime,
  type PersonPosition,
  type TrackedPerson,
} from "../lib/tracking";
import type { NewPerson } from "../lib/use-tracked-people";

export interface VariantOption {
  id: string;
  label: string;
  color: string;
  /** Start of the official start-time window. */
  defaultStartTime: string;
}

interface PeoplePanelProps {
  people: TrackedPerson[];
  positions: ReadonlyMap<string, PersonPosition>;
  selectedDay: string;
  variantOptions: VariantOption[];
  /** null = live "nu" */
  viewTime: string | null;
  currentTime: string;
  sightingPersonId: string | null;
  onViewTimeChange: (time: string | null) => void;
  onAddPerson: (input: NewPerson) => void;
  onRemovePerson: (personId: string) => void;
  onPersonStartTimeChange: (personId: string, time: string) => void;
  onStartSighting: (personId: string) => void;
  onCancelSighting: () => void;
  onRemoveSighting: (personId: string, sightingId: string) => void;
}

function positionLabel(position: PersonPosition | undefined): string {
  if (!position) return "";
  switch (position.kind) {
    case "not-started":
      return "Nog niet gestart";
    case "finished":
      return "Waarschijnlijk binnen";
    case "point":
      return `Rond km ${formatKm(position.km)} · ${position.speedKmh
        .toFixed(1)
        .replace(".", ",")} km/u`;
    case "range":
      return `Tussen km ${formatKm(position.minKm)} en ${formatKm(
        position.maxKm
      )}`;
  }
}

const PersonCard: React.FC<{
  person: TrackedPerson;
  variant: VariantOption | undefined;
  position: PersonPosition | undefined;
  isSighting: boolean;
  onRemove: () => void;
  onStartTimeChange: (time: string) => void;
  onStartSighting: () => void;
  onCancelSighting: () => void;
  onRemoveSighting: (sightingId: string) => void;
}> = ({
  person,
  variant,
  position,
  isSighting,
  onRemove,
  onStartTimeChange,
  onStartSighting,
  onCancelSighting,
  onRemoveSighting,
}) => {
  const [sightingsExpanded, setSightingsExpanded] = useState(false);
  const needsMoreSightings = person.sightings.length < 2;
  const lastSighting = person.sightings[person.sightings.length - 1];
  const sightingCountLabel = `${person.sightings.length} ${
    person.sightings.length === 1 ? "doorkomst" : "doorkomsten"
  }`;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: person.color }}
          aria-hidden
        />
        <span className="min-w-0 truncate font-medium">{person.name}</span>
        <span className="shrink-0 text-xs text-gray-500">
          {variant?.label ?? person.routeVariantId}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Verwijder ${person.name}`}
          className="shrink-0 rounded-sm p-1 text-gray-400 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      <div className="text-sm text-gray-900">{positionLabel(position)}</div>

      <div className="space-y-1.5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Label
            htmlFor={`start-${person.id}`}
            className="font-normal text-gray-600"
          >
            Start
          </Label>
          <Input
            id={`start-${person.id}`}
            type="time"
            value={person.startTime}
            onChange={(event) => {
              if (event.target.value) onStartTimeChange(event.target.value);
            }}
            className="h-7 w-fit"
          />
          {lastSighting ? (
            <button
              type="button"
              aria-expanded={sightingsExpanded}
              onClick={() => setSightingsExpanded((expanded) => !expanded)}
              className="flex min-w-0 items-center gap-1 text-left text-gray-600 hover:text-gray-900"
            >
              <span>
                {sightingCountLabel} · laatste {minutesToTime(lastSighting.timeMinutes)} · km{" "}
                {formatKm(lastSighting.distanceKm)}
              </span>
              <ChevronDownIcon
                className={`size-3.5 shrink-0 transition-transform ${
                  sightingsExpanded ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
          ) : null}
        </div>

        {lastSighting && sightingsExpanded ? (
          <ul className="space-y-1 border-l pl-2 text-xs text-gray-600">
            {person.sightings.map((sighting) => (
              <li key={sighting.id} className="flex min-h-8 items-center gap-1">
                <span>
                  {minutesToTime(sighting.timeMinutes)} · km {formatKm(sighting.distanceKm)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSighting(sighting.id)}
                  aria-label={`Verwijder doorkomst van ${minutesToTime(
                    sighting.timeMinutes
                  )}`}
                  className="flex size-7 shrink-0 items-center justify-center rounded-sm p-1.5 text-gray-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Button
        size="sm"
        variant={isSighting ? "secondary" : "outline"}
        className="h-8 w-full"
        onClick={isSighting ? onCancelSighting : onStartSighting}
      >
        <CrosshairIcon className="size-4" />
        {isSighting ? "Melden annuleren" : "Doorkomst melden"}
      </Button>

      {needsMoreSightings && !isSighting ? (
        <p className="text-xs text-gray-500">
          Na twee doorkomsten rekent de app het gemeten tempo.
        </p>
      ) : null}
    </div>
  );
};

const PeoplePanel: React.FC<PeoplePanelProps> = ({
  people,
  positions,
  selectedDay,
  variantOptions,
  viewTime,
  currentTime,
  sightingPersonId,
  onViewTimeChange,
  onAddPerson,
  onRemovePerson,
  onPersonStartTimeChange,
  onStartSighting,
  onCancelSighting,
  onRemoveSighting,
}) => {
  const [formExpanded, setFormExpanded] = useState(false);
  const [name, setName] = useState("");
  const [variantId, setVariantId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);

  const selectedVariant =
    variantOptions.find((variant) => variant.id === variantId) ??
    variantOptions[0];
  const effectiveStartTime =
    startTime ?? selectedVariant?.defaultStartTime ?? "07:00";

  const dayPeople = people.filter((person) => person.day === selectedDay);
  const otherDayCount = people.length - dayPeople.length;

  const resetForm = () => {
    setFormExpanded(false);
    setName("");
    setVariantId(null);
    setStartTime(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !selectedVariant) return;
    onAddPerson({
      name: name.trim(),
      day: selectedDay,
      routeVariantId: selectedVariant.id,
      startTime: effectiveStartTime,
    });
    resetForm();
  };

  return (
    <section className="space-y-3 xl:mt-6 xl:border-t xl:pt-4">
      <h2 className="hidden font-semibold xl:block">Lopers volgen</h2>

      <div className="flex items-center gap-2 text-sm">
        <Label htmlFor="peilmoment" className="font-normal text-gray-600">
          Positie
        </Label>
        <div className="flex h-8 overflow-hidden rounded-md border">
          <Button
            size="sm"
            variant={viewTime === null ? "default" : "ghost"}
            className="h-8 rounded-none border-0 px-3 shadow-none"
            onClick={() => onViewTimeChange(null)}
          >
            Nu
          </Button>
          <Input
            id="peilmoment"
            type="time"
            value={viewTime ?? currentTime}
            onChange={(event) => {
              if (event.target.value) onViewTimeChange(event.target.value);
            }}
            className={`h-8 w-fit rounded-none border-0 border-l shadow-none focus-visible:ring-inset ${
              viewTime === null ? "" : "bg-secondary"
            }`}
          />
        </div>
      </div>

      {dayPeople.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nog geen lopers voor {selectedDay}. Voeg een loper toe en meld
          doorkomsten zodra je ze ziet.
        </p>
      ) : (
        <div className="space-y-3">
          {dayPeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              variant={variantOptions.find(
                (variant) => variant.id === person.routeVariantId
              )}
              position={positions.get(person.id)}
              isSighting={sightingPersonId === person.id}
              onRemove={() => onRemovePerson(person.id)}
              onStartTimeChange={(time) =>
                onPersonStartTimeChange(person.id, time)
              }
              onStartSighting={() => onStartSighting(person.id)}
              onCancelSighting={onCancelSighting}
              onRemoveSighting={(sightingId) =>
                onRemoveSighting(person.id, sightingId)
              }
            />
          ))}
        </div>
      )}

      {otherDayCount > 0 ? (
        <p className="text-xs text-gray-500">
          {otherDayCount} {otherDayCount === 1 ? "loper" : "lopers"} op andere
          dagen.
        </p>
      ) : null}

      {formExpanded ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-person-name">Naam</Label>
            <Input
              id="new-person-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-person-distance">Afstand</Label>
            <Select
              value={selectedVariant?.id ?? ""}
              onValueChange={setVariantId}
            >
              <SelectTrigger id="new-person-distance" className="w-full">
                <SelectValue placeholder="Afstand" />
              </SelectTrigger>
              <SelectContent>
                {variantOptions.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: variant.color }}
                      aria-hidden
                    />
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-person-start">Starttijd</Label>
            <Input
              id="new-person-start"
              type="time"
              value={effectiveStartTime}
              onChange={(event) => {
                if (event.target.value) setStartTime(event.target.value);
              }}
              className="w-fit"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Annuleren
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || !selectedVariant}
            >
              Toevoegen
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setFormExpanded(true)}
        >
          + Loper toevoegen
        </Button>
      )}
    </section>
  );
};

export default PeoplePanel;
