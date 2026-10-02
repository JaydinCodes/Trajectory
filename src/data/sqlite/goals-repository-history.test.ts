import { describe, expect, it } from "vitest";
import { manualGoalValueAsOf } from "./goals-repository";
import type { SqliteDatabase } from "./types";

const database: SqliteDatabase = {
  exec: () => undefined,
  prepare: () => ({
    run: () => undefined,
    all: () => [],
    get: (_goalId: unknown, date: unknown) => String(date) < "2026-10-10" ? { value: 20 } : { value: 50 },
  }),
};

describe("manual goal history", () => {
  it("returns the latest manual update at the requested historical date", () => {
    const goal = { id: 1, baseline_value: 0, current_value: 50 };
    expect(manualGoalValueAsOf(database, goal, "2026-10-05")).toBe(20);
    expect(manualGoalValueAsOf(database, goal, "2026-10-15")).toBe(50);
  });
  it("uses the explicit baseline when the goal has no historical update", () => {
    const empty: SqliteDatabase = { exec: () => undefined, prepare: () => ({ run: () => undefined, all: () => [], get: () => undefined }) };
    expect(manualGoalValueAsOf(empty, { id: 2, baseline_value: 7, current_value: 99 }, "2026-10-05")).toBe(7);
  });
});
