import type { GoalType, MetricKey, TrackingMode } from "@/lib/trajectory/types";

export type SeasonStatus = "draft" | "active" | "completed";
export type GoalImportance = "low" | "normal" | "high" | "critical";

export type SeasonIdentity = {
  name: string;
  theme: string;
  intention?: string;
  startDate: string;
  endDate: string;
};

export type SeasonAreaPlanInput = { area: string; outcome: string; priority?: number };

export type PlannedGoalInput = {
  title: string;
  area: string;
  target: number;
  goalType: GoalType;
  trackingMode: TrackingMode;
  metricKey?: MetricKey | null;
  deadline?: string;
  importance: GoalImportance;
  baselineValue?: number;
  carriedFromGoalId?: number | null;
};

export type CarryForwardLesson = { kind: "carry_forward" | "leave_behind" | "lesson"; content: string };

export type SeasonPlanInput = SeasonIdentity & {
  previousSeasonId?: number | null;
  areaPlans: SeasonAreaPlanInput[];
  goals: PlannedGoalInput[];
  lessons: CarryForwardLesson[];
};

export type UnfinishedGoal = {
  id: number;
  area: string;
  title: string;
  target: number;
  current: number;
  trackingMode: TrackingMode;
  metricKey: MetricKey | null;
  goalType: GoalType;
};
