import type { MetricKey, TrajectoryStatus } from "@/lib/trajectory/types";

export type SeasonGoalResult = "completed" | "substantially_progressed" | "partial" | "little_progress" | "not_started";

export type SeasonSummary = {
  id: number;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  state: "in_progress" | "reviewed" | "not_reviewed";
};

export type GoalSeasonResult = {
  id: number;
  area: string;
  title: string;
  target: number;
  startValue: number;
  endValue: number;
  startPercentage: number;
  endPercentage: number;
  movement: number;
  expectedEndPercentage: number;
  trajectoryStatus: TrajectoryStatus;
  result: SeasonGoalResult;
  evidence: { records: number; activeDays: number };
};

export type MetricSeasonSummary = { key: MetricKey; label: string; total: number };
export type AttentionSummary = { name: string; minutes: number; percentage: number };
export type WeeklyTrajectoryPoint = { label: string; startDate: string; endDate: string; score: number };
export type ConsistencySummary = { key: MetricKey; label: string; weeks: Array<{ label: string; value: number }> };
export type MilestoneSummary = { id: number; area: string; title: string; achievedAt: string };
export type JournalSummary = { id: number; content: string; entryDate: string };
export type WeeklyReviewSummary = { weekStart: string; weekEnd: string; primaryFocus: string; obstacles: string; lesson: string; completedAt: string | null };
export type SeasonReflection = { proudOf: string; changedMost: string; obstacles: string; lesson: string; carryForward: string; leaveBehind: string; completedAt: string | null };

export type SeasonReview = {
  season: SeasonSummary;
  trajectory: { startScore: number; endScore: number; change: number; expectedEndScore: number };
  goals: { all: GoalSeasonResult[]; completed: GoalSeasonResult[]; progressed: GoalSeasonResult[]; unfinished: GoalSeasonResult[] };
  metrics: MetricSeasonSummary[];
  attention: AttentionSummary[];
  weeklyTrend: WeeklyTrajectoryPoint[];
  consistency: ConsistencySummary[];
  movement: { most: GoalSeasonResult[]; least: GoalSeasonResult[] };
  milestones: MilestoneSummary[];
  journalHighlights: JournalSummary[];
  weeklyReviews: WeeklyReviewSummary[];
  reflection?: SeasonReflection;
};

export type SeasonReviewInputs = {
  season: Omit<SeasonSummary, "state">;
  state: SeasonSummary["state"];
  startScore: number;
  endScore: number;
  expectedEndScore: number;
  goals: Array<Omit<GoalSeasonResult, "result">>;
  metrics: MetricSeasonSummary[];
  attention: Array<{ name: string; minutes: number }>;
  weeklyTrend: WeeklyTrajectoryPoint[];
  consistency: ConsistencySummary[];
  milestones: MilestoneSummary[];
  journalHighlights: JournalSummary[];
  weeklyReviews: WeeklyReviewSummary[];
  reflection?: SeasonReflection;
};
