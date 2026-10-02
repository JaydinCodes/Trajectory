import type { GoalSeasonResult, SeasonGoalResult, SeasonReview, SeasonReviewInputs } from "./types";

const round = (value: number) => Math.round(value * 10) / 10;

/** Classifies only recorded movement; it deliberately makes no judgement about the person or the goal. */
export function classifySeasonGoal(startPercentage: number, endPercentage: number): SeasonGoalResult {
  const movement = endPercentage - startPercentage;
  if (endPercentage >= 100) return "completed";
  if (movement >= 25) return "substantially_progressed";
  if (movement >= 5) return "partial";
  if (movement > 0) return "little_progress";
  return "not_started";
}

function movementGroups(goals: GoalSeasonResult[]) {
  const moved = goals.filter((goal) => goal.movement > 0);
  const mostMovement = moved.length ? Math.max(...moved.map((goal) => goal.movement)) : null;
  const leastMovement = moved.length ? Math.min(...moved.map((goal) => goal.movement)) : null;
  return {
    most: mostMovement === null ? [] : moved.filter((goal) => goal.movement === mostMovement),
    least: leastMovement === null ? [] : moved.filter((goal) => goal.movement === leastMovement),
  };
}

/** Pure deterministic assembly of a season review. Data access and trajectory calculation stay outside this module. */
export function buildSeasonReview(input: SeasonReviewInputs): SeasonReview {
  const totalMinutes = input.attention.reduce((sum, item) => sum + item.minutes, 0);
  const goals = input.goals.map((goal) => ({ ...goal, movement: round(goal.movement), result: classifySeasonGoal(goal.startPercentage, goal.endPercentage) }));
  return {
    season: { ...input.season, state: input.state },
    trajectory: { startScore: Math.round(input.startScore), endScore: Math.round(input.endScore), change: Math.round(input.endScore - input.startScore), expectedEndScore: Math.round(input.expectedEndScore) },
    goals: {
      all: goals,
      completed: goals.filter((goal) => goal.result === "completed"),
      progressed: goals.filter((goal) => goal.result === "substantially_progressed" || goal.result === "partial" || goal.result === "little_progress"),
      unfinished: goals.filter((goal) => goal.result !== "completed"),
    },
    metrics: input.metrics.filter((metric) => metric.total > 0),
    attention: input.attention.filter((item) => item.minutes > 0).sort((left, right) => right.minutes - left.minutes).map((item) => ({ ...item, percentage: totalMinutes ? round(item.minutes / totalMinutes * 100) : 0 })),
    weeklyTrend: input.weeklyTrend,
    consistency: input.consistency,
    movement: movementGroups(goals),
    milestones: input.milestones,
    journalHighlights: input.journalHighlights,
    weeklyReviews: input.weeklyReviews,
    reflection: input.reflection,
  };
}
