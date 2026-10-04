import { importanceWeights } from "@/domain/season-planning/planning";
import { validateSeasonPlan } from "@/domain/season-planning/validation";
import type { SeasonPlanInput } from "@/domain/season-planning/types";
import type { SqliteDatabase } from "@/data/sqlite/types";
import { withTransaction } from "@/data/sqlite/transaction";

type Row = { id: number };

function assertValid(plan: SeasonPlanInput, requireGoals = false) {
  const validation = validateSeasonPlan(plan, { requireGoals });
  if (validation.errors.length) throw new Error(validation.errors[0]);
  return validation;
}

function activeOverlap(database: SqliteDatabase, startDate: string, endDate: string, excludingId?: number) {
  const query = excludingId === undefined
    ? "select id from seasons where status='active' and start_date<=? and end_date>=? limit 1"
    : "select id from seasons where status='active' and start_date<=? and end_date>=? and id<>? limit 1";
  return excludingId === undefined ? database.prepare(query).get(endDate, startDate) : database.prepare(query).get(endDate, startDate, excludingId);
}

function replaceDraftContents(database: SqliteDatabase, seasonId: number, plan: SeasonPlanInput) {
  database.prepare("delete from season_area_plans where season_id=?").run(seasonId);
  database.prepare("delete from season_planning_lessons where season_id=?").run(seasonId);
  database.prepare("delete from goals where season_id=? and status='draft'").run(seasonId);
  for (const area of plan.areaPlans) database.prepare("insert into season_area_plans(season_id,area,outcome,priority) values(?,?,?,?)").run(seasonId, area.area.trim(), area.outcome.trim(), area.priority ?? 1);
  for (const lesson of plan.lessons.filter((item) => item.content.trim())) database.prepare("insert into season_planning_lessons(season_id,kind,content) values(?,?,?)").run(seasonId, lesson.kind, lesson.content.trim());
  for (const goal of plan.goals) {
    if (goal.directionId && !database.prepare("select id from life_directions where id=? and status='active'").get(goal.directionId)) throw new Error("Selected direction is no longer active.");
    if (goal.horizonId && !database.prepare("select id from horizons where id=? and direction_id=? and status='active'").get(goal.horizonId, goal.directionId ?? null)) throw new Error("Selected horizon does not belong to the selected direction.");
    database.prepare("insert into goals(area,title,goal_type,target,current_value,baseline_value,weight,deadline,status,metric_key,tracking_mode,season_id,carried_from_goal_id,direction_id,horizon_id) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(goal.area.trim(), goal.title.trim(), goal.goalType, goal.target, goal.baselineValue ?? 0, goal.baselineValue ?? 0, importanceWeights[goal.importance], goal.deadline ?? plan.endDate, "draft", goal.metricKey ?? null, goal.trackingMode, seasonId, goal.carriedFromGoalId ?? null, goal.directionId ?? null, goal.horizonId ?? null);
  }
}

export function createDraftSeason(database: SqliteDatabase, plan: SeasonPlanInput) {
  assertValid(plan);
  return withTransaction(database, () => {
    database.prepare("insert into seasons(name,theme,intention,start_date,end_date,status,previous_season_id) values(?,?,?,?,?,?,?)").run(plan.name.trim(), plan.theme.trim(), plan.intention?.trim() || null, plan.startDate, plan.endDate, "draft", plan.previousSeasonId ?? null);
    const season = database.prepare("select last_insert_rowid() as id").get() as Row;
    replaceDraftContents(database, season.id, plan);
    return season.id;
  });
}

export function updateDraftSeason(database: SqliteDatabase, seasonId: number, plan: SeasonPlanInput) {
  assertValid(plan);
  const draft = database.prepare("select id from seasons where id=? and status='draft'").get(seasonId);
  if (!draft) throw new Error("Only draft seasons can be changed here.");
  withTransaction(database, () => {
    database.prepare("update seasons set name=?,theme=?,intention=?,start_date=?,end_date=?,previous_season_id=?,updated_at=current_timestamp where id=?").run(plan.name.trim(), plan.theme.trim(), plan.intention?.trim() || null, plan.startDate, plan.endDate, plan.previousSeasonId ?? null, seasonId);
    replaceDraftContents(database, seasonId, plan);
  });
}

export function activateDraftSeason(database: SqliteDatabase, seasonId: number) {
  const season = database.prepare("select * from seasons where id=? and status='draft'").get(seasonId) as Record<string, unknown> | undefined;
  if (!season) throw new Error("Draft season not found.");
  const goals = database.prepare("select area,title,target,goal_type,tracking_mode,metric_key,deadline,weight,baseline_value,carried_from_goal_id,direction_id,horizon_id from goals where season_id=? and status='draft'").all(seasonId) as Array<Record<string, unknown>>;
  const plans = database.prepare("select area,outcome,priority from season_area_plans where season_id=?").all(seasonId) as Array<Record<string, unknown>>;
  const validation = validateSeasonPlan({ name: String(season.name), theme: String(season.theme), intention: String(season.intention ?? ""), startDate: String(season.start_date), endDate: String(season.end_date), previousSeasonId: season.previous_season_id as number | null, lessons: [], areaPlans: plans.map((item) => ({ area: String(item.area), outcome: String(item.outcome), priority: Number(item.priority) })), goals: goals.map((goal) => ({ title: String(goal.title), area: String(goal.area), target: Number(goal.target), goalType: goal.goal_type as SeasonPlanInput["goals"][number]["goalType"], trackingMode: goal.tracking_mode as SeasonPlanInput["goals"][number]["trackingMode"], metricKey: goal.metric_key as SeasonPlanInput["goals"][number]["metricKey"], deadline: String(goal.deadline), importance: Object.entries(importanceWeights).find(([, weight]) => weight === Number(goal.weight))?.[0] as SeasonPlanInput["goals"][number]["importance"] ?? "normal", baselineValue: Number(goal.baseline_value), carriedFromGoalId: goal.carried_from_goal_id as number | null, directionId: goal.direction_id as number | null, horizonId: goal.horizon_id as number | null })) });
  if (validation.errors.length) throw new Error(validation.errors[0]);
  withTransaction(database, () => {
    // Check after taking the write lock so two activation requests cannot both pass it.
    if (activeOverlap(database, String(season.start_date), String(season.end_date), seasonId)) throw new Error("This season overlaps an active season.");
    database.prepare("update seasons set status='active',activated_at=current_timestamp,updated_at=current_timestamp where id=? and status='draft'").run(seasonId);
    database.prepare("update goals set status='active' where season_id=? and status='draft'").run(seasonId);
  });
}

/** Creates the first active season and its contents as one transaction. Repeated submits return the original season. */
export function completeInitialSeason(database: SqliteDatabase, plan: SeasonPlanInput) {
  assertValid(plan, true);
  return withTransaction(database, () => {
    const completed = database.prepare("select value from settings where key='onboarding_completed'").get() as { value: string } | undefined;
    if (completed?.value === "true") {
      const saved = database.prepare("select value from settings where key='onboarding_season_id'").get() as { value: string } | undefined;
      if (!saved) throw new Error("Onboarding has already been completed.");
      return { seasonId: Number(saved.value), alreadyCompleted: true };
    }
    if (database.prepare("select id from seasons limit 1").get()) throw new Error("Existing seasons cannot be replaced by onboarding.");
    database.prepare("insert into seasons(name,theme,intention,start_date,end_date,status,activated_at) values(?,?,?,?,?,'active',current_timestamp)").run(plan.name.trim(), plan.theme.trim(), plan.intention?.trim() || null, plan.startDate, plan.endDate);
    const season = database.prepare("select last_insert_rowid() as id").get() as Row;
    replaceDraftContents(database, season.id, plan);
    database.prepare("update goals set status='active' where season_id=? and status='draft'").run(season.id);
    database.prepare("insert into settings(key,value) values('onboarding_completed','true') on conflict(key) do update set value='true'").run();
    database.prepare("insert into settings(key,value) values('onboarding_completed_at',current_timestamp) on conflict(key) do update set value=current_timestamp").run();
    database.prepare("insert into settings(key,value) values('onboarding_season_id',?) on conflict(key) do update set value=excluded.value").run(String(season.id));
    return { seasonId: season.id, alreadyCompleted: false };
  });
}
