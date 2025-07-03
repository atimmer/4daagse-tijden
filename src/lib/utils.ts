import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RouteVariant } from "../components/MapView";
import type { Feature, LineString, Position } from "geojson";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haversine formula to calculate distance between two lat/lng points in km
export function haversineDistance(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate passage time (returns string in HH:mm)
export function estimatePassageTime(
  startTime: string,
  distanceKm: number,
  speedKmh: number
): string {
  // startTime: '07:00'
  const [h, m] = startTime.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const minutes = (distanceKm / speedKmh) * 60;
  const totalMinutes = Math.round(startMinutes + minutes);
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

// Given a GeoJSON LineString, return an array of cumulative distances (km) for each point
export function getCumulativeDistances(
  coordinates: [number, number][]
): number[] {
  let total = 0;
  const result = [0];
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistance(coordinates[i - 1], coordinates[i]);
    result.push(total);
  }
  return result;
}

// Returns an array of { routeId, pointIndices, latlng } for relevant points near hoveredLatLng
export function getRelevantRoutePoints(
  hoveredLatLng: [number, number],
  routeVariants: RouteVariant[]
): { routeId: string; pointIndices: number[]; latlng: [number, number] }[] {
  const results: {
    routeId: string;
    pointIndices: number[];
    latlng: [number, number];
  }[] = [];
  for (const r of routeVariants) {
    const features = r.geojson.features.filter(
      (f): f is Feature<LineString> => f.geometry.type === "LineString"
    );
    for (const feature of features) {
      const coords = (feature.geometry.coordinates as Position[]).filter(
        (c): c is [number, number] =>
          Array.isArray(c) &&
          c.length >= 2 &&
          typeof c[0] === "number" &&
          typeof c[1] === "number"
      );
      // 1. Find all indices within 100 meters
      const pointsWithDist = coords
        .map(([lng, lat], idx) => ({
          idx,
          dist: Math.sqrt(
            Math.pow(lat - hoveredLatLng[0], 2) +
              Math.pow(lng - hoveredLatLng[1], 2)
          ),
          coord: [lng, lat] as [number, number],
        }))
        .filter(({ dist }) => dist < 0.001); // ~100m
      // 2. Order by distance
      pointsWithDist.sort((a, b) => a.dist - b.dist);
      // 3. Deduplicate: only keep points whose cumulative distances from start differ by at least 1km
      const cumDists = getCumulativeDistances(coords);
      const deduped: typeof pointsWithDist = [];
      for (const pt of pointsWithDist) {
        if (
          deduped.every((d) => Math.abs(cumDists[pt.idx] - cumDists[d.idx]) > 1)
        ) {
          deduped.push(pt);
        }
        if (deduped.length === 2) break; // Only keep up to 2
      }
      // 4. Only show the 1 or 2 closest points per route
      if (deduped.length > 0) {
        results.push({
          routeId: r.id,
          pointIndices: deduped.map((d) => d.idx),
          latlng: hoveredLatLng,
        });
      }
    }
  }
  return results;
}
