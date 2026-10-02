import { describe, expect, it } from "vitest";
import { formatWeekLabel, getPreviousWeekRange, getWeekRange } from "./week-range";

describe("weekly review date ranges", () => {
  it("uses Johannesburg calendar Monday through Sunday boundaries", () => {
    expect(getWeekRange("2026-10-02")).toEqual({ startDate: "2026-09-28", endDate: "2026-10-04" });
  });
  it("handles cross-year weeks without overlap", () => {
    const range = getWeekRange("2027-01-01");
    expect(range).toEqual({ startDate: "2026-12-28", endDate: "2027-01-03" });
    expect(getPreviousWeekRange(range)).toEqual({ startDate: "2026-12-21", endDate: "2026-12-27" });
  });
  it("formats a compact editorial label", () => expect(formatWeekLabel({ startDate: "2026-09-28", endDate: "2026-10-04" })).toBe("Sep 28 — Oct 4"));
});
