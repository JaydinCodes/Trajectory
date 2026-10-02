import type { SeasonStatus } from "@/domain/season-planning/types";
import type { MetricKey } from "@/lib/trajectory/types";

export type HistoryMetric = { key: MetricKey; label: string; total: number };
export type HistoryMilestone = { id: number; area: string; title: string; achievedAt: string };

export type SeasonTimelineItem = {
  season: { id: number; name: string; theme: string; intention: string | null; startDate: string; endDate: string };
  status: SeasonStatus;
  trajectory: { start: number; end: number; change: number };
  goals: { total: number; completed: number; carriedForward: number };
  metrics: HistoryMetric[];
  milestones: HistoryMilestone[];
  review?: { lesson: string; carryForward: string; leaveBehind: string; completedAt: string };
  dominantAttention: Array<{ name: string; minutes: number; percentage: number }>;
  nextSeason?: { id: number; name: string; theme: string };
};

export type LifeTimeline = { seasons: SeasonTimelineItem[]; years: Array<{ year: number; seasons: SeasonTimelineItem[] }> };

export type HistoricalDate = {
  date: string;
  season: { id: number; name: string; theme: string } | null;
  trajectory: { score: number; expected: number; projected: number } | null;
  goals: Array<{ id: number; area: string; title: string; current: number; target: number; percentage: number }>;
  metrics: HistoryMetric[];
};

export type SeasonComparison = {
  left: { id: number; name: string; theme: string; trajectoryEnd: number; goalsCompleted: number; areasActive: number; milestones: number; metrics: HistoryMetric[] };
  right: { id: number; name: string; theme: string; trajectoryEnd: number; goalsCompleted: number; areasActive: number; milestones: number; metrics: HistoryMetric[] };
};

export type GoalJourneyItem = { id: number; seasonId: number; seasonName: string; seasonStartDate: string; title: string; area: string; current: number; target: number; percentage: number; status: string };
export type AreaHistoryItem = { seasonId: number; seasonName: string; startDate: string; status: SeasonStatus; goals: Array<{ id: number; title: string; current: number; target: number; percentage: number }>; metrics: HistoryMetric[]; milestones: HistoryMilestone[] };
