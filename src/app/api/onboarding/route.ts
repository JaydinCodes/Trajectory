import { NextRequest, NextResponse } from "next/server";
import { completeOnboarding, onboardingStatus } from "@/lib/local-db";
import { apiError } from "@/lib/validation";
import { seasonPlanFrom } from "@/lib/season-plan-request";
import { PersistenceUnavailableError } from "@/lib/runtime";

export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.json(onboardingStatus()); }
  catch (error) { return NextResponse.json(apiError(error), { status: error instanceof PersistenceUnavailableError ? 503 : 500 }); }
}
export async function POST(request: NextRequest) {
  try { return NextResponse.json(completeOnboarding(seasonPlanFrom(await request.json() as Record<string, unknown>))); }
  catch (error) { return NextResponse.json(apiError(error), { status: error instanceof PersistenceUnavailableError ? 503 : 400 }); }
}
