import { NextRequest, NextResponse } from "next/server";
import { saveSeasonReview, seasonReview, seasonReviewNavigation } from "@/lib/local-db";
import { apiError, date, number, text } from "@/lib/validation";

export const runtime = "nodejs";

function reflectionText(value: unknown, label: string) {
  const result = text(value ?? "", label, false);
  if (result.length > 2_000) throw new Error(`${label} must be 2,000 characters or fewer.`);
  return result;
}

function requestSeasonId(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("seasonId");
  return value === null ? undefined : number(value, "Season ID", { positive: true });
}

export async function GET(request: NextRequest) {
  try {
    const seasonId = requestSeasonId(request);
    const asOf = request.nextUrl.searchParams.get("asOfDate");
    return NextResponse.json({ review: seasonReview(seasonId, asOf ? date(asOf) : undefined), seasons: seasonReviewNavigation() });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const seasonId = number(body.seasonId, "Season ID", { positive: true });
    saveSeasonReview(seasonId, {
      proudOf: reflectionText(body.proudOf, "What you are proud of"),
      changedMost: reflectionText(body.changedMost, "What changed the most"),
      obstacles: reflectionText(body.obstacles, "What got in the way"),
      lesson: reflectionText(body.lesson, "What you learned"),
      carryForward: reflectionText(body.carryForward, "What to carry forward"),
      leaveBehind: reflectionText(body.leaveBehind, "What to leave behind"),
    }, body.complete === true);
    return NextResponse.json({ review: seasonReview(seasonId), seasons: seasonReviewNavigation() });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
