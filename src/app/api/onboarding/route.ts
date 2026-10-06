import { NextRequest, NextResponse } from "next/server";
import { completeOnboarding, onboardingStatus } from "@/lib/local-db";
import { apiError } from "@/lib/validation";
import { seasonPlanFrom } from "@/lib/season-plan-request";
import { PersistenceUnavailableError } from "@/lib/runtime";
import { AuthenticationRequiredError, requireAuthenticatedUser } from "@/lib/supabase/server";
import { completeOnboarding as completeSupabaseOnboarding } from "@/data/supabase/onboarding-repository";

export const runtime = "nodejs";
export async function GET() {
  try {
    if (process.env.TRAJECTORY_DATA_BACKEND === "supabase" || process.env.VERCEL === "1") {
      const { supabase } = await requireAuthenticatedUser();
      const { data, error } = await supabase.from("user_settings").select("onboarding_completed").maybeSingle();
      if (error) throw error;
      return NextResponse.json({ completed: data?.onboarding_completed === true });
    }
    return NextResponse.json(onboardingStatus());
  } catch (error) { return NextResponse.json(apiError(error), { status: error instanceof AuthenticationRequiredError ? 401 : error instanceof PersistenceUnavailableError ? 503 : 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const plan = seasonPlanFrom(await request.json() as Record<string, unknown>);
    if (process.env.TRAJECTORY_DATA_BACKEND === "supabase" || process.env.VERCEL === "1") {
      const { supabase } = await requireAuthenticatedUser();
      return NextResponse.json(await completeSupabaseOnboarding(supabase, plan));
    }
    return NextResponse.json(completeOnboarding(plan));
  } catch (error) { return NextResponse.json(apiError(error), { status: error instanceof AuthenticationRequiredError ? 401 : error instanceof PersistenceUnavailableError ? 503 : 400 }); }
}
