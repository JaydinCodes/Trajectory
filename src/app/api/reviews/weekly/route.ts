import { NextRequest, NextResponse } from "next/server";
import { saveWeeklyReview, weeklyReview } from "@/lib/local-db";
import { apiError, date, text } from "@/lib/validation";
import { localDate } from "@/lib/date-time";

export const runtime = "nodejs";

function reviewText(value: unknown, label: string) {
  const result = text(value ?? "", label, false);
  if (result.length > 2_000) throw new Error(`${label} must be 2,000 characters or fewer.`);
  return result;
}

function requestedDate(request: NextRequest) {
  const value = date(request.nextUrl.searchParams.get("date") ?? localDate());
  if (value > localDate()) throw new Error("Future weekly reviews are not available.");
  return value;
}

export async function GET(request: NextRequest) {
  try { return NextResponse.json(weeklyReview(requestedDate(request))); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const reviewDate = date(body.date ?? localDate());
    if (reviewDate > localDate()) throw new Error("Future weekly reviews cannot be saved.");
    saveWeeklyReview(reviewDate, {
      proudOf: reviewText(body.proudOf, "What you are proud of"),
      gotInWay: reviewText(body.gotInWay, "What got in the way"),
      lesson: reviewText(body.lesson, "What you learned"),
      nextPrimaryFocus: reviewText(body.nextPrimaryFocus, "Primary focus"),
      nextSecondaryFocus: reviewText(body.nextSecondaryFocus, "Secondary focus"),
    }, body.complete === true);
    return NextResponse.json(weeklyReview(reviewDate));
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
