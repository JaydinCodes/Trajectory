import { describe, expect, it } from "vitest";
import { calculateTrajectorySnapshot } from "./trajectory-service";
import type { Goal, MetricKey } from "../lib/trajectory/types";

const goal: Goal = { id: 1, area: "Coding", title: "DSA", goal_type: "count", target: 100, current_value: 0, weight: 1, deadline: "2026-10-31", status: "active", metric_key: "dsa_problems", tracking_mode: "derived", season_id: 1 };
const metrics: Record<MetricKey, number> = { bible_days: 0, gym_sessions: 0, dsa_problems: 5, deep_work_minutes: 0, tutoring_revenue: 0, savings: 0, custom: 0 };

describe("trajectory service", () => {
  it("orchestrates repository data without SQLite knowledge", () => {
    const snapshot = calculateTrajectorySnapshot({ goals: [goal], season: { id: 1, name: "October", theme: "", start_date: "2026-10-01", end_date: "2026-10-31" }, today: "2026-10-01", metrics, dailyValues: () => [5] });
    expect(snapshot.goals[0].current).toBe(5);
    expect(snapshot.areas[0]).toMatchObject({ area: "Coding", score: 5, expected: 3, momentum: "steady" });
  });
});
