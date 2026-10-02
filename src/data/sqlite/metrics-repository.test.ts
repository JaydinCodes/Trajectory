import { describe, expect, it } from "vitest";
import { getMetricDailyValuesAsOf, getMetricEventsAsOf, getMetricTotals, getMetricTotalsAsOf, getMetricTotalsInRange } from "./metrics-repository";
import { calculateTrajectorySnapshot } from "../../services/trajectory-service";
import type { Goal } from "../../lib/trajectory/types";
import type { SqliteDatabase } from "./types";

const october = { id: 1, name: "October", theme: "", start_date: "2026-10-01", end_date: "2026-10-31" };
const november = { id: 2, name: "November", theme: "", start_date: "2026-11-01", end_date: "2026-11-30" };
const codingEvents = [
  { id: 1, source: "coding", date: "2026-10-02", kind: "measurement" as const, value: 5, label: "5 problems", note: "Arrays" },
  { id: 2, source: "coding", date: "2026-10-14", kind: "measurement" as const, value: 9, label: "9 problems", note: "Graphs" },
];
const database: SqliteDatabase = {
  exec: () => undefined,
  prepare: (sql) => ({
    run: () => undefined,
    get: () => undefined,
    all: (...args: unknown[]) => {
      if (!sql.includes("coding_entries")) return [];
      const [start, end] = args as [string, string];
      return codingEvents.filter((event) => event.date >= start && event.date <= end);
    },
  }),
};
const dsaGoal: Goal = { id: 1, area: "Coding", title: "Solve 100 DSA problems", goal_type: "count", target: 100, current_value: 0, weight: 1, deadline: "2026-10-31", status: "active", metric_key: "dsa_problems", tracking_mode: "derived", season_id: 1 };

function octoberSecondSnapshot() {
  return calculateTrajectorySnapshot({
    goals: [dsaGoal],
    season: october,
    today: "2026-10-02",
    metrics: getMetricTotalsAsOf(database, october, "2026-10-02"),
    dailyValues: (metric, start, end) => getMetricDailyValuesAsOf(database, metric, october, "2026-10-02", start, end),
  });
}

describe("as-of metric definitions", () => {
  it("does not allow October 14 evidence to affect an October 2 trajectory", () => {
    const snapshot = octoberSecondSnapshot();
    expect(snapshot.goals[0].current).toBe(5);
    expect(snapshot.goals[0].projectedValue).toBe(77.5);
    expect(getMetricEventsAsOf(database, "dsa_problems", october, "2026-10-02")).toHaveLength(1);
  });

  it("includes October 2 evidence in an October 2 trajectory", () => {
    expect(getMetricTotalsAsOf(database, october, "2026-10-02").dsa_problems).toBe(5);
    expect(octoberSecondSnapshot().score).toBe(5);
  });

  it("is deterministic when calculating historical as-of dates", () => {
    expect(octoberSecondSnapshot()).toEqual(octoberSecondSnapshot());
  });

  it("keeps full-season retrieval separate and does not leak October data into November", () => {
    expect(getMetricTotals(database, october).dsa_problems).toBe(14);
    expect(getMetricTotals(database, november).dsa_problems).toBe(0);
    expect(getMetricTotalsAsOf(database, october, "2026-10-14").dsa_problems).toBe(14);
    expect(getMetricDailyValuesAsOf(database, "dsa_problems", november, "2026-11-02", "2026-10-01", "2026-11-02")).toEqual([]);
  });

  it("keeps weekly evidence inside the requested date boundaries", () => {
    expect(getMetricTotalsInRange(database, "2026-10-02", "2026-10-02").dsa_problems).toBe(5);
    expect(getMetricTotalsInRange(database, "2026-10-03", "2026-10-13").dsa_problems).toBe(0);
  });
});
