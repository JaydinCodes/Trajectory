import { NextRequest, NextResponse } from "next/server";
import { establishedPatterns, saveSeasonReview, seasonReview, seasonReviewNavigation } from "@/lib/local-db";
import { apiError, date, number, text } from "@/lib/validation";
import { localDate } from "@/lib/date-time";

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
    const review = seasonReview(seasonId, asOf ? date(asOf) : undefined);
    const patternDate = review.season.endDate < localDate() ? review.season.endDate : localDate();
    const areas = new Set(review.goals.all.map((goal) => goal.area));
    const patterns = establishedPatterns(patternDate).filter((pattern) => pattern.relatedAreas?.some((area) => areas.has(area))).slice(0, 1);
    return NextResponse.json({ review, seasons: seasonReviewNavigation(), patterns });
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
    const review = seasonReview(seasonId); const areas = new Set(review.goals.all.map((goal) => goal.area));
    return NextResponse.json({ review, seasons: seasonReviewNavigation(), patterns: establishedPatterns().filter((pattern) => pattern.relatedAreas?.some((area) => areas.has(area))).slice(0, 1) });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
