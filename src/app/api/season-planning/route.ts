import { NextRequest, NextResponse } from "next/server";
import { activateSeasonPlan, createSeasonPlan, seasonPlanningContext, updateSeasonPlan } from "@/lib/local-db";
import { apiError, date, goalType, metric, number, text, trackingMode } from "@/lib/validation";
import type { GoalImportance, SeasonPlanInput } from "@/domain/season-planning/types";

export const runtime = "nodejs";

const importance = (value: unknown): GoalImportance => {
  if (value === "low" || value === "normal" || value === "high" || value === "critical") return value;
  throw new Error("Goal importance is not supported.");
};

function planFrom(body: Record<string, unknown>): SeasonPlanInput {
  const startDate = date(body.startDate);
  const endDate = date(body.endDate);
  const areaPlans = Array.isArray(body.areaPlans) ? body.areaPlans.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Area plan is invalid.");
    const item = value as Record<string, unknown>;
    return { area: text(item.area, "Area"), outcome: text(item.outcome ?? "", "Outcome", false), priority: item.priority === undefined ? undefined : number(item.priority, "Area priority", { positive: true }) };
  }) : [];
  const goals = Array.isArray(body.goals) ? body.goals.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Goal is invalid.");
    const item = value as Record<string, unknown>;
    const mode = trackingMode(item.trackingMode);
    const metricKey = metric(item.metricKey);
    return { title: text(item.title, "Goal title"), area: text(item.area, "Goal area"), target: number(item.target, "Goal target", { positive: true }), goalType: goalType(item.goalType), trackingMode: mode, metricKey, deadline: item.deadline === undefined || item.deadline === null || item.deadline === "" ? undefined : date(item.deadline), importance: importance(item.importance ?? "normal"), baselineValue: item.baselineValue === undefined || item.baselineValue === null || item.baselineValue === "" ? undefined : number(item.baselineValue, "Goal baseline", { min: 0 }), carriedFromGoalId: item.carriedFromGoalId === undefined || item.carriedFromGoalId === null ? null : number(item.carriedFromGoalId, "Carried goal ID", { positive: true }) };
  }) : [];
  const lessons = Array.isArray(body.lessons) ? body.lessons.map((value) => {
    if (!value || typeof value !== "object") throw new Error("Lesson is invalid.");
    const item = value as Record<string, unknown>;
    const kind = item.kind;
    if (kind !== "carry_forward" && kind !== "leave_behind" && kind !== "lesson") throw new Error("Lesson type is invalid.");
    return { kind, content: text(item.content ?? "", "Lesson", false) };
  }) : [];
  return { name: text(body.name, "Season name"), theme: text(body.theme, "Season theme"), intention: text(body.intention ?? "", "Season intention", false), startDate, endDate, previousSeasonId: body.previousSeasonId === undefined || body.previousSeasonId === null ? null : number(body.previousSeasonId, "Previous season ID", { positive: true }), areaPlans, goals, lessons };
}

export async function GET(request: NextRequest) {
  try {
    const value = request.nextUrl.searchParams.get("previousSeasonId");
    return NextResponse.json(seasonPlanningContext(value === null ? undefined : number(value, "Previous season ID", { positive: true })));
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function POST(request: NextRequest) {
  try {
    const seasonId = createSeasonPlan(planFrom(await request.json() as Record<string, unknown>));
    return NextResponse.json({ seasonId }, { status: 201 });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const seasonId = number(body.seasonId, "Season ID", { positive: true });
    updateSeasonPlan(seasonId, planFrom(body));
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    activateSeasonPlan(number(body.seasonId, "Season ID", { positive: true }));
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
