import { describe, expect, it } from "vitest";
import { getSeasonWeekRanges, isWithinSeason } from "./season-period";

describe("season review date boundaries", () => {
  const season = { startDate: "2026-09-29", endDate: "2026-10-12" };
  it("excludes evidence and milestones outside the inclusive season range", () => {
    expect(isWithinSeason("2026-09-28", season)).toBe(false);
    expect(isWithinSeason("2026-09-29", season)).toBe(true);
    expect(isWithinSeason("2026-10-12", season)).toBe(true);
    expect(isWithinSeason("2026-10-13", season)).toBe(false);
  });
  it("builds clipped weekly-review boundaries across months", () => {
    expect(getSeasonWeekRanges(season)).toEqual([
      { label: "Week 1", startDate: "2026-09-29", endDate: "2026-10-04" },
      { label: "Week 2", startDate: "2026-10-05", endDate: "2026-10-11" },
      { label: "Week 3", startDate: "2026-10-12", endDate: "2026-10-12" },
    ]);
  });
});
