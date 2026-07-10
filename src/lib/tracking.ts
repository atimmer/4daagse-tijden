import type {
  Feature,
  FeatureCollection,
  LineString,
  Position,
} from "geojson";
import {
  getCumulativeDistances,
  lngLatToLeafletLatLng,
  type LeafletLatLngTuple,
  type LngLat,
} from "./utils";

// ---------------------------------------------------------------------------
// Time helpers (minutes since midnight, local event time)
// ---------------------------------------------------------------------------

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Tracked people
// ---------------------------------------------------------------------------

export interface Sighting {
  id: string;
  /** Minutes since midnight when the person passed the point. */
  timeMinutes: number;
  /** Route distance of the point where they were seen. */
  distanceKm: number;
}

export interface TrackedPerson {
  id: string;
  name: string;
  color: string;
  day: string;
  /** Existing route variant id, e.g. 'Dinsdag-40km'. */
  routeVariantId: string;
  /**
   * 'HH:mm'. Starts are released in a window; this defaults to the start of
   * that window and can be corrected per person. It is only used as a
   * position anchor (km 0), never for speed inference.
   */
  startTime: string;
  /** Confirmed sightings, kept sorted by time. */
  sightings: Sighting[];
}

export type PersonPosition =
  | { kind: "not-started" }
  | { kind: "finished" }
  /** Exact estimate: speed inferred from the two most recent sightings. */
  | { kind: "point"; km: number; speedKmh: number }
  /** Uncertain estimate: projected with the global speed range. */
  | { kind: "range"; minKm: number; maxKm: number };

export interface EstimateOptions {
  minSpeedKmh: number;
  maxSpeedKmh: number;
  routeLengthKm: number;
}

/** Speed between two sightings; null when the pair is unusable. */
export function inferSpeedKmh(earlier: Sighting, later: Sighting): number | null {
  const minutes = later.timeMinutes - earlier.timeMinutes;
  const km = later.distanceKm - earlier.distanceKm;
  if (minutes <= 0 || km <= 0) return null;
  return (km / minutes) * 60;
}

/**
 * Where is this person at `atMinutes`?
 *
 * - Two or more confirmed sightings: project from the latest sighting with the
 *   speed inferred from the two most recent ones → a point.
 * - Otherwise: project from the latest sighting, or from the start time at
 *   km 0, using the global speed range → a range. Start times are not precise
 *   enough for speed inference, so a single sighting never yields a point.
 */
export function estimatePersonPosition(
  person: TrackedPerson,
  atMinutes: number,
  options: EstimateOptions
): PersonPosition {
  const past = person.sightings
    .filter((s) => s.timeMinutes <= atMinutes)
    .sort((a, b) => a.timeMinutes - b.timeMinutes);
  const latest = past[past.length - 1];
  const anchor = latest
    ? { km: latest.distanceKm, timeMinutes: latest.timeMinutes }
    : { km: 0, timeMinutes: timeToMinutes(person.startTime) };

  if (!latest && atMinutes < anchor.timeMinutes) return { kind: "not-started" };
  if (anchor.km >= options.routeLengthKm) return { kind: "finished" };

  const hours = (atMinutes - anchor.timeMinutes) / 60;

  if (past.length >= 2) {
    const speedKmh = inferSpeedKmh(past[past.length - 2], latest);
    if (speedKmh !== null) {
      const km = anchor.km + speedKmh * hours;
      if (km >= options.routeLengthKm) return { kind: "finished" };
      return { kind: "point", km, speedKmh };
    }
  }

  const minKm = anchor.km + options.minSpeedKmh * hours;
  const maxKm = anchor.km + options.maxSpeedKmh * hours;
  if (minKm >= options.routeLengthKm) return { kind: "finished" };
  return { kind: "range", minKm, maxKm: Math.min(maxKm, options.routeLengthKm) };
}

// ---------------------------------------------------------------------------
// Route geometry: distance → position (inverse of the existing point search)
// ---------------------------------------------------------------------------

export interface RouteGeometry {
  coordinates: readonly LngLat[];
  cumulativeKm: readonly number[];
  lengthKm: number;
}

function isLngLat(position: Position): position is LngLat {
  return (
    position.length >= 2 &&
    typeof position[0] === "number" &&
    typeof position[1] === "number"
  );
}

/** Each route variant is a single LineString; returns null otherwise. */
export function buildRouteGeometry(
  geojson: FeatureCollection
): RouteGeometry | null {
  const feature = geojson.features.find(
    (f): f is Feature<LineString> => f.geometry.type === "LineString"
  );
  if (!feature) return null;
  const coordinates = feature.geometry.coordinates.filter(isLngLat);
  if (coordinates.length < 2) return null;
  const cumulativeKm = getCumulativeDistances(coordinates);
  return {
    coordinates,
    cumulativeKm,
    lengthKm: cumulativeKm[cumulativeKm.length - 1],
  };
}

/** Interpolated position at a route distance, clamped to the route. */
export function pointAtKm(
  geometry: RouteGeometry,
  km: number
): LeafletLatLngTuple {
  const { coordinates, cumulativeKm, lengthKm } = geometry;
  const target = Math.min(Math.max(km, 0), lengthKm);

  // First index whose cumulative distance reaches the target.
  let low = 0;
  let high = cumulativeKm.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (cumulativeKm[mid] < target) low = mid + 1;
    else high = mid;
  }
  if (low === 0) return lngLatToLeafletLatLng(coordinates[0]);

  const previousKm = cumulativeKm[low - 1];
  const segmentKm = cumulativeKm[low] - previousKm;
  const t = segmentKm > 0 ? (target - previousKm) / segmentKm : 0;
  const [lng1, lat1] = coordinates[low - 1];
  const [lng2, lat2] = coordinates[low];
  return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
}

/** Route polyline between two distances, for drawing an uncertainty range. */
export function routeSliceBetweenKm(
  geometry: RouteGeometry,
  fromKm: number,
  toKm: number
): LeafletLatLngTuple[] {
  const start = Math.max(Math.min(fromKm, toKm), 0);
  const end = Math.min(Math.max(fromKm, toKm), geometry.lengthKm);
  const points: LeafletLatLngTuple[] = [pointAtKm(geometry, start)];
  for (let i = 0; i < geometry.coordinates.length; i++) {
    const km = geometry.cumulativeKm[i];
    if (km > start && km < end) {
      points.push(lngLatToLeafletLatLng(geometry.coordinates[i]));
    }
  }
  points.push(pointAtKm(geometry, end));
  return points;
}

/** Dutch-style km label: 23,4 */
export function formatKm(km: number): string {
  return km.toFixed(1).replace(".", ",");
}
