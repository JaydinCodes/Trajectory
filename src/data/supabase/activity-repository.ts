import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type QuickLogInput = {
  kind: "Scripture" | "Workout" | "Deep Work" | "DSA" | "Tutoring Revenue" | "Finance" | "Journal" | "Milestone" | "Mood";
  detail: string;
  entryDate: string;
  quantity?: number;
  area?: string;
  project?: string;
  platform?: string;
};

function assertWrite(error: { message: string } | null) {
  if (error) throw new Error("We couldn't save that entry. Please try again.");
}

/** Persists raw evidence only. Derived totals and trajectory formulas remain in domain services. */
export async function addQuickLog(supabase: SupabaseClient, userId: string, input: QuickLogInput) {
  const quantity = input.quantity;
  switch (input.kind) {
    case "Scripture":
      assertWrite((await supabase.from("bible_entries").insert({ user_id: userId, book: input.detail, minutes: quantity, entry_date: input.entryDate })).error);
      return;
    case "Workout":
      assertWrite((await supabase.from("workouts").insert({ user_id: userId, workout_type: input.detail, duration: quantity, entry_date: input.entryDate })).error);
      return;
    case "DSA":
      assertWrite((await supabase.from("coding_entries").insert({ user_id: userId, problems: quantity, category: input.detail, platform: input.platform || null, entry_date: input.entryDate })).error);
      return;
    case "Deep Work":
      assertWrite((await supabase.from("entries").insert({ user_id: userId, type: "Deep work", detail: input.detail, amount: quantity, entry_date: input.entryDate, area: input.area || "Career", project: input.project || null, metric_key: "deep_work_minutes" })).error);
      return;
    case "Tutoring Revenue":
      assertWrite((await supabase.from("financial_entries").insert({ user_id: userId, kind: "income", category: input.detail, amount: quantity, entry_date: input.entryDate, note: "", area: "Odysseus", project: input.project || "Odysseus", metric_key: "tutoring_revenue" })).error);
      return;
    case "Finance":
      assertWrite((await supabase.from("financial_entries").insert({ user_id: userId, kind: "expense", category: input.detail, amount: quantity, entry_date: input.entryDate, note: "", area: input.area || "Finance" })).error);
      return;
    case "Journal":
      assertWrite((await supabase.from("journal").insert({ user_id: userId, entry_type: "reflection", content: input.detail, entry_date: input.entryDate })).error);
      return;
    case "Milestone":
      assertWrite((await supabase.from("milestones").insert({ user_id: userId, area: input.area || "Personal", title: input.detail, achieved_at: input.entryDate, note: "" })).error);
      return;
    case "Mood":
      assertWrite((await supabase.from("daily_pulse").upsert({ user_id: userId, entry_date: input.entryDate, mood: quantity, energy: quantity, stress: quantity }, { onConflict: "user_id,entry_date" })).error);
      return;
  }
}
