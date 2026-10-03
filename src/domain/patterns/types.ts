import type { MetricKey, Momentum } from "@/lib/trajectory/types";

export type PatternCategory = "consistency" | "attention" | "goal_progress" | "focus_alignment" | "correlation" | "recovery" | "seasonal" | "direction_alignment";
export type PatternConfidence = "insufficient_data" | "weak" | "moderate" | "strong";

export type PatternEvidence = {
  label: string;
  period?: { startDate: string; endDate: string };
  values: Array<{ label: string; value: string | number }>;
};

export type PatternObservation = {
  id: string;
  category: PatternCategory;
  title: string;
  statement: string;
  evidence: PatternEvidence[];
  sampleSize: number;
  confidence: PatternConfidence;
  timeWindow: string;
  firstObserved?: string;
  lastObserved?: string;
  relatedAreas?: string[];
  relatedMetrics?: MetricKey[];
  score: number;
};

export type GoalMovementSummary = {
  id: number;
  title: string;
  area: string;
  progressChange: number;
  movement: "completed" | "advanced" | "maintained" | "stalled" | "drifted";
  momentum: Momentum;
};

export type WeeklyPatternRecord = {
  weekStart: string;
  weekEnd: string;
  trajectoryStart: number;
  trajectoryEnd: number;
  trajectoryChange: number;
  metrics: Record<MetricKey, number>;
  deepWorkByArea: Record<string, number>;
  goalMovement: GoalMovementSummary[];
  primaryFocus?: string;
  secondaryFocus?: string;
  milestoneCount: number;
  mood?: { average: number; sampleSize: number };
};

export type SeasonPatternRecord = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  metrics: Record<MetricKey, number>;
  deepWorkByArea: Record<string, number>;
  goalAreas: string[];
  directionAreas: string[];
};

export type MoodDayRecord = { date: string; mood: number; workout: boolean };
export type GoalLineageRecord = { id: number; title: string; area: string; seasonName: string; seasonStart: string; progress: number; carriedFromGoalId: number | null; completed: boolean };

export type PatternDataset = {
  weeks: WeeklyPatternRecord[];
  seasons: SeasonPatternRecord[];
  moodDays: MoodDayRecord[];
  lineages: GoalLineageRecord[];
  availableAreas: string[];
  coverage: { totalWeeks: number; evidenceWeeks: number; completedReviews: number; moodDays: number; deepWorkWeeks: number };
};

export type PatternWindow = "4w" | "8w" | "12w" | "year" | "all";
