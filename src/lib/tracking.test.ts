import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import {
  buildRouteGeometry,
  estimatePersonPosition,
  formatKm,
  inferSpeedKmh,
  minutesToTime,
  pointAtKm,
  routeSliceBetweenKm,
  timeToMinutes,
  type Sighting,
  type TrackedPerson,
} from "./tracking";

function sighting(timeMinutes: number, distanceKm: number): Sighting {
  return { id: `s-${timeMinutes}`, timeMinutes, distanceKm };
}

function person(overrides: Partial<TrackedPerson> = {}): TrackedPerson {
  return {
    id: "p1",
    name: "Mam",
    color: "#7c3aed",
    day: "Dinsdag",
    routeVariantId: "Dinsdag-40km",
    startTime: "05:00",
    sightings: [],
    ...overrides,
  };
}

// Straight route east along the equator; 0.01° longitude ≈ 1.1132 km.
const straightRoute: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [0, 0],
          [0.01, 0],
          [0.02, 0],
          [0.04, 0],
        ],
      },
    },
  ],
};

describe("time helpers", () => {
  it("converts between HH:mm and minutes", () => {
    expect(timeToMinutes("05:30")).toBe(330);
    expect(minutesToTime(330)).toBe("05:30");
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(24 * 60 + 5)).toBe("00:05");
  });

  it("formats km with a decimal comma", () => {
    expect(formatKm(23.44)).toBe("23,4");
  });
});

describe("inferSpeedKmh", () => {
  it("derives speed from two sightings", () => {
    expect(inferSpeedKmh(sighting(600, 10), sighting(660, 15))).toBe(5);
  });

  it("rejects non-advancing pairs", () => {
    expect(inferSpeedKmh(sighting(600, 10), sighting(600, 15))).toBeNull();
    expect(inferSpeedKmh(sighting(600, 10), sighting(660, 10))).toBeNull();
    expect(inferSpeedKmh(sighting(600, 15), sighting(660, 10))).toBeNull();
  });
});

describe("estimatePersonPosition", () => {
  const options = { minSpeedKmh: 4, maxSpeedKmh: 6, routeLengthKm: 40 };

  it("is not started before the start time", () => {
    const result = estimatePersonPosition(person(), timeToMinutes("04:30"), options);
    expect(result).toEqual({ kind: "not-started" });
  });

  it("projects a range from the start time without sightings", () => {
    // 05:00 start, two hours later: between km 8 and km 12.
    const result = estimatePersonPosition(person(), timeToMinutes("07:00"), options);
    expect(result).toEqual({ kind: "range", minKm: 8, maxKm: 12 });
  });

  it("projects a range from a single sighting, never a point", () => {
    const p = person({ sightings: [sighting(timeToMinutes("10:00"), 20)] });
    const result = estimatePersonPosition(p, timeToMinutes("11:00"), options);
    expect(result).toEqual({ kind: "range", minKm: 24, maxKm: 26 });
  });

  it("ignores an imprecise start time once a sighting exists", () => {
    // Anchor must be the sighting, not the start: same result regardless of startTime.
    const late = person({
      startTime: "05:45",
      sightings: [sighting(timeToMinutes("10:00"), 20)],
    });
    const result = estimatePersonPosition(late, timeToMinutes("11:00"), options);
    expect(result).toEqual({ kind: "range", minKm: 24, maxKm: 26 });
  });

  it("infers speed from the two most recent sightings", () => {
    const p = person({
      sightings: [
        sighting(timeToMinutes("08:00"), 10),
        sighting(timeToMinutes("10:00"), 20), // 5 km/h
      ],
    });
    const result = estimatePersonPosition(p, timeToMinutes("11:00"), options);
    expect(result).toEqual({ kind: "point", km: 25, speedKmh: 5 });
  });

  it("only uses sightings up to the requested time", () => {
    const p = person({
      sightings: [
        sighting(timeToMinutes("08:00"), 10),
        sighting(timeToMinutes("10:00"), 20),
      ],
    });
    // At 09:00 only one sighting is known → range from that sighting.
    const result = estimatePersonPosition(p, timeToMinutes("09:00"), options);
    expect(result).toEqual({ kind: "range", minKm: 14, maxKm: 16 });
  });

  it("falls back to a range when the sighting pair is unusable", () => {
    const p = person({
      sightings: [
        sighting(timeToMinutes("08:00"), 20),
        sighting(timeToMinutes("10:00"), 20), // no progress → no speed
      ],
    });
    const result = estimatePersonPosition(p, timeToMinutes("11:00"), options);
    expect(result).toEqual({ kind: "range", minKm: 24, maxKm: 26 });
  });

  it("clamps the range end to the route and finishes past it", () => {
    const p = person({ sightings: [sighting(timeToMinutes("10:00"), 38)] });
    // 15 min later: 38.0 + 1.0 … 38 + 1.5, max clamped below route length
    const nearEnd = estimatePersonPosition(p, timeToMinutes("10:15"), options);
    expect(nearEnd).toEqual({ kind: "range", minKm: 39, maxKm: 39.5 });
    // even the slowest speed passes the finish → finished
    const done = estimatePersonPosition(p, timeToMinutes("11:00"), options);
    expect(done).toEqual({ kind: "finished" });
  });
});

describe("route geometry", () => {
  const geometry = buildRouteGeometry(straightRoute)!;

  it("builds cumulative distances for the LineString", () => {
    expect(geometry).not.toBeNull();
    expect(geometry.cumulativeKm[0]).toBe(0);
    expect(geometry.lengthKm).toBeCloseTo(4.45, 1);
  });

  it("returns vertices exactly at their distance", () => {
    const atSecond = pointAtKm(geometry, geometry.cumulativeKm[1]);
    expect(atSecond[0]).toBeCloseTo(0, 6);
    expect(atSecond[1]).toBeCloseTo(0.01, 6);
  });

  it("interpolates between vertices", () => {
    const midFirstSegment = pointAtKm(geometry, geometry.cumulativeKm[1] / 2);
    expect(midFirstSegment[1]).toBeCloseTo(0.005, 4);
  });

  it("clamps outside the route", () => {
    expect(pointAtKm(geometry, -5)[1]).toBe(0);
    expect(pointAtKm(geometry, 999)[1]).toBe(0.04);
  });

  it("slices the route between two distances", () => {
    const slice = routeSliceBetweenKm(
      geometry,
      geometry.cumulativeKm[1] / 2,
      geometry.cumulativeKm[2]
    );
    // interpolated start, vertex at index 1, exact vertex end
    expect(slice).toHaveLength(3);
    expect(slice[0][1]).toBeCloseTo(0.005, 4);
    expect(slice[1][1]).toBeCloseTo(0.01, 6);
    expect(slice[2][1]).toBeCloseTo(0.02, 6);
  });
});
