// @jest-environment node
// This file is intended to be run with Jest
import { describe, it, expect } from "vitest";
import { getDefaultDay } from "./date";

describe("getDefaultDay", () => {
  it("returns Dinsdag before Tuesday 18:00", () => {
    // July 15, 2025, 17:59 CEST (15:59 UTC)
    const date = new Date(Date.UTC(2025, 6, 15, 15, 59));
    expect(getDefaultDay(date)).toBe("Dinsdag");
  });

  it("returns Woensdag between Tuesday 18:00 and Wednesday 18:00", () => {
    // July 15, 2025, 18:01 CEST (16:01 UTC)
    const date = new Date(Date.UTC(2025, 6, 15, 16, 1));
    expect(getDefaultDay(date)).toBe("Woensdag");
    // July 16, 2025, 17:59 CEST (15:59 UTC)
    const date2 = new Date(Date.UTC(2025, 6, 16, 15, 59));
    expect(getDefaultDay(date2)).toBe("Woensdag");
  });

  it("returns Donderdag between Wednesday 18:00 and Thursday 18:00", () => {
    // July 16, 2025, 18:01 CEST (16:01 UTC)
    const date = new Date(Date.UTC(2025, 6, 16, 16, 1));
    expect(getDefaultDay(date)).toBe("Donderdag");
    // July 17, 2025, 17:59 CEST (15:59 UTC)
    const date2 = new Date(Date.UTC(2025, 6, 17, 15, 59));
    expect(getDefaultDay(date2)).toBe("Donderdag");
  });

  it("returns Vrijdag between Thursday 18:00 and 14 days after", () => {
    // July 17, 2025, 18:01 CEST (16:01 UTC)
    const date = new Date(Date.UTC(2025, 6, 17, 16, 1));
    expect(getDefaultDay(date)).toBe("Vrijdag");
    // July 30, 2025, 23:59 UTC (still within 14 days after Friday)
    const date2 = new Date(Date.UTC(2025, 6, 30, 23, 59));
    expect(getDefaultDay(date2)).toBe("Vrijdag");
  });

  it("returns Dinsdag after 14 days post-Friday", () => {
    // August 2, 2025, 00:00 UTC (well after 14 days)
    const date = new Date(Date.UTC(2025, 7, 2, 0, 0));
    expect(getDefaultDay(date)).toBe("Dinsdag");
  });
});
