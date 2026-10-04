import { NextRequest, NextResponse } from "next/server";
import { activateSeasonPlan, createSeasonPlan, seasonPlanningContext, updateSeasonPlan } from "@/lib/local-db";
import { apiError, number } from "@/lib/validation";
import { seasonPlanFrom } from "@/lib/season-plan-request";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try { const value = request.nextUrl.searchParams.get("previousSeasonId"); return NextResponse.json(seasonPlanningContext(value === null ? undefined : number(value, "Previous season ID", { positive: true }))); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
export async function POST(request: NextRequest) {
  try { return NextResponse.json({ seasonId: createSeasonPlan(seasonPlanFrom(await request.json() as Record<string, unknown>)) }, { status: 201 }); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
export async function PATCH(request: NextRequest) {
  try { const body = await request.json() as Record<string, unknown>; updateSeasonPlan(number(body.seasonId, "Season ID", { positive: true }), seasonPlanFrom(body)); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
export async function PUT(request: NextRequest) {
  try { const body = await request.json() as Record<string, unknown>; activateSeasonPlan(number(body.seasonId, "Season ID", { positive: true })); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
