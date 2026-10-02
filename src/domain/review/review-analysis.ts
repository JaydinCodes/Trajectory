import type { GoalProgress, TrajectoryStatus } from "../../lib/trajectory/types";
import type { GoalReview, ReviewInsight, WeeklyGoalMovement, WeeklyReviewAnalysis, WeeklyReviewInputs } from "./types";

const statusRank: Record<TrajectoryStatus, number> = { behind: 0, slightly_behind: 1, on_track: 2, ahead: 3, completed: 4 };
const round = (value: number) => Math.round(value * 10) / 10;

function classifyGoalMovement(start: GoalProgress, end: GoalProgress): WeeklyGoalMovement {
  const progressChange = end.actualPercentage - start.actualPercentage;
  const expectedChange = end.expectedPercentage - start.expectedPercentage;
  const meaningfulValueChange = Math.max(0.5, Number(end.target) * 0.005);
  const valueChange = end.current - start.current;
  const worsened = statusRank[end.trajectoryStatus] < statusRank[start.trajectoryStatus] || end.deltaPercentage - start.deltaPercentage <= -5;
  if (start.actualPercentage < 100 && end.actualPercentage >= 100) return "completed";
  if (worsened) return "drifted";
  if (valueChange >= meaningfulValueChange || progressChange >= 1) return "advanced";
  if (expectedChange > 1) return "stalled";
  return "maintained";
}

function reviewGoal(start: GoalProgress, end: GoalProgress): GoalReview {
  return {
    id: end.id,
    area: end.area,
    title: end.title,
    target: Number(end.target),
    startValue: round(start.current),
    endValue: round(end.current),
    startPercentage: round(start.actualPercentage),
    endPercentage: round(end.actualPercentage),
    progressChange: round(end.actualPercentage - start.actualPercentage),
    expectedChange: round(end.expectedPercentage - start.expectedPercentage),
    startStatus: start.trajectoryStatus,
    endStatus: end.trajectoryStatus,
    movement: classifyGoalMovement(start, end),
  };
}

function insights(goals: GoalReview[], evidence: WeeklyReviewInputs["evidence"], attention: WeeklyReviewAnalysis["attention"]): ReviewInsight[] {
  const result: ReviewInsight[] = [];
  for (const goal of goals) {
    if (goal.startStatus !== goal.endStatus && statusRank[goal.endStatus] > statusRank[goal.startStatus]) result.push({ kind: "movement", text: `${goal.area} moved from ${goal.startStatus.replace("_", " ")} to ${goal.endStatus.replace("_", " ")}.` });
    else if (goal.movement === "advanced") result.push({ kind: "movement", text: `${goal.area} gained ${Math.round(goal.progressChange)} percentage point${Math.round(goal.progressChange) === 1 ? "" : "s"} this week.` });
  }
  if (evidence.dsaProblems > 0) result.push({ kind: "evidence", text: `You completed ${evidence.dsaProblems} DSA problem${evidence.dsaProblems === 1 ? "" : "s"} this week.` });
  if (evidence.workouts > 0) result.push({ kind: "evidence", text: `You recorded ${evidence.workouts} workout${evidence.workouts === 1 ? "" : "s"} this week.` });
  if (evidence.bibleDays > 0) result.push({ kind: "evidence", text: `Bible reading was recorded on ${evidence.bibleDays} unique day${evidence.bibleDays === 1 ? "" : "s"}.` });
  const concentrated = attention.find((item) => item.percentage > 50);
  if (concentrated) result.push({ kind: "attention", text: `${concentrated.name} received ${Math.round(concentrated.percentage)}% of recorded deep-work time.` });
  return result.slice(0, 5);
}

/** Pure deterministic weekly analysis. Persistence and SQLite live outside this domain module. */
export function buildWeeklyReviewAnalysis(input: WeeklyReviewInputs): WeeklyReviewAnalysis {
  const starts = new Map(input.startGoals.map((goal) => [goal.id, goal]));
  const goals = input.endGoals.flatMap((end) => {
    const start = starts.get(end.id);
    return start ? [reviewGoal(start, end)] : [];
  });
  const minutes = input.attention.reduce((sum, item) => sum + item.minutes, 0);
  const attention = input.attention.filter((item) => item.minutes > 0).sort((a, b) => b.minutes - a.minutes).map((item) => ({ ...item, percentage: minutes ? round(item.minutes / minutes * 100) : 0 }));
  const priorFocusAttention = input.priorCommitment ? attention.filter((item) => input.priorCommitment?.toLocaleLowerCase().includes(item.name.toLocaleLowerCase())) : [];
  return {
    period: { ...input.range, label: input.label, state: input.state },
    trajectory: { startScore: Math.round(input.startScore), endScore: Math.round(input.endScore), change: Math.round(input.endScore - input.startScore) },
    goals: {
      all: goals,
      advanced: goals.filter((goal) => goal.movement === "advanced"),
      stalled: goals.filter((goal) => goal.movement === "stalled" || goal.movement === "drifted"),
      behind: goals.filter((goal) => goal.endStatus === "slightly_behind" || goal.endStatus === "behind"),
      completed: goals.filter((goal) => goal.movement === "completed"),
    },
    attention,
    evidence: input.evidence,
    previousWeek: input.previousWeek,
    milestones: input.milestones,
    journal: input.journal,
    highlights: insights(goals, input.evidence, attention),
    priorCommitment: input.priorCommitment,
    priorFocusAttention,
  };
}
