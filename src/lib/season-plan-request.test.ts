import { describe, expect, it } from "vitest";
import { seasonPlanFrom } from "./season-plan-request";

const plan = {
  name: "October 2026",
  theme: "Build steadily",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  areaPlans: [{ area: "Coding", outcome: "Practice deliberately." }],
  goals: [{ title: "Solve problems", area: "Coding", target: 20, goalType: "count", trackingMode: "derived", metricKey: "dsa_problems", importance: "normal" }],
  lessons: [],
};

describe("seasonPlanFrom", () => {
  it("rejects untrusted area-plan and goal areas at the request boundary", () => {
    expect(() => seasonPlanFrom({ ...plan, areaPlans: [{ area: "Other", outcome: "" }] })).toThrow(/supported life area/i);
    expect(() => seasonPlanFrom({ ...plan, goals: [{ ...plan.goals[0], area: "Other" }] })).toThrow(/supported life area/i);
  });
});
