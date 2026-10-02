import { describe, expect, it } from "vitest";
import { buildLifeTimeline, chronologicalSeasons } from "./timeline";
import type { SeasonTimelineItem } from "./types";

const item = (id: number, startDate: string): SeasonTimelineItem => ({ season: { id, name: `Season ${id}`, theme: "", intention: null, startDate, endDate: startDate }, status: "completed", trajectory: { start: 0, end: id, change: id }, goals: { total: 1, completed: 0, carriedForward: 0 }, metrics: [], milestones: [], dominantAttention: [] });

describe("life timeline", () => {
  it("orders seasons most-recent first and groups them by start year", () => {
    const timeline = buildLifeTimeline([item(1, "2026-10-01"), item(2, "2027-01-01"), item(3, "2026-09-01")]);
    expect(chronologicalSeasons(timeline.seasons).map((season) => season.season.id)).toEqual([2, 1, 3]);
    expect(timeline.years.map((year) => [year.year, year.seasons.map((season) => season.season.id)])).toEqual([[2027, [2]], [2026, [1, 3]]]);
  });
});
