import { describe, expect, it } from "vitest";
import { activateDraftSeason, completeInitialSeason, createDraftSeason } from "./season-planning-service";
import type { SqliteDatabase } from "@/data/sqlite/types";
import type { SeasonPlanInput } from "@/domain/season-planning/types";

const input = (): SeasonPlanInput => ({ name: "November", theme: "Build + Stabilise", startDate: "2026-11-01", endDate: "2026-11-30", previousSeasonId: 1, lessons: [{ kind: "lesson", content: "Consistency worked." }], areaPlans: [{ area: "Coding", outcome: "Become more fluent." }], goals: [{ title: "DSA", area: "Coding", target: 100, goalType: "count", trackingMode: "derived", metricKey: "dsa_problems", importance: "high" }, { title: "MVP", area: "Ledgerly", target: 100, baselineValue: 82, carriedFromGoalId: 77, goalType: "numeric", trackingMode: "manual", importance: "critical" }] });

function store(overlap = false) {
  const calls: Array<{ sql: string; args: unknown[] }> = [];
  const database: SqliteDatabase = {
    exec: (sql) => { calls.push({ sql, args: [] }); },
    prepare: (sql) => ({
      run: (...args) => { calls.push({ sql, args }); return undefined; },
      all: (...args) => {
        calls.push({ sql, args });
        if (sql.includes("from goals where season_id")) return [
          { area: "Coding", title: "DSA", target: 100, goal_type: "count", tracking_mode: "derived", metric_key: "dsa_problems", deadline: "2026-11-30", weight: 1.5, baseline_value: 0, carried_from_goal_id: null },
          { area: "Ledgerly", title: "MVP", target: 100, goal_type: "numeric", tracking_mode: "manual", metric_key: null, deadline: "2026-11-30", weight: 2, baseline_value: 82, carried_from_goal_id: 77 },
        ];
        return [{ area: "Coding", outcome: "Become more fluent.", priority: 1 }];
      },
      get: (...args) => {
        calls.push({ sql, args });
        if (sql.includes("last_insert_rowid")) return { id: 4 };
        if (sql.includes("select * from seasons")) return { id: 4, name: "November", theme: "Build + Stabilise", intention: null, start_date: "2026-11-01", end_date: "2026-11-30", previous_season_id: 1 };
        if (sql.includes("select id from seasons where id")) return { id: 4 };
        if (sql.includes("status='active'")) return overlap ? { id: 2 } : undefined;
        return undefined;
      },
    }),
  };
  return { database, calls };
}

describe("season planning service", () => {
  it("creates a draft with draft goals and preserves a carried baseline", () => {
    const { database, calls } = store();
    expect(createDraftSeason(database, input())).toBe(4);
    const carried = calls.find((call) => call.sql.startsWith("insert into goals") && call.args.includes(77));
    expect(carried?.args).toContain(82);
    expect(carried?.args).toContain("draft");
    expect(calls.map((call) => call.sql)).toContain("begin immediate");
    expect(calls.map((call) => call.sql)).toContain("commit");
    expect(calls.some((call) => call.sql.includes("update goals") && call.args.includes(77))).toBe(false);
  });
  it("activates draft goals atomically and rejects an overlap", () => {
    const success = store();
    expect(() => activateDraftSeason(success.database, 4)).not.toThrow();
    expect(success.calls.some((call) => call.sql.includes("set status='active'"))).toBe(true);
    const blocked = store(true);
    expect(() => activateDraftSeason(blocked.database, 4)).toThrow(/overlaps/i);
    expect(blocked.calls.map((call) => call.sql)).toContain("rollback");
  });
  it("creates an initial active season, its goals, and completion state in one transaction", () => {
    const { database, calls } = store();
    expect(completeInitialSeason(database, input())).toEqual({ seasonId: 4, alreadyCompleted: false });
    expect(calls.some((call) => call.sql.includes("activated_at") && call.args.includes("November"))).toBe(true);
    expect(calls.some((call) => call.sql.includes("onboarding_completed"))).toBe(true);
    expect(calls.map((call) => call.sql)).toContain("commit");
  });
});
