import "server-only";

import type { SeasonPlanInput } from "@/domain/season-planning/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Writes the first season through one database transaction. The RPC validates ownership using
 * auth.uid(), so a caller cannot direct its plan into another user's record.
 */
export async function completeOnboarding(
  supabase: SupabaseClient,
  plan: SeasonPlanInput,
): Promise<{ seasonId: string; alreadyCompleted: boolean }> {
  const { data, error } = await supabase.rpc("complete_onboarding", { input: plan });
  if (error) throw new Error("We couldn't start your season. Please try again.");
  const result = data as { season_id?: unknown; already_completed?: unknown } | null;
  if (!result || typeof result.season_id !== "string") throw new Error("Onboarding did not return a season.");
  return { seasonId: result.season_id, alreadyCompleted: result.already_completed === true };
}
