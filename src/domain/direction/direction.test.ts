import { describe, expect, it } from "vitest";
import { directionVersionAt } from "./direction";
import { validHorizonRange } from "./horizons";

describe("direction history", () => {
  const versions = [
    { id: 1, directionId: 1, statement: "Junior developer", why: null, effectiveFrom: "2026-10-01", effectiveTo: "2026-11-30", createdAt: "2026-10-01" },
    { id: 2, directionId: 1, statement: "Own useful systems", why: null, effectiveFrom: "2026-12-01", effectiveTo: null, createdAt: "2026-12-01" },
  ];
  it("resolves the version that existed for the historical date", () => {
    expect(directionVersionAt(versions, "2026-10-15")?.statement).toBe("Junior developer");
    expect(directionVersionAt(versions, "2026-12-15")?.statement).toBe("Own useful systems");
  });
  it("requires a date range for custom horizons", () => {
    expect(validHorizonRange("custom", null, null)).toBe(false);
    expect(validHorizonRange("year", "2027-01-01", "2027-12-31")).toBe(true);
  });
});
