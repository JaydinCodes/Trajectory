/**
 * Explicit one-time importer. It is deliberately not part of application startup.
 *
 * Required: SUPABASE_MIGRATION_USER_ID, SUPABASE_SERVICE_ROLE_KEY and the two public
 * Supabase settings. Start with `npm run migrate:supabase -- --dry-run`.
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const databasePath = process.env.TRAJECTORY_DB_PATH || path.join(process.cwd(), "data", "trajectory.db");
const userId = process.env.SUPABASE_MIGRATION_USER_ID;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!userId || !url || !serviceRoleKey) {
  throw new Error("SUPABASE_MIGRATION_USER_ID, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const sqlite = new DatabaseSync(databasePath, { readOnly: true });
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const tableExists = (name) => Boolean(sqlite.prepare("select 1 from sqlite_master where type='table' and name=?").get(name));
const rows = (name) => tableExists(name) ? sqlite.prepare(`select * from ${name}`).all() : [];
const sourceTables = ["seasons", "goals", "goal_updates", "goal_evidence", "entries", "journal", "financial_entries", "budgets", "milestones", "bible_entries", "workouts", "workout_exercises", "coding_entries", "daily_pulse", "weekly_reviews", "season_reviews", "season_area_plans", "season_planning_lessons", "life_directions", "direction_versions", "horizons", "horizon_outcomes"];
const counts = Object.fromEntries(sourceTables.map((table) => [table, rows(table).length]));
const monthNumber = new Map([["january", "01"], ["february", "02"], ["march", "03"], ["april", "04"], ["may", "05"], ["june", "06"], ["july", "07"], ["august", "08"], ["september", "09"], ["october", "10"], ["november", "11"], ["december", "12"]]);
function monthDate(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return value;
  const [name, year] = String(value).trim().split(/\s+/);
  const month = monthNumber.get(name?.toLowerCase());
  if (!month || !/^\d{4}$/.test(year ?? "")) throw new Error(`Unsupported historic month: ${value}`);
  return `${year}-${month}-01`;
}

console.table(counts);
console.log(`Target user: ${userId}`);
console.log(`Source database: ${databasePath}`);

const demoData = rows("seasons").some((season) => String(season.theme ?? "").startsWith("Demo"));
if (demoData && !args.has("--allow-demo")) {
  throw new Error("Demo fixture records were detected. Review the source and rerun with --allow-demo only if that is intentional.");
}
if (dryRun) {
  console.log("Dry run complete. No Supabase rows were written.");
  process.exit(0);
}

const { data: targetUser, error: targetUserError } = await supabase.auth.admin.getUserById(userId);
if (targetUserError || !targetUser.user) throw new Error("The requested migration user does not exist in this Supabase project.");

const maps = new Map();
async function mapped(sourceTable, legacyId) {
  const key = `${sourceTable}:${legacyId}`;
  if (maps.has(key)) return maps.get(key);
  const { data, error } = await supabase.from("legacy_import_map").select("target_id").eq("user_id", userId).eq("source_table", sourceTable).eq("legacy_id", String(legacyId)).maybeSingle();
  if (error) throw error;
  if (data?.target_id) maps.set(key, data.target_id);
  return data?.target_id;
}
async function remember(sourceTable, legacyId, targetId) {
  maps.set(`${sourceTable}:${legacyId}`, targetId);
  const { error } = await supabase.from("legacy_import_map").upsert({ user_id: userId, source_table: sourceTable, legacy_id: String(legacyId), target_id: targetId }, { onConflict: "user_id,source_table,legacy_id" });
  if (error) throw error;
}
async function insertOnce(sourceTable, row, table, payload) {
  const legacyId = row.id ?? row.entry_date;
  if (legacyId === undefined || legacyId === null) throw new Error(`${sourceTable} has no stable legacy identifier.`);
  const existing = await mapped(sourceTable, legacyId);
  if (existing) return existing;
  const { data, error } = await supabase.from(table).insert(payload).select("id").single();
  if (error) throw new Error(`${sourceTable}#${legacyId}: ${error.message}`);
  await remember(sourceTable, legacyId, data.id);
  return data.id;
}

// Areas are normalized once, then reused by goals and directions. This also keeps the import
// safe when historic free-text records contain the same area repeatedly.
const areas = new Set([...rows("goals"), ...rows("season_area_plans"), ...rows("life_directions"), ...rows("entries"), ...rows("financial_entries"), ...rows("milestones")].map((row) => String(row.area ?? "").trim()).filter(Boolean));
const areaIds = new Map();
for (const name of areas) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data, error } = await supabase.from("life_areas").upsert({ user_id: userId, name, slug, color: "#B74E32", weight: 1 }, { onConflict: "user_id,slug" }).select("id").single();
  if (error) throw error;
  areaIds.set(name.toLowerCase(), data.id);
}
const areaId = (name) => areaIds.get(String(name ?? "").toLowerCase()) ?? null;

for (const row of rows("seasons")) await insertOnce("seasons", row, "seasons", { user_id: userId, name: row.name, theme: row.theme ?? "", statement: row.intention ?? null, starts_on: row.start_date, ends_on: row.end_date, status: row.status ?? "draft", activated_at: row.activated_at ?? null, completed_at: row.completed_at ?? null });
for (const row of rows("life_directions")) await insertOnce("life_directions", row, "life_directions", { user_id: userId, area_id: areaId(row.area), statement: row.statement, why: row.why ?? null, status: row.status ?? "active" });
for (const row of rows("direction_versions")) { const directionId = await mapped("life_directions", row.direction_id); if (directionId) await insertOnce("direction_versions", row, "direction_versions", { direction_id: directionId, statement: row.statement, why: row.why ?? null, effective_from: row.effective_from, effective_to: row.effective_to ?? null }); }
for (const row of rows("horizons")) { const directionId = await mapped("life_directions", row.direction_id); if (directionId) await insertOnce("horizons", row, "horizons", { direction_id: directionId, name: row.name, horizon_type: row.horizon_type, start_date: row.start_date ?? null, end_date: row.end_date ?? null, statement: row.statement, status: row.status ?? "active" }); }
for (const row of rows("horizon_outcomes")) { const horizonId = await mapped("horizons", row.horizon_id); if (horizonId) await insertOnce("horizon_outcomes", row, "horizon_outcomes", { horizon_id: horizonId, statement: row.statement, position: row.position ?? 0 }); }

for (const row of rows("goals")) { const seasonId = await mapped("seasons", row.season_id); if (!seasonId || !areaId(row.area)) continue; await insertOnce("goals", row, "goals", { user_id: userId, season_id: seasonId, area_id: areaId(row.area), title: row.title, goal_type: row.goal_type, baseline: row.baseline_value ?? 0, baseline_value: row.baseline_value ?? 0, target: row.target, current_value: row.current_value ?? 0, weight: row.weight ?? 1, deadline: row.deadline ?? null, status: row.status ?? "active", metric_key: row.metric_key ?? null, tracking_mode: row.tracking_mode ?? "manual" }); }
for (const row of rows("goals")) { const goalId = await mapped("goals", row.id); if (goalId) { const { error } = await supabase.from("goals").update({ carried_from_goal_id: await mapped("goals", row.carried_from_goal_id), direction_id: await mapped("life_directions", row.direction_id), horizon_id: await mapped("horizons", row.horizon_id) }).eq("id", goalId); if (error) throw error; } }
for (const row of rows("goal_updates")) { const goalId = await mapped("goals", row.goal_id); if (goalId) await insertOnce("goal_updates", row, "goal_updates", { user_id: userId, goal_id: goalId, value: row.value, status: row.status ?? "active", effective_date: row.effective_date, note: row.note ?? null, recorded_at: row.created_at ?? undefined }); }
for (const row of rows("goal_evidence")) { const goalId = await mapped("goals", row.goal_id); if (goalId) await insertOnce("goal_evidence", row, "goal_evidence", { user_id: userId, goal_id: goalId, kind: row.kind, value: row.value, note: row.note ?? null, created_at: row.created_at ?? undefined }); }
for (const row of rows("entries")) await insertOnce("entries", row, "entries", { user_id: userId, type: row.type, detail: row.detail, amount: row.amount ?? null, entry_date: row.entry_date, area: row.area ?? null, project: row.project ?? null, metric_key: row.metric_key ?? null, created_at: row.created_at ?? undefined });
for (const row of rows("journal")) await insertOnce("journal", row, "journal", { user_id: userId, entry_type: row.entry_type, content: row.content, entry_date: row.entry_date, created_at: row.created_at ?? undefined });
for (const row of rows("financial_entries")) await insertOnce("financial_entries", row, "financial_entries", { user_id: userId, kind: row.kind, category: row.category, amount: row.amount, entry_date: row.entry_date, note: row.note ?? null, area: row.area ?? null, project: row.project ?? null, metric_key: row.metric_key ?? null, created_at: row.created_at ?? undefined });
for (const row of rows("bible_entries")) await insertOnce("bible_entries", row, "bible_entries", { user_id: userId, book: row.book, chapters: row.chapters ?? null, minutes: row.minutes ?? null, entry_date: row.entry_date, note: row.note ?? null, created_at: row.created_at ?? undefined });
for (const row of rows("workouts")) await insertOnce("workouts", row, "workouts", { user_id: userId, workout_type: row.workout_type, duration: row.duration ?? null, body_weight: row.body_weight ?? null, notes: row.notes ?? null, entry_date: row.entry_date, created_at: row.created_at ?? undefined });
for (const row of rows("workout_exercises")) { const workoutId = await mapped("workouts", row.workout_id); if (workoutId) await insertOnce("workout_exercises", row, "workout_exercises", { workout_id: workoutId, exercise: row.exercise, sets: row.sets ?? null, reps: row.reps ?? null, weight: row.weight ?? null, rpe: row.rpe ?? null }); }
for (const row of rows("coding_entries")) await insertOnce("coding_entries", row, "coding_entries", { user_id: userId, problems: row.problems, category: row.category, platform: row.platform ?? null, entry_date: row.entry_date, note: row.note ?? null, created_at: row.created_at ?? undefined });
for (const row of rows("daily_pulse")) await insertOnce("daily_pulse", row, "daily_pulse", { user_id: userId, entry_date: row.entry_date, mood: row.mood ?? null, energy: row.energy ?? null, stress: row.stress ?? null, updated_at: row.updated_at ?? undefined });
for (const row of rows("milestones")) await insertOnce("milestones", row, "milestones", { user_id: userId, area: row.area, title: row.title, achieved_at: row.achieved_at ?? null, note: row.note ?? null, created_at: row.created_at ?? undefined });
for (const sourceRow of rows("budgets")) { const row = { ...sourceRow, id: sourceRow.category }; await insertOnce("budgets", row, "budgets", { user_id: userId, category: row.category, monthly_target: row.monthly_target, updated_at: row.updated_at ?? undefined }); }
for (const row of rows("reviews")) await insertOnce("reviews", row, "reviews", { user_id: userId, week: row.week, accomplishment: row.accomplishment ?? null, slipped: row.slipped ?? null, priority: row.priority ?? null, created_at: row.created_at ?? undefined });
for (const row of rows("season_snapshots")) await insertOnce("season_snapshots", row, "season_snapshots", { user_id: userId, month: monthDate(row.month), bible_days: row.bible_days ?? 0, gym_sessions: row.gym_sessions ?? 0, coding_problems: row.coding_problems ?? 0, deep_work_minutes: row.deep_work_minutes ?? 0, created_at: row.created_at ?? undefined });
for (const row of rows("season_area_plans")) { const seasonId = await mapped("seasons", row.season_id); if (seasonId) await insertOnce("season_area_plans", row, "season_area_plans", { season_id: seasonId, area: row.area, outcome: row.outcome ?? "", priority: row.priority ?? 1 }); }
for (const row of rows("season_planning_lessons")) { const seasonId = await mapped("seasons", row.season_id); if (seasonId) await insertOnce("season_planning_lessons", row, "season_planning_lessons", { season_id: seasonId, kind: row.kind, content: row.content }); }
for (const row of rows("weekly_reviews")) { const seasonId = await mapped("seasons", row.season_id); if (seasonId) await insertOnce("weekly_reviews", row, "weekly_reviews", { user_id: userId, season_id: seasonId, week_start: row.week_start, week_end: row.week_end, proud_of: row.proud_of ?? "", got_in_way: row.got_in_way ?? "", lesson: row.lesson ?? "", next_primary_focus: row.next_primary_focus ?? "", next_secondary_focus: row.next_secondary_focus ?? "", completed_at: row.completed_at ?? null }); }
for (const row of rows("season_reviews")) { const seasonId = await mapped("seasons", row.season_id); if (seasonId) await insertOnce("season_reviews", row, "season_reviews", { user_id: userId, season_id: seasonId, proud_of: row.proud_of ?? "", changed_most: row.changed_most ?? "", obstacles: row.obstacles ?? "", lesson: row.lesson ?? "", carry_forward: row.carry_forward ?? "", leave_behind: row.leave_behind ?? "", completed_at: row.completed_at ?? null }); }

const firstSeason = await mapped("seasons", rows("seasons")[0]?.id);
const { error: settingsError } = await supabase.from("user_settings").upsert({ user_id: userId, onboarding_completed: Boolean(firstSeason), onboarding_completed_at: firstSeason ? new Date().toISOString() : null, onboarding_season_id: firstSeason ?? null }, { onConflict: "user_id" });
if (settingsError) throw settingsError;

console.log("Import complete. Re-run with --dry-run to compare source counts; SQLite was not modified.");
