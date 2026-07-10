import type { FeatureCollection, LineString } from "geojson";
import { describe, expect, it } from "vitest";
import {
  buildRouteSearchIndex,
  estimatePassageTime,
  getCumulativeDistances,
  getRelevantRoutePoints,
  haversineDistance,
  leafletLatLngToLngLat,
  lngLatToLeafletLatLng,
  type LngLat,
} from "./utils";

function routeGeojson(coordinates: LngLat[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      },
    ],
  };
}

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistance([0, 0], [0, 0])).toBeCloseTo(0, 5);
  });

  it("calculates correct distance between two known points", () => {
    // Amsterdam (4.9041, 52.3676) to Paris (2.3522, 48.8566)
    const amsterdam: [number, number] = [4.9041, 52.3676];
    const paris: [number, number] = [2.3522, 48.8566];
    const dist = haversineDistance(amsterdam, paris);
    expect(dist).toBeGreaterThan(400);
    expect(dist).toBeLessThan(450);
  });
});

describe("coordinate order", () => {
  it("converts only at the Leaflet boundary", () => {
    expect(leafletLatLngToLngLat([51.842, 5.852])).toEqual([5.852, 51.842]);
    expect(lngLatToLeafletLatLng([5.852, 51.842])).toEqual([51.842, 5.852]);
  });

  it("finds a Nijmegen route using GeoJSON longitude-latitude order", () => {
    const index = buildRouteSearchIndex([
      {
        id: "dinsdag-30km",
        geojson: routeGeojson([
          [5.85, 51.84],
          [5.852, 51.842],
        ]),
      },
    ]);

    expect(getRelevantRoutePoints([5.852, 51.842], index)).toHaveLength(1);
    expect(getRelevantRoutePoints([51.842, 5.852], index)).toEqual([]);
  });
});

describe("getCumulativeDistances", () => {
  it("returns a cumulative distance for every route coordinate", () => {
    const distances = getCumulativeDistances([
      [5.8, 51.8],
      [5.8, 51.809],
      [5.8, 51.818],
    ]);

    expect(distances).toHaveLength(3);
    expect(distances[0]).toBe(0);
    expect(distances[1]).toBeCloseTo(1, 1);
    expect(distances[2]).toBeCloseTo(2, 1);
  });

  it("handles an empty line", () => {
    expect(getCumulativeDistances([])).toEqual([]);
  });
});

describe("getRelevantRoutePoints", () => {
  it("returns nearby visits ordered by proximity and separated along the route", () => {
    const coordinates: LngLat[] = [
      [5.85, 51.84],
      [5.85, 51.849],
      [5.86, 51.849],
      [5.8601, 51.84],
      [5.8501, 51.8401],
    ];
    const index = buildRouteSearchIndex([
      { id: "vrijdag-50km", geojson: routeGeojson(coordinates) },
    ]);

    const [result] = getRelevantRoutePoints([5.85, 51.84], index);

    expect(result.routeId).toBe("vrijdag-50km");
    expect(result.pointIndices).toEqual([0, 4]);
    expect(result.latlng).toEqual([51.84, 5.85]);
    expect(result.cumulativeDistancesKm).toHaveLength(2);
    expect(result.cumulativeDistancesKm[0]).toBe(0);
    expect(result.cumulativeDistancesKm[1]).toBeGreaterThan(2);
  });

  it("excludes a pointer more than one kilometre from a route", () => {
    const index = buildRouteSearchIndex([
      {
        id: "woensdag-40km",
        geojson: routeGeojson([[5.85, 51.84]]),
      },
    ]);

    expect(getRelevantRoutePoints([5.9, 51.9], index)).toEqual([]);
  });
});

describe("estimatePassageTime", () => {
  it("rejects zero or negative walking speeds", () => {
    expect(() => estimatePassageTime("07:00", 5, 0)).toThrow(RangeError);
    expect(() => estimatePassageTime("07:00", 5, -1)).toThrow(RangeError);
  });

  it("returns the same time for 0 distance", () => {
    expect(estimatePassageTime("07:00", 0, 5)).toBe("07:00");
  });

  it("calculates correct time for 5km at 5km/h from 07:00", () => {
    expect(estimatePassageTime("07:00", 5, 5)).toBe("08:00");
  });

  it("wraps around midnight correctly", () => {
    expect(estimatePassageTime("23:30", 60, 6)).toBe("09:30");
  });
});
