import { describe, expect, it } from "vitest";
import { validateSeasonPlan } from "./validation";
import type { SeasonPlanInput } from "./types";

const plan = (): SeasonPlanInput => ({ name: "November 2026", theme: "Build + Stabilise", startDate: "2026-11-01", endDate: "2026-11-30", areaPlans: [{ area: "Coding", outcome: "Build fluency." }], lessons: [], goals: [{ title: "Solve DSA", area: "Coding", target: 100, goalType: "count", trackingMode: "derived", metricKey: "dsa_problems", importance: "high" }] });

describe("season plan validation", () => {
  it("accepts a valid derived and manual plan", () => {
    const value = plan(); value.goals.push({ title: "Ship report", area: "Career", target: 3, goalType: "count", trackingMode: "manual", importance: "normal" });
    expect(validateSeasonPlan(value).errors).toEqual([]);
  });
  it("rejects invalid ranges, duplicate metric goals, and invalid targets", () => {
    const value = plan(); value.endDate = "2026-10-30"; value.goals.push({ ...value.goals[0], title: "More DSA", target: 0 });
    expect(validateSeasonPlan(value).errors.join(" ")).toMatch(/dates|positive target|Only one derived/i);
  });
  it("requires a metric for every derived goal and a goal before activation", () => {
    const value = plan(); value.goals[0].metricKey = null;
    expect(validateSeasonPlan(value).errors.join(" ")).toMatch(/tracking metric/i);
    value.goals = [];
    expect(validateSeasonPlan(value).errors.join(" ")).toMatch(/at least one/i);
    expect(validateSeasonPlan(value, { requireGoals: false }).errors).toEqual([]);
  });
  it("keeps carried manual baselines bounded by their new target", () => {
    const value = plan(); value.goals = [{ title: "MVP", area: "Ledgerly", target: 100, baselineValue: 82, carriedFromGoalId: 4, goalType: "numeric", trackingMode: "manual", importance: "critical" }];
    expect(validateSeasonPlan(value).errors).toEqual([]);
    value.goals[0].baselineValue = 101;
    expect(validateSeasonPlan(value).errors[0]).toMatch(/baseline/i);
  });
});
