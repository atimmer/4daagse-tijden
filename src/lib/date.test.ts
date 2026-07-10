// @jest-environment node
// This file is intended to be run with Jest
import { describe, it, expect } from "vitest";
import { getDefaultDay } from "./date";

describe("getDefaultDay", () => {
  it("returns Dinsdag before Tuesday 18:00", () => {
    // July 21, 2026, 17:59 CEST (15:59 UTC)
    const date = new Date(Date.UTC(2026, 6, 21, 15, 59));
    expect(getDefaultDay(date)).toBe("Dinsdag");
  });

  it("returns Woensdag between Tuesday 18:00 and Wednesday 18:00", () => {
    // July 21, 2026, 18:01 CEST (16:01 UTC)
    const date = new Date(Date.UTC(2026, 6, 21, 16, 1));
    expect(getDefaultDay(date)).toBe("Woensdag");
    // July 22, 2026, 17:59 CEST (15:59 UTC)
    const date2 = new Date(Date.UTC(2026, 6, 22, 15, 59));
    expect(getDefaultDay(date2)).toBe("Woensdag");
  });

  it("returns Donderdag between Wednesday 18:00 and Thursday 18:00", () => {
    // July 22, 2026, 18:01 CEST (16:01 UTC)
    const date = new Date(Date.UTC(2026, 6, 22, 16, 1));
    expect(getDefaultDay(date)).toBe("Donderdag");
    // July 23, 2026, 17:59 CEST (15:59 UTC)
    const date2 = new Date(Date.UTC(2026, 6, 23, 15, 59));
    expect(getDefaultDay(date2)).toBe("Donderdag");
  });

  it("returns Vrijdag between Thursday 18:00 and 14 days after", () => {
    // July 23, 2026, 18:01 CEST (16:01 UTC)
    const date = new Date(Date.UTC(2026, 6, 23, 16, 1));
    expect(getDefaultDay(date)).toBe("Vrijdag");
    // August 6, 2026, 15:59 UTC (still within 14 days after Thursday)
    const date2 = new Date(Date.UTC(2026, 7, 6, 15, 59));
    expect(getDefaultDay(date2)).toBe("Vrijdag");
  });

  it("returns Dinsdag after 14 days post-Friday", () => {
    const date = new Date(Date.UTC(2026, 7, 6, 16, 0));
    expect(getDefaultDay(date)).toBe("Dinsdag");
  });
});
