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
export function getCumulativeDistances(coordinates: Point[]): number[] {
  let total = 0;
  const result = [0];
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistance(coordinates[i - 1], coordinates[i]);
    result.push(total);
  }
  return result;
}

export type Point = [number, number];

/**
 * Find the closest point on any route to the hoveredLatLng
 *
 * @param hoveredLatLng - The point to find the closest point to
 * @param routeVariants - The routes to search in
 *
 * @returns The closest point on any route to the hoveredLatLng
 */
function findClosestPoint(
  hoveredLatLng: Point,
  routeVariants: RouteVariant[]
): Point {
  let closestPoint: Point = hoveredLatLng;
  let minDistance = Infinity;

  for (const route of routeVariants) {
    const features = route.geojson.features.filter(
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

      for (const [lng, lat] of coords) {
        const distance = haversineDistance(hoveredLatLng, [lat, lng]);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = [lat, lng];
        }
      }
    }
  }

  return closestPoint;
}

/**
 * Based on the given point, finds all points that are relevant to the user
 *
 * Steps:
 * - Find all points within 100 meters of the given point
 * - Order by distance from the given point
 * - Deduplicate: only keep points whose cumulative distances from start differ by at least 1km
 *
 */
function findRelevantRoutePoints(
  point: Point,
  routeVariants: RouteVariant[]
): { routeId: string; pointIndices: number[]; latlng: [number, number] }[] {
  const results: {
    routeId: string;
    pointIndices: number[];
    latlng: [number, number];
  }[] = [];

  for (const route of routeVariants) {
    const features = route.geojson.features.filter(
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

      // Find points within 100m and calculate distances
      const pointsWithDist = coords
        .map(([lng, lat], idx) => ({
          index: idx,
          point: [lat, lng] as Point,
          dist: haversineDistance(point, [lat, lng]),
        }))
        .filter(({ dist }) => dist <= 0.1); // 100m = 0.1km

      // Sort by distance
      pointsWithDist.sort((a, b) => a.dist - b.dist);

      // Get cumulative distances from start
      const cumDists = getCumulativeDistances(coords);

      // Deduplicate based on cumulative distance
      const deduped = pointsWithDist.filter((pt, idx) =>
        pointsWithDist
          .slice(0, idx)
          .every(
            (other) => Math.abs(cumDists[pt.index] - cumDists[other.index]) > 1
          )
      );

      if (deduped.length > 0) {
        results.push({
          routeId: route.id,
          pointIndices: deduped.map((d) => d.index),
          latlng: deduped[0].point,
        });
      }
    }
  }
  return results;
}

// Returns an array of { routeId, pointIndices, latlng } for relevant points near hoveredLatLng
export function getRelevantRoutePoints(
  hoveredLatLng: Point,
  routeVariants: RouteVariant[]
): { routeId: string; pointIndices: number[]; latlng: [number, number] }[] {
  const closestPoint = findClosestPoint(hoveredLatLng, routeVariants);
  const relevantRoutePoints = findRelevantRoutePoints(
    closestPoint,
    routeVariants
  );
  return relevantRoutePoints;
}
