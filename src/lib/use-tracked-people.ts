import { useCallback, useEffect, useState } from "react";
import { EDITION } from "../config/edition";
import type { Sighting, TrackedPerson } from "./tracking";

const STORAGE_KEY = `doorkomst-lopers-v1:${EDITION.year}`;

/** Distinct from the route colors (red/green/yellow/blue). */
const PERSON_COLORS = [
  "#7c3aed", // violet
  "#db2777", // pink
  "#ea580c", // orange
  "#0d9488", // teal
  "#4f46e5", // indigo
  "#b45309", // amber-brown
];

function loadPeople(): TrackedPerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedPerson[]) : [];
  } catch {
    return [];
  }
}

export interface NewPerson {
  name: string;
  day: string;
  routeVariantId: string;
  startTime: string;
}

export function useTrackedPeople() {
  const [people, setPeople] = useState<TrackedPerson[]>(loadPeople);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    } catch {
      // Storage may be unavailable (private mode); tracking is then session-only.
    }
  }, [people]);

  const addPerson = useCallback((input: NewPerson) => {
    setPeople((prev) => [
      ...prev,
      {
        ...input,
        id: crypto.randomUUID(),
        color: PERSON_COLORS[prev.length % PERSON_COLORS.length],
        sightings: [],
      },
    ]);
  }, []);

  const removePerson = useCallback((personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
  }, []);

  const setPersonStartTime = useCallback(
    (personId: string, startTime: string) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === personId ? { ...p, startTime } : p))
      );
    },
    []
  );

  const addSighting = useCallback(
    (personId: string, sighting: Omit<Sighting, "id">) => {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === personId
            ? {
                ...p,
                sightings: [
                  ...p.sightings,
                  { ...sighting, id: crypto.randomUUID() },
                ].sort((a, b) => a.timeMinutes - b.timeMinutes),
              }
            : p
        )
      );
    },
    []
  );

  const removeSighting = useCallback(
    (personId: string, sightingId: string) => {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === personId
            ? { ...p, sightings: p.sightings.filter((s) => s.id !== sightingId) }
            : p
        )
      );
    },
    []
  );

  return {
    people,
    addPerson,
    removePerson,
    setPersonStartTime,
    addSighting,
    removeSighting,
  };
}
