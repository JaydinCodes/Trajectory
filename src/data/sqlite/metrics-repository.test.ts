import { describe, expect, it } from "vitest";
import { getMetricDailyValues, getMetricEvents, getMetricTotals } from "./metrics-repository";
import type { SqliteDatabase } from "./types";

const october = { id: 1, name: "October", theme: "", start_date: "2026-10-01", end_date: "2026-10-31" };
const november = { id: 2, name: "November", theme: "", start_date: "2026-11-01", end_date: "2026-11-30" };
const events = [{ id: 1, source: "coding", date: "2026-10-31", kind: "measurement", value: 5, label: "5 problems", note: "Arrays" }];
const database: SqliteDatabase = { exec: () => undefined, prepare: (sql) => ({ run: () => undefined, get: () => undefined, all: (...args) => sql.includes("coding_entries") && args[0] === "2026-10-01" ? events : [] }) };

describe("season-scoped metric definitions", () => {
  it("does not allow October coding evidence into November totals, daily values, or evidence", () => {
    expect(getMetricEvents(database, "dsa_problems", october)).toHaveLength(1);
    expect(getMetricEvents(database, "dsa_problems", november)).toEqual([]);
    expect(getMetricTotals(database, october).dsa_problems).toBe(5);
    expect(getMetricTotals(database, november).dsa_problems).toBe(0);
    expect(getMetricDailyValues(database, "dsa_problems", "2026-11-01", "2026-11-30")).toEqual([]);
  });
});
