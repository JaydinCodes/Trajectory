import type { GoalProgress, TrajectoryStatus } from "../../lib/trajectory/types";

export type WeekRange = { startDate: string; endDate: string };

export type WeeklyGoalMovement = "completed" | "advanced" | "maintained" | "stalled" | "drifted";

export type GoalReview = {
  id: number;
  area: string;
  title: string;
  target: number;
  startValue: number;
  endValue: number;
  startPercentage: number;
  endPercentage: number;
  progressChange: number;
  expectedChange: number;
  startStatus: TrajectoryStatus;
  endStatus: TrajectoryStatus;
  movement: WeeklyGoalMovement;
};

export type AttentionSummary = { name: string; minutes: number; percentage: number };

export type EvidenceSummary = {
  bibleDays: number;
  workouts: number;
  dsaProblems: number;
  deepWorkMinutes: number;
  tutoringRevenue: number;
  records: number;
};

export type MilestoneSummary = { id: number; area: string; title: string; achievedAt: string };
export type JournalExcerpt = { id: number; content: string; entryDate: string };
export type ReviewInsight = { kind: "movement" | "evidence" | "attention"; text: string };

export type WeeklyReflection = {
  proudOf: string;
  gotInWay: string;
  lesson: string;
  nextPrimaryFocus: string;
  nextSecondaryFocus: string;
  completedAt: string | null;
};

export type WeeklyReviewAnalysis = {
  period: WeekRange & { label: string; state: "in_progress" | "complete" | "not_reviewed" };
  trajectory: { startScore: number; endScore: number; change: number };
  goals: { all: GoalReview[]; advanced: GoalReview[]; stalled: GoalReview[]; behind: GoalReview[]; completed: GoalReview[] };
  attention: AttentionSummary[];
  evidence: EvidenceSummary;
  previousWeek: EvidenceSummary;
  milestones: MilestoneSummary[];
  journal: JournalExcerpt[];
  highlights: ReviewInsight[];
  priorCommitment?: string;
  priorFocusAttention: AttentionSummary[];
};

export type WeeklyReviewInputs = {
  range: WeekRange;
  label: string;
  startGoals: GoalProgress[];
  endGoals: GoalProgress[];
  startScore: number;
  endScore: number;
  attention: Array<{ name: string; minutes: number }>;
  evidence: EvidenceSummary;
  previousWeek: EvidenceSummary;
  milestones: MilestoneSummary[];
  journal: JournalExcerpt[];
  state: "in_progress" | "complete" | "not_reviewed";
  priorCommitment?: string;
};
