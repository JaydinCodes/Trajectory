import type { MetricKey } from "../../lib/trajectory/types";
import type { SqliteDatabase } from "./types";

export type GoalOptions = { metricKey?: MetricKey | null; trackingMode?: "derived" | "manual"; seasonId?: number | null };

export function listGoals(database: SqliteDatabase, seasonId?: number) {
  if (seasonId === undefined) return database.prepare("select * from goals order by weight desc").all();
  return database.prepare("select * from goals where season_id=? order by weight desc").all(seasonId);
}

export function findGoalInSeason(database: SqliteDatabase, goalId: number, seasonId: number) {
  return database.prepare("select * from goals where id=? and season_id=?").get(goalId, seasonId);
}

export function addGoal(database: SqliteDatabase, area: string, title: string, goalType: string, target: number, weight: number, deadline: string, options: GoalOptions = {}) {
  return database.prepare("insert into goals(area,title,goal_type,target,weight,deadline,metric_key,tracking_mode,season_id) values(?,?,?,?,?,?,?,?,?)").run(area, title, goalType, target, weight, deadline, options.metricKey ?? null, options.trackingMode ?? "manual", options.seasonId ?? null);
}

export function updateGoal(database: SqliteDatabase, id: number, currentValue: number, status: string, seasonId?: number) {
  if (seasonId === undefined) return database.prepare("update goals set current_value=?, status=? where id=?").run(currentValue, status, id);
  return database.prepare("update goals set current_value=?, status=? where id=? and season_id=?").run(currentValue, status, id, seasonId);
}

/** Manual values are append-only so historical trajectory snapshots remain reproducible. */
export function updateManualGoal(database: SqliteDatabase, id: number, currentValue: number, status: string, effectiveDate: string, seasonId?: number) {
  const goal = seasonId === undefined
    ? database.prepare("select tracking_mode from goals where id=?").get(id)
    : database.prepare("select tracking_mode from goals where id=? and season_id=?").get(id, seasonId);
  if (!goal) return undefined;
  const result = updateGoal(database, id, currentValue, status, seasonId);
  if ((goal as { tracking_mode: string }).tracking_mode === "manual") database.prepare("insert into goal_updates(goal_id,value,status,effective_date) values(?,?,?,?)").run(id, currentValue, status, effectiveDate);
  return result;
}

export function manualGoalValueAsOf(database: SqliteDatabase, goal: { id: number; baseline_value?: number; current_value: number }, asOfDate: string): number {
  const update = database.prepare("select value from goal_updates where goal_id=? and effective_date<=? order by effective_date desc,id desc limit 1").get(goal.id, asOfDate) as { value: number } | undefined;
  return update ? Number(update.value) : Number(goal.baseline_value ?? goal.current_value);
}

export function addGoalEvidence(database: SqliteDatabase, goalId: number, kind: string, value: string, note: string) {
  return database.prepare("insert into goal_evidence(goal_id,kind,value,note) values(?,?,?,?)").run(goalId, kind, value, note);
}

export function listGoalEvidence(database: SqliteDatabase, goalId: number) {
  return database.prepare("select * from goal_evidence where goal_id=? order by id desc").all(goalId);
}
