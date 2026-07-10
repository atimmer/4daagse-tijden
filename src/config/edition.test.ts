import { readFileSync } from "node:fs";
import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import { EDITION, EVENT_DAYS, getDefaultStartTime } from "./edition";

describe("2026 edition configuration", () => {
  it("contains each event day and a matching route file", () => {
    expect(EDITION.year).toBe(2026);
    expect(EVENT_DAYS).toEqual([
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
    ]);
    expect(EDITION.routes.every(({ file }) => file.includes("2026"))).toBe(true);
  });

  it("points to GeoJSON containing every supported route layer", () => {
    for (const { file } of EDITION.routes) {
      const fileUrl = new URL(`../../public${file}`, import.meta.url);
      const geojson = JSON.parse(
        readFileSync(fileUrl, "utf8")
      ) as FeatureCollection;
      const routeLayers = geojson.features
        .filter(({ geometry }) => geometry.type === "LineString")
        .map(({ properties }) => properties?.layer)
        .filter((layer): layer is string => typeof layer === "string")
        .sort();

      expect(routeLayers).toEqual(["30km", "40km", "40km MIL", "50km"]);
    }
  });

  it("uses the official earliest start times and Friday military override", () => {
    expect(getDefaultStartTime("Dinsdag", "50km")).toBe("04:00");
    expect(getDefaultStartTime("Dinsdag", "40km")).toBe("05:00");
    expect(getDefaultStartTime("Dinsdag", "30km")).toBe("07:00");
    expect(getDefaultStartTime("Dinsdag", "40km MIL")).toBe("04:30");
    expect(getDefaultStartTime("Vrijdag", "40km MIL")).toBe("03:30");
  });
});
