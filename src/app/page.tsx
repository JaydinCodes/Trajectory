import { redirect } from "next/navigation";
import { TodayDashboard } from "@/components/today-dashboard";
import { onboardingStatus } from "@/lib/local-db";
import { isLocalPersistenceAvailable } from "@/lib/runtime";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const useSupabase = process.env.TRAJECTORY_DATA_BACKEND === "supabase" || process.env.VERCEL === "1";
  if (useSupabase) {
    const supabase = await createSupabaseClient();
    const { data } = await supabase.auth.getClaims();
    if (typeof data?.claims?.sub !== "string") redirect("/auth/login");
    const { data: settings, error } = await supabase.from("user_settings").select("onboarding_completed").maybeSingle();
    if (error) throw error;
    if (!settings?.onboarding_completed) redirect("/onboarding");
  } else {
    if (!isLocalPersistenceAvailable()) redirect("/auth/login");
    if (!onboardingStatus().completed) redirect("/onboarding");
  }
  return <TodayDashboard />;
}
