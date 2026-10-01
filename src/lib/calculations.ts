import { calculateAreaScore as scoreArea, calculateExpectedProgress, calculateGoalProgress, calculateMomentum as trajectoryMomentum, calculateProjection, calculateTrajectoryStatus as calculateTrajectoryStatusPercentage } from "./trajectory";
export type { TrajectoryStatus } from "./trajectory/types";
export { calculateExpectedProgress, calculateGoalProgress, calculateProjection };
/** @deprecated Use the percentage based calculateTrajectoryStatus from lib/trajectory. */
export function calculateTrajectoryStatus(current: number, target: number, elapsedDays: number, totalDays: number) { return calculateTrajectoryStatusPercentage(calculateGoalProgress(current, target), totalDays ? elapsedDays / totalDays * 100 : 0); }
export function calculateStreak(days: boolean[]) { let count=0; for(const done of [...days].reverse()){if(!done) break;count++;} return count; }
export function calculateMomentum(values:number[]): "accelerating"|"steady"|"slowing"|"stalled" { const split=Math.floor(values.length/2); const result=trajectoryMomentum(values.slice(split),values.slice(0,split)); return result === "insufficient_data" ? "steady" : result; }
export function calculateAreaScore(goals:Array<{current:number;target:number;weight:number}>){return scoreArea(goals.map(goal => ({ actualPercentage: calculateGoalProgress(goal.current, goal.target), weight: goal.weight })));}
