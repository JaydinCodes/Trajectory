import { calculateAreaScore, calculateExpectedAreaScore, calculateGoalTrajectory, calculateMomentum, calculateOverallScore } from "../lib/trajectory";
import type { Goal, MetricKey, Season } from "../lib/trajectory/types";

type Inputs = { goals: Goal[]; season: Season; today: string; metrics: Record<MetricKey, number>; dailyValues: (metric: MetricKey, start: string, end: string) => number[] };
const dateOffset = (today: string, offset: number) => { const value = new Date(`${today}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`; };

export function calculateTrajectorySnapshot({ goals, season, today, metrics, dailyValues }: Inputs) {
  const progressedGoals = goals.map((goal) => calculateGoalTrajectory(goal, season, today, goal.metric_key ? metrics[goal.metric_key] : undefined));
  const byArea = Object.entries(progressedGoals.reduce<Record<string, typeof progressedGoals>>((all, goal) => { (all[goal.area] ??= []).push(goal); return all; }, {}));
  const areas = byArea.map(([area, items]) => {
    const current = items.flatMap((goal) => goal.metric_key ? dailyValues(goal.metric_key, dateOffset(today, -6), today) : []);
    const previous = items.flatMap((goal) => goal.metric_key ? dailyValues(goal.metric_key, dateOffset(today, -13), dateOffset(today, -7)) : []);
    const score = calculateAreaScore(items);
    const expected = calculateExpectedAreaScore(items);
    return { area, score: Math.round(score), expected: Math.round(expected), delta: Math.round(score - expected), momentum: calculateMomentum(current, previous), weight: items.reduce((sum, item) => sum + Number(item.weight), 0) };
  });
  const score = calculateOverallScore(areas);
  const expected = calculateOverallScore(areas.map((area) => ({ ...area, score: area.expected })));
  const totalWeight = progressedGoals.reduce((sum, goal) => sum + Number(goal.weight), 0);
  const projected = totalWeight ? progressedGoals.reduce((sum, goal) => sum + goal.projectedPercentage * Number(goal.weight), 0) / totalWeight : 0;
  return { goals: progressedGoals, areas, score: Math.round(score), expected: Math.round(expected), delta: Math.round(score - expected), projected: Math.round(Math.min(projected, 100)) };
}
