import { describe, expect, it } from "vitest";
import { attentionProgressPatterns, consistencyPatterns, directionAndLineagePatterns, focusAlignmentPatterns, generatePatterns, habitAndConcentrationPatterns, moodPatterns, recoveryAndMomentumPatterns, repeatedStallPatterns, seasonalPatterns } from "./rules";
import type { PatternDataset, WeeklyPatternRecord } from "./types";

const metrics = (overrides: Partial<WeeklyPatternRecord["metrics"]> = {}): WeeklyPatternRecord["metrics"] => ({ bible_days: 0, gym_sessions: 0, dsa_problems: 0, deep_work_minutes: 0, tutoring_revenue: 0, savings: 0, custom: 0, ...overrides });
const week = (index: number, overrides: Partial<WeeklyPatternRecord> = {}): WeeklyPatternRecord => ({ weekStart: `2026-09-${String(index * 7 + 1).padStart(2, "0")}`, weekEnd: `2026-09-${String(index * 7 + 7).padStart(2, "0")}`, trajectoryStart: 50, trajectoryEnd: 50 + index, trajectoryChange: index, metrics: metrics({ bible_days: 4, dsa_problems: 2 }), deepWorkByArea: { Coding: 120 }, goalMovement: [{ id: 1, title: "DSA", area: "Coding", progressChange: index, movement: "advanced", momentum: "steady" }], milestoneCount: 0, ...overrides });
const dataset = (weeks: WeeklyPatternRecord[]): PatternDataset => ({ weeks, seasons: [], moodDays: [], lineages: [], availableAreas: ["Coding", "Faith"], coverage: { totalWeeks: weeks.length, evidenceWeeks: weeks.length, completedReviews: 0, moodDays: 0, deepWorkWeeks: weeks.length } });

describe("pattern rules", () => {
  it("does not manufacture a consistency pattern from two periods", () => expect(consistencyPatterns([week(0), week(1)], "8w")).toHaveLength(0));
  it("detects an exact coding consistency streak with its weekly evidence", () => {
    const patterns = consistencyPatterns([week(0), week(1), week(2)], "8w", "Coding");
    expect(patterns).toHaveLength(1); expect(patterns[0].evidence).toHaveLength(3); expect(patterns[0].statement).toMatch(/each of the last 3/);
  });
  it("detects repeated stalls without judgmental language", () => {
    const records = [0, 1, 2, 3, 4].map((index) => week(index, { goalMovement: [{ id: 9, title: "MVP", area: "Ledgerly", progressChange: 0, movement: index < 3 ? "stalled" : "maintained", momentum: "stalled" }] }));
    const result = repeatedStallPatterns(records, "8w"); expect(result[0].statement).toMatch(/3 of 5/); expect(result[0].statement).not.toMatch(/fail/i);
  });
  it("describes recovery and momentum using the existing weekly labels", () => {
    const records = [0, 1, 2, 3, 4, 5].map((index) => week(index, { goalMovement: [{ id: 1, title: "DSA", area: "Coding", progressChange: index % 2 ? 4 : 0, movement: index % 2 ? "advanced" : "stalled", momentum: "accelerating" }] }));
    const patterns = recoveryAndMomentumPatterns(records, "8w", "Coding");
    expect(patterns.some((pattern) => pattern.id === "recovery:coding")).toBe(true); expect(patterns.some((pattern) => pattern.id === "momentum:coding")).toBe(true);
  });
  it("compares planned focus to recorded deep work", () => {
    const records = [0, 1, 2].map((index) => week(index, { primaryFocus: "Coding", deepWorkByArea: { Coding: index === 1 ? 0 : 90 } }));
    expect(focusAlignmentPatterns(records, "8w", "Coding")[0].statement).toMatch(/2 of those weeks/);
  });
  it("requires enough variable weeks before attention-progress association", () => {
    expect(attentionProgressPatterns([week(0), week(1), week(2)], "8w", "Coding")).toHaveLength(0);
    const records = [20, 30, 40, 180, 200, 220].map((minutes, index) => week(index, { deepWorkByArea: { Coding: minutes }, goalMovement: [{ id: 1, title: "DSA", area: "Coding", progressChange: index < 3 ? index + 1 : index + 8, movement: "advanced", momentum: "steady" }] }));
    const pattern = attentionProgressPatterns(records, "8w", "Coding")[0]; expect(pattern.statement).toMatch(/associated with/); expect(pattern.statement).not.toMatch(/caused|because of|made you|resulted in/i);
  });
  it("reports habit stability and deep-work concentration", () => {
    const patterns = habitAndConcentrationPatterns([week(0), week(1), week(2)], "8w");
    expect(patterns.some((pattern) => pattern.id === "stability:dsa_problems")).toBe(true); expect(patterns.some((pattern) => pattern.id === "concentration:coding")).toBe(true);
  });
  it("requires three completed seasons for a trend", () => {
    const seasons = [1, 2, 3].map((value) => ({ id: value, name: `Season ${value}`, startDate: `2026-0${value}-01`, endDate: `2026-0${value}-28`, completed: true, metrics: metrics({ dsa_problems: value * 10 }), deepWorkByArea: {}, goalAreas: ["Coding"], directionAreas: [] }));
    expect(seasonalPatterns(seasons, "all", "Coding").some((pattern) => pattern.id === "seasonal:dsa_problems")).toBe(true);
  });
  it("surfaces carry-forward lineage only across three seasons", () => {
    const data = dataset([]); data.lineages = [1, 2, 3].map((id) => ({ id, title: "MVP", area: "Ledgerly", seasonName: `Season ${id}`, seasonStart: `2026-0${id}-01`, progress: id * 30, carriedFromGoalId: id === 1 ? null : id - 1, completed: id === 3 }));
    expect(directionAndLineagePatterns(data, "all").some((pattern) => pattern.id === "carry-forward:1")).toBe(true);
  });
  it("keeps mood wording associative and requires balanced samples", () => {
    const data = dataset([]); data.moodDays = [...Array.from({ length: 6 }, (_, index) => ({ date: `2026-09-${index + 1}`, mood: 7 + (index % 2), workout: true })), ...Array.from({ length: 6 }, (_, index) => ({ date: `2026-09-${index + 11}`, mood: 4 + (index % 2), workout: false }))];
    expect(moodPatterns(data, "all")[0].statement).toMatch(/not a causal conclusion/);
  });
  it("deduplicates competing observations and never returns insufficient data", () => {
    const results = generatePatterns(dataset([week(0), week(1), week(2), week(3), week(4), week(5)]), "8w");
    expect(results.every((item) => item.confidence !== "insufficient_data")).toBe(true);
    expect(new Set(results.map((item) => `${item.relatedAreas?.join(",")}:${item.category}`)).size).toBe(results.length);
  });
});
