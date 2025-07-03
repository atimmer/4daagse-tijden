import { describe, it, expect } from "vitest";
import { haversineDistance, estimatePassageTime } from "./utils";

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

describe("estimatePassageTime", () => {
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
