import { clsx, type ClassValue } from "clsx";
import type { FeatureCollection, LineString, Position } from "geojson";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A GeoJSON coordinate, ordered as longitude then latitude. */
export type LngLat = [longitude: number, latitude: number];

/** A Leaflet coordinate tuple, ordered as latitude then longitude. */
export type LeafletLatLngTuple = [latitude: number, longitude: number];

export function leafletLatLngToLngLat([
  latitude,
  longitude,
]: LeafletLatLngTuple): LngLat {
  return [longitude, latitude];
}

export function lngLatToLeafletLatLng([
  longitude,
  latitude,
]: LngLat): LeafletLatLngTuple {
  return [latitude, longitude];
}

// Haversine formula to calculate distance between two GeoJSON lng/lat points in km
export function haversineDistance(
  [lng1, lat1]: LngLat,
  [lng2, lat2]: LngLat
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
  if (!Number.isFinite(speedKmh) || speedKmh <= 0) {
    throw new RangeError("Walking speed must be greater than zero");
  }

  // startTime: '07:00'
  const [h, m] = startTime.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const minutes = (distanceKm / speedKmh) * 60;
  const totalMinutes = Math.round(startMinutes + minutes);
  const hh = Math.floor(totalMinutes / 60) % 24;
  const mm = totalMinutes % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

// Given GeoJSON coordinates, return the cumulative distance (km) at each point.
export function getCumulativeDistances(
  coordinates: readonly LngLat[]
): number[] {
  let total = 0;
  const result = coordinates.length === 0 ? [] : [0];
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistance(coordinates[i - 1], coordinates[i]);
    result.push(total);
  }
  return result;
}

export interface RouteSearchRoute {
  id: string;
  geojson: FeatureCollection;
}

export interface RelevantRoutePoint {
  routeId: string;
  pointIndices: number[];
  latlng: LeafletLatLngTuple;
  /** Precomputed route distances corresponding to pointIndices. */
  cumulativeDistancesKm: number[];
}

interface IndexedRoutePoint {
  coordinate: LngLat;
  cumulativeDistanceKm: number;
  featureIndex: number;
  pointIndex: number;
  routeId: string;
}

export interface RouteSearchIndex {
  readonly buckets: ReadonlyMap<string, readonly IndexedRoutePoint[]>;
}

const GRID_CELL_DEGREES = 0.01;
const MAX_ROUTE_DISTANCE_KM = 1;
const RELEVANT_POINT_DISTANCE_KM = 0.1;
const MIN_ROUTE_DISTANCE_DIFFERENCE_KM = 1;

function isLngLat(position: Position): position is LngLat {
  return (
    position.length >= 2 &&
    typeof position[0] === "number" &&
    typeof position[1] === "number"
  );
}

function gridCell([longitude, latitude]: LngLat): [number, number] {
  return [
    Math.floor(longitude / GRID_CELL_DEGREES),
    Math.floor(latitude / GRID_CELL_DEGREES),
  ];
}

function gridKey(x: number, y: number): string {
  return `${x}:${y}`;
}

/**
 * Precomputes normalized coordinates, cumulative distances and a small spatial
 * grid. Build this when the visible routes change, not for each pointer event.
 */
export function buildRouteSearchIndex(
  routes: readonly RouteSearchRoute[]
): RouteSearchIndex {
  const mutableBuckets = new Map<string, IndexedRoutePoint[]>();

  for (const route of routes) {
    route.geojson.features.forEach((feature, featureIndex) => {
      if (feature.geometry.type !== "LineString") return;

      const coordinates = (feature.geometry as LineString).coordinates.filter(
        isLngLat
      );
      const cumulativeDistances = getCumulativeDistances(coordinates);

      coordinates.forEach((coordinate, pointIndex) => {
        const [x, y] = gridCell(coordinate);
        const key = gridKey(x, y);
        const bucket = mutableBuckets.get(key) ?? [];
        bucket.push({
          coordinate,
          cumulativeDistanceKm: cumulativeDistances[pointIndex],
          featureIndex,
          pointIndex,
          routeId: route.id,
        });
        mutableBuckets.set(key, bucket);
      });
    });
  }

  return { buckets: mutableBuckets };
}

function queryNearbyPoints(
  point: LngLat,
  radiusKm: number,
  index: RouteSearchIndex
): { distanceKm: number; point: IndexedRoutePoint }[] {
  const [longitude, latitude] = point;
  const latitudeDelta = radiusKm / 110.574;
  const longitudeKmPerDegree =
    111.32 * Math.max(Math.abs(Math.cos((latitude * Math.PI) / 180)), 0.01);
  const longitudeDelta = radiusKm / longitudeKmPerDegree;
  const [minX, minY] = gridCell([
    longitude - longitudeDelta,
    latitude - latitudeDelta,
  ]);
  const [maxX, maxY] = gridCell([
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ]);
  const results: { distanceKm: number; point: IndexedRoutePoint }[] = [];

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (const indexedPoint of index.buckets.get(gridKey(x, y)) ?? []) {
        const distanceKm = haversineDistance(point, indexedPoint.coordinate);
        if (distanceKm <= radiusKm) {
          results.push({ distanceKm, point: indexedPoint });
        }
      }
    }
  }

  return results;
}

/** Returns route points relevant to a GeoJSON lng/lat coordinate. */
export function getRelevantRoutePoints(
  lngLat: LngLat,
  index: RouteSearchIndex
): RelevantRoutePoint[] {
  const pointsNearPointer = queryNearbyPoints(
    lngLat,
    MAX_ROUTE_DISTANCE_KM,
    index
  );
  if (pointsNearPointer.length === 0) return [];

  let closest = pointsNearPointer[0];
  for (let i = 1; i < pointsNearPointer.length; i++) {
    if (pointsNearPointer[i].distanceKm < closest.distanceKm) {
      closest = pointsNearPointer[i];
    }
  }

  const pointsNearRoute = queryNearbyPoints(
    closest.point.coordinate,
    RELEVANT_POINT_DISTANCE_KM,
    index
  ).sort((a, b) => a.distanceKm - b.distanceKm);
  const groupedPoints = new Map<string, typeof pointsNearRoute>();

  for (const candidate of pointsNearRoute) {
    const groupKey = `${candidate.point.routeId}:${candidate.point.featureIndex}`;
    const group = groupedPoints.get(groupKey) ?? [];
    group.push(candidate);
    groupedPoints.set(groupKey, group);
  }

  const results: RelevantRoutePoint[] = [];
  for (const candidates of groupedPoints.values()) {
    const deduplicated = candidates.filter((candidate, index) =>
      candidates.slice(0, index).every(
        (other) =>
          Math.abs(
            candidate.point.cumulativeDistanceKm -
              other.point.cumulativeDistanceKm
          ) > MIN_ROUTE_DISTANCE_DIFFERENCE_KM
      )
    );
    if (deduplicated.length === 0) continue;

    results.push({
      routeId: deduplicated[0].point.routeId,
      pointIndices: deduplicated.map(({ point }) => point.pointIndex),
      latlng: lngLatToLeafletLatLng(deduplicated[0].point.coordinate),
      cumulativeDistancesKm: deduplicated.map(
        ({ point }) => point.cumulativeDistanceKm
      ),
    });
  }

  return results;
}
