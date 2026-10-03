import { directionVersionAt } from "@/domain/direction/direction";
import type { DirectionVersion, Horizon } from "@/domain/direction/types";

export function resolveHistoricalDirection(versions: DirectionVersion[], seasonStartDate: string) {
  return directionVersionAt(versions, seasonStartDate);
}

export function horizonGoalSummary(goals: Array<{ status: string }>) {
  return { linked: goals.length, completed: goals.filter((goal) => goal.status === "completed").length, active: goals.filter((goal) => goal.status === "active").length };
}

export function currentHorizon(horizons: Horizon[], today: string) {
  return horizons.find((horizon) => horizon.status === "active" && (!horizon.startDate || horizon.startDate <= today) && (!horizon.endDate || horizon.endDate >= today));
}
