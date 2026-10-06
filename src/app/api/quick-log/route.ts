import { NextRequest, NextResponse } from "next/server";
import { addEntry, addFinance, addJournal, addMilestone, addRecord } from "@/lib/local-db";
import { apiError, date, number, text } from "@/lib/validation";
import { AuthenticationRequiredError, requireAuthenticatedUser } from "@/lib/supabase/server";
import { addQuickLog } from "@/data/supabase/activity-repository";

export const runtime = "nodejs";
type QuickKind = "Scripture" | "Workout" | "Deep Work" | "DSA" | "Tutoring Revenue" | "Finance" | "Journal" | "Milestone" | "Mood";
const kinds: QuickKind[] = ["Scripture", "Workout", "Deep Work", "DSA", "Tutoring Revenue", "Finance", "Journal", "Milestone", "Mood"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const kind = text(body.kind, "Log type") as QuickKind;
    if (!kinds.includes(kind)) throw new Error("Log type is not supported.");
    const detail = text(body.detail, "Detail");
    const entryDate = date(body.date);
    const project = text(body.project ?? "", "Project", false);
    const quantity = () => number(body.quantity, "Value", { positive: true });
    if (process.env.TRAJECTORY_DATA_BACKEND === "supabase" || process.env.VERCEL === "1") {
      const { supabase, userId } = await requireAuthenticatedUser();
      await addQuickLog(supabase, userId, { kind, detail, entryDate, quantity: kind === "Journal" || kind === "Milestone" ? undefined : quantity(), area: text(body.area ?? "", "Area", false) || undefined, project: project || undefined, platform: text(body.platform ?? "", "Platform", false) || undefined });
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    if (kind === "Scripture") addRecord("bible", { book: detail, minutes: quantity(), date: entryDate });
    if (kind === "Workout") addRecord("workout", { workoutType: detail, duration: quantity(), date: entryDate, exercises: [] });
    if (kind === "DSA") addRecord("coding", { problems: quantity(), category: detail, platform: text(body.platform ?? "", "Platform", false) || undefined, date: entryDate });
    if (kind === "Deep Work") addEntry("Deep work", detail, quantity(), entryDate, { area: text(body.area ?? "Career", "Area"), project: project || undefined, metricKey: "deep_work_minutes" });
    if (kind === "Tutoring Revenue") addFinance("income", detail, quantity(), entryDate, "", { area: "Odysseus", project: project || "Odysseus", metricKey: "tutoring_revenue" });
    if (kind === "Finance") addFinance("expense", detail, quantity(), entryDate, "", { area: text(body.area ?? "Finance", "Area") });
    if (kind === "Journal") addJournal("reflection", detail, entryDate);
    if (kind === "Milestone") addMilestone(text(body.area ?? "Personal", "Area"), detail, entryDate, "");
    if (kind === "Mood") { const value = number(body.quantity, "Mood", { min: 1 }); if (value > 10) throw new Error("Mood must be between 1 and 10."); addRecord("pulse", { mood: value, energy: value, stress: value, date: entryDate }); }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return NextResponse.json(apiError(error), { status: error instanceof AuthenticationRequiredError ? 401 : 400 }); }
}
