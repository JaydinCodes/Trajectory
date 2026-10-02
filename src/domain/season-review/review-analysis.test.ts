import { describe, expect, it } from "vitest";
import { buildSeasonReview, classifySeasonGoal } from "./review-analysis";
import type { SeasonReviewInputs } from "./types";

const input = (): SeasonReviewInputs => ({
  season: { id: 1, name: "October 2026", theme: "Consistency", startDate: "2026-09-28", endDate: "2026-10-25", totalDays: 28 },
  state: "not_reviewed",
  startScore: 0,
  endScore: 73,
  expectedEndScore: 100,
  goals: [{ id: 1, area: "Coding", title: "DSA", target: 100, startValue: 0, endValue: 82, startPercentage: 0, endPercentage: 82, movement: 82, expectedEndPercentage: 100, trajectoryStatus: "slightly_behind", evidence: { records: 19, activeDays: 19 } }],
  metrics: [{ key: "dsa_problems", label: "DSA problems", total: 82 }],
  attention: [{ name: "Coding", minutes: 120 }, { name: "Career", minutes: 60 }],
  weeklyTrend: [{ label: "Week 1", startDate: "2026-09-28", endDate: "2026-10-04", score: 18 }],
  consistency: [], milestones: [], journalHighlights: [], weeklyReviews: [],
});

describe("season review analysis", () => {
  it("classifies goal movement deterministically", () => {
    expect(classifySeasonGoal(0, 100)).toBe("completed");
    expect(classifySeasonGoal(0, 25)).toBe("substantially_progressed");
    expect(classifySeasonGoal(0, 5)).toBe("partial");
    expect(classifySeasonGoal(0, 1)).toBe("little_progress");
    expect(classifySeasonGoal(0, 0)).toBe("not_started");
  });
  it("keeps attention separate and produces reproducible movement", () => {
    const review = buildSeasonReview(input());
    expect(review.trajectory.change).toBe(73);
    expect(review.attention).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Coding", percentage: 66.7 })]));
    expect(review.movement.most[0]).toMatchObject({ area: "Coding", movement: 82 });
  });
  it("supports cross-month weekly points and an empty season", () => {
    const crossMonth = buildSeasonReview(input());
    expect(crossMonth.weeklyTrend[0]).toMatchObject({ startDate: "2026-09-28", endDate: "2026-10-04" });
    const empty = buildSeasonReview({ ...input(), goals: [], metrics: [], attention: [], weeklyTrend: [], consistency: [] });
    expect(empty.goals.all).toEqual([]);
    expect(empty.attention).toEqual([]);
  });
});
