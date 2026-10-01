import { daysBetweenInclusive, isDateOnly } from "../date-time";
import type { Goal, GoalProgress, Momentum, Season, TrajectoryStatus } from "./types";

const finitePositive = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
export function calculateGoalProgress(current: number, target: number): number { return finitePositive(target) === 0 ? 0 : Math.max(0, Math.min((Math.max(0, current) / target) * 100, 100)); }
export function calculateExpectedProgress(target: number, elapsedDays: number, totalDays: number): number { return finitePositive(target) * Math.max(0, Math.min(elapsedDays / finitePositive(totalDays), 1)); }
export function calculateExpectedPercentage(elapsedDays: number, totalDays: number): number { return finitePositive(totalDays) === 0 ? 0 : Math.max(0, Math.min((elapsedDays / totalDays) * 100, 100)); }
export function calculateTrajectoryStatus(actualPercentage: number, expectedPercentage: number): TrajectoryStatus {
  if (actualPercentage >= 100) return "completed";
  const delta = actualPercentage - expectedPercentage;
  if (delta >= 5) return "ahead";
  if (delta >= -5) return "on_track";
  if (delta >= -15) return "slightly_behind";
  return "behind";
}
export function calculateProjection(current: number, elapsedDays: number, totalDays: number): number { return finitePositive(elapsedDays) === 0 ? 0 : Math.max(0, current) / elapsedDays * finitePositive(totalDays); }
export function calculateSeasonProgress(season: Season, today: string): { elapsedDays: number; totalDays: number } {
  if (!isDateOnly(today) || !isDateOnly(season.start_date) || !isDateOnly(season.end_date)) return { elapsedDays: 0, totalDays: 0 };
  const totalDays = Math.max(daysBetweenInclusive(season.start_date, season.end_date), 0);
  if (today < season.start_date) return { elapsedDays: 0, totalDays };
  return { elapsedDays: Math.min(daysBetweenInclusive(season.start_date, today), totalDays), totalDays };
}
export function calculateGoalTrajectory(goal: Goal, season: Season, today: string, derivedValue?: number): GoalProgress {
  const current = goal.tracking_mode === "derived" && goal.metric_key ? Math.max(0, derivedValue ?? 0) : Math.max(0, Number(goal.current_value));
  const { elapsedDays, totalDays } = calculateSeasonProgress(season, today);
  const actualPercentage = calculateGoalProgress(current, Number(goal.target));
  const expectedValue = calculateExpectedProgress(Number(goal.target), elapsedDays, totalDays);
  const expectedPercentage = calculateExpectedPercentage(elapsedDays, totalDays);
  const projectedValue = calculateProjection(current, elapsedDays, totalDays);
  return { ...goal, current, actualPercentage, expectedPercentage, expectedValue, deltaPercentage: actualPercentage - expectedPercentage, projectedValue, projectedPercentage: calculateGoalProgress(projectedValue, Number(goal.target)), trajectoryStatus: calculateTrajectoryStatus(actualPercentage, expectedPercentage) };
}
export function calculateAreaScore(goals: Array<Pick<GoalProgress, "actualPercentage" | "weight">>) { const weights = goals.reduce((total, goal) => total + finitePositive(goal.weight), 0); return weights === 0 ? 0 : goals.reduce((total, goal) => total + goal.actualPercentage * finitePositive(goal.weight), 0) / weights; }
export function calculateExpectedAreaScore(goals: Array<Pick<GoalProgress, "expectedPercentage" | "weight">>) { const weights = goals.reduce((total, goal) => total + finitePositive(goal.weight), 0); return weights === 0 ? 0 : goals.reduce((total, goal) => total + goal.expectedPercentage * finitePositive(goal.weight), 0) / weights; }
export function calculateOverallScore(areas: Array<{ score: number; weight: number }>) { const weights = areas.reduce((total, area) => total + finitePositive(area.weight), 0); return weights === 0 ? 0 : areas.reduce((total, area) => total + Math.max(0, area.score) * finitePositive(area.weight), 0) / weights; }
export function calculateMomentum(recent: number[], previous: number[]): Momentum { const latest = recent.reduce((sum, value) => sum + Math.max(0, value), 0); const prior = previous.reduce((sum, value) => sum + Math.max(0, value), 0); if (recent.length === 0 || previous.length === 0 || latest + prior === 0) return "insufficient_data"; if (latest === 0) return "stalled"; if (latest > prior * 1.15) return "accelerating"; if (latest < prior * .85) return "slowing"; return "steady"; }
