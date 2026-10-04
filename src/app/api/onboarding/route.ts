import { NextRequest, NextResponse } from "next/server";
import { completeOnboarding, onboardingStatus } from "@/lib/local-db";
import { apiError } from "@/lib/validation";
import { seasonPlanFrom } from "@/lib/season-plan-request";

export const runtime = "nodejs";
export async function GET() { return NextResponse.json(onboardingStatus()); }
export async function POST(request: NextRequest) {
  try { return NextResponse.json(completeOnboarding(seasonPlanFrom(await request.json() as Record<string, unknown>))); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
