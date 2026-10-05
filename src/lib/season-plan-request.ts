import type { GoalImportance, SeasonPlanInput } from "@/domain/season-planning/types";
import { apiError, date, goalType, metric, number, text, trackingMode } from "@/lib/validation";
import { isLifeArea } from "@/lib/areas";

const area = (value: unknown, label: string) => {
  const parsed = text(value, label);
  if (!isLifeArea(parsed)) throw new Error(`${label} is not a supported life area.`);
  return parsed;
};

const importance = (value: unknown): GoalImportance => {
  if (value === "low" || value === "normal" || value === "high" || value === "critical") return value;
  throw new Error("Goal importance is not supported.");
};

/** Parses and validates untrusted season-plan request bodies before domain services see them. */
export function seasonPlanFrom(body: Record<string, unknown>): SeasonPlanInput {
  const startDate = date(body.startDate); const endDate = date(body.endDate);
  const areaPlans = Array.isArray(body.areaPlans) ? body.areaPlans.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Area plan is invalid.");
    const item = value as Record<string, unknown>;
    return { area: area(item.area, "Area"), outcome: text(item.outcome ?? "", "Outcome", false), priority: item.priority === undefined ? undefined : number(item.priority, "Area priority", { positive: true }) };
  }) : [];
  const goals = Array.isArray(body.goals) ? body.goals.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Goal is invalid.");
    const item = value as Record<string, unknown>; const mode = trackingMode(item.trackingMode); const metricKey = metric(item.metricKey);
    const directionId = item.directionId === undefined || item.directionId === null || item.directionId === "" ? null : number(item.directionId, "Direction ID", { positive: true }); const horizonId = item.horizonId === undefined || item.horizonId === null || item.horizonId === "" ? null : number(item.horizonId, "Horizon ID", { positive: true });
    if (horizonId && !directionId) throw new Error("A horizon requires a direction.");
    return { title: text(item.title, "Goal title"), area: area(item.area, "Goal area"), target: number(item.target, "Goal target", { positive: true }), goalType: goalType(item.goalType), trackingMode: mode, metricKey, deadline: item.deadline === undefined || item.deadline === null || item.deadline === "" ? undefined : date(item.deadline), importance: importance(item.importance ?? "normal"), baselineValue: item.baselineValue === undefined || item.baselineValue === null || item.baselineValue === "" ? undefined : number(item.baselineValue, "Goal baseline", { min: 0 }), carriedFromGoalId: item.carriedFromGoalId === undefined || item.carriedFromGoalId === null ? null : number(item.carriedFromGoalId, "Carried goal ID", { positive: true }), directionId, horizonId };
  }) : [];
  const lessons: SeasonPlanInput["lessons"] = Array.isArray(body.lessons) ? body.lessons.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Lesson is invalid."); const item = value as Record<string, unknown>; const kind = item.kind;
    if (kind !== "carry_forward" && kind !== "leave_behind" && kind !== "lesson") throw new Error("Lesson type is invalid.");
    return { kind, content: text(item.content ?? "", "Lesson", false) };
  }) : [];
  return { name: text(body.name, "Season name"), theme: text(body.theme, "Season theme"), intention: text(body.intention ?? "", "Season intention", false), startDate, endDate, previousSeasonId: body.previousSeasonId === undefined || body.previousSeasonId === null ? null : number(body.previousSeasonId, "Previous season ID", { positive: true }), areaPlans, goals, lessons };
}
