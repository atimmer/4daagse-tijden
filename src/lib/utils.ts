import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
