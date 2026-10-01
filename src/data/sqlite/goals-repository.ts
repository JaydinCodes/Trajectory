import type { MetricKey } from "@/lib/trajectory/types";
import type { SqliteDatabase } from "./types";

export type GoalOptions = { metricKey?: MetricKey | null; trackingMode?: "derived" | "manual"; seasonId?: number | null };

export function listGoals(database: SqliteDatabase) {
  return database.prepare("select * from goals order by weight desc").all();
}

export function addGoal(database: SqliteDatabase, area: string, title: string, goalType: string, target: number, weight: number, deadline: string, options: GoalOptions = {}) {
  return database.prepare("insert into goals(area,title,goal_type,target,weight,deadline,metric_key,tracking_mode,season_id) values(?,?,?,?,?,?,?,?,?)").run(area, title, goalType, target, weight, deadline, options.metricKey ?? null, options.trackingMode ?? "manual", options.seasonId ?? null);
}

export function updateGoal(database: SqliteDatabase, id: number, currentValue: number, status: string) {
  return database.prepare("update goals set current_value=?, status=? where id=?").run(currentValue, status, id);
}

export function addGoalEvidence(database: SqliteDatabase, goalId: number, kind: string, value: string, note: string) {
  return database.prepare("insert into goal_evidence(goal_id,kind,value,note) values(?,?,?,?)").run(goalId, kind, value, note);
}

export function listGoalEvidence(database: SqliteDatabase, goalId: number) {
  return database.prepare("select * from goal_evidence where goal_id=? order by id desc").all(goalId);
}
