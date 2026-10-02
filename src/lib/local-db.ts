import "server-only";
import fs from "node:fs";
import path from "node:path";
import { localDate, monthName, daysInMonth } from "@/lib/date-time";
import type { Goal, MetricKey, Season } from "@/lib/trajectory/types";
import { addGoal as addGoalRecord, addGoalEvidence, findGoalInSeason, listGoalEvidence, listGoals as listGoalRecords, manualGoalValueAsOf, updateManualGoal } from "@/data/sqlite/goals-repository";
import { getDeepWorkAttentionInRange, getFullSeasonMetricEvents, getMetricDailyValuesAsOf, getMetricEventsAsOf, getMetricTotals, getMetricTotalsAsOf, getMetricTotalsInRange, metricRangeAsOf } from "@/data/sqlite/metrics-repository";
import { calculateTrajectorySnapshot } from "@/services/trajectory-service";
import { calculateGoalTrajectory, calculateSeasonProgress } from "@/lib/trajectory";
import type { SqliteDatabase } from "@/data/sqlite/types";
import { calculateWeeklyReview } from "@/services/weekly-review-service";
import { formatWeekLabel, getPreviousWeekRange, getWeekRange } from "@/domain/review/week-range";
import type { EvidenceSummary, WeeklyReflection } from "@/domain/review/types";
import { calculateSeasonReview } from "@/services/season-review-service";
import type { SeasonReflection, SeasonReview, WeeklyReviewSummary } from "@/domain/season-review/types";
import { getSeasonWeekRanges } from "@/domain/season-review/season-period";
import { activateDraftSeason, createDraftSeason, updateDraftSeason } from "@/services/season-planning-service";
import { nextCalendarMonth } from "@/domain/season-planning/planning";
import type { SeasonPlanInput, UnfinishedGoal } from "@/domain/season-planning/types";
import type { AreaHistoryItem, GoalJourneyItem, HistoricalDate, HistoryMetric, SeasonComparison, SeasonTimelineItem } from "@/domain/history/types";
import { createLifeTimeline, createSeasonComparison } from "@/services/history-service";
const nodeSqlite: { DatabaseSync: new (filename:string) => SqliteDatabase } = require("node:sqlite");

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "trajectory.db");
let database: SqliteDatabase | undefined;
function addColumn(store: SqliteDatabase, table: string, definition: string) {
  const column = definition.split(/\s+/)[0];
  const columns = store.prepare(`pragma table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) store.exec(`alter table ${table} add column ${definition}`);
}
function db() {
  if (database) return database;
  fs.mkdirSync(dataDir, { recursive: true });
  database = new nodeSqlite.DatabaseSync(dbPath);
  database.exec("pragma journal_mode = WAL");
  database.exec(`
    create table if not exists entries (id integer primary key, type text not null, detail text not null, amount real, entry_date text not null, created_at text not null default current_timestamp);
    create table if not exists journal (id integer primary key, entry_type text not null, content text not null, entry_date text not null, created_at text not null default current_timestamp);
    create table if not exists reviews (id integer primary key, week text not null, accomplishment text, slipped text, priority text, created_at text not null default current_timestamp);
    create table if not exists goals (id integer primary key, area text not null, title text not null, goal_type text not null, target real, current_value real not null default 0, weight real not null default 1, deadline text, status text not null default 'active', created_at text not null default current_timestamp);
    create table if not exists financial_entries (id integer primary key, kind text not null, category text not null, amount real not null, entry_date text not null, note text, created_at text not null default current_timestamp);
    create table if not exists budgets (category text primary key, monthly_target real not null, updated_at text not null default current_timestamp);
    create table if not exists milestones (id integer primary key, area text not null, title text not null, achieved_at text, note text, created_at text not null default current_timestamp);
    create table if not exists settings (key text primary key, value text not null);
    create table if not exists bible_entries (id integer primary key, book text not null, chapters text, minutes integer, entry_date text not null, note text, created_at text not null default current_timestamp);
    create table if not exists workouts (id integer primary key, workout_type text not null, duration integer, body_weight real, notes text, entry_date text not null, created_at text not null default current_timestamp);
    create table if not exists workout_exercises (id integer primary key, workout_id integer not null references workouts(id) on delete cascade, exercise text not null, sets integer, reps integer, weight real, rpe real);
    create table if not exists coding_entries (id integer primary key, problems integer not null, category text not null, platform text, entry_date text not null, note text, created_at text not null default current_timestamp);
    create table if not exists daily_pulse (entry_date text primary key, mood integer check(mood between 1 and 10), energy integer check(energy between 1 and 10), stress integer check(stress between 1 and 10), updated_at text not null default current_timestamp);
    create table if not exists tags (id integer primary key, name text not null unique);
    create table if not exists journal_tags (journal_id integer not null references journal(id) on delete cascade, tag_id integer not null references tags(id) on delete cascade, primary key(journal_id,tag_id));
    create table if not exists monthly_reviews (id integer primary key, month text not null unique, lessons text, intentions text, created_at text not null default current_timestamp);
    create table if not exists season_snapshots (id integer primary key, month text not null, bible_days integer not null default 0, gym_sessions integer not null default 0, coding_problems integer not null default 0, deep_work_minutes integer not null default 0, created_at text not null default current_timestamp, unique(month));
    create table if not exists goal_evidence (id integer primary key, goal_id integer not null references goals(id) on delete cascade, kind text not null, value text not null, note text, created_at text not null default current_timestamp);
    create table if not exists seasons (id integer primary key, name text not null, theme text not null default '', start_date text not null, end_date text not null, created_at text not null default current_timestamp, unique(start_date, end_date));
    create table if not exists goal_updates (id integer primary key, goal_id integer not null references goals(id) on delete cascade, value real not null, status text not null default 'active', effective_date text not null, note text, created_at text not null default current_timestamp);
    create table if not exists weekly_reviews (id integer primary key, season_id integer not null references seasons(id) on delete cascade, week_start text not null, week_end text not null, proud_of text not null default '', got_in_way text not null default '', lesson text not null default '', next_primary_focus text not null default '', next_secondary_focus text not null default '', completed_at text, created_at text not null default current_timestamp, updated_at text not null default current_timestamp, unique(season_id, week_start));
    create table if not exists season_reviews (id integer primary key, season_id integer not null references seasons(id) on delete cascade, proud_of text not null default '', changed_most text not null default '', obstacles text not null default '', lesson text not null default '', carry_forward text not null default '', leave_behind text not null default '', completed_at text, created_at text not null default current_timestamp, updated_at text not null default current_timestamp, unique(season_id));
    create table if not exists season_area_plans (id integer primary key, season_id integer not null references seasons(id) on delete cascade, area text not null, outcome text not null default '', priority real not null default 1, created_at text not null default current_timestamp, unique(season_id,area));
    create table if not exists season_planning_lessons (id integer primary key, season_id integer not null references seasons(id) on delete cascade, kind text not null check(kind in ('carry_forward','leave_behind','lesson')), content text not null, created_at text not null default current_timestamp);
  `);
  addColumn(database, "goals", "metric_key text");
  addColumn(database, "goals", "tracking_mode text not null default 'manual'");
  addColumn(database, "goals", "season_id integer");
  addColumn(database, "goals", "baseline_value real not null default 0");
  addColumn(database, "goals", "carried_from_goal_id integer");
  addColumn(database, "seasons", "status text not null default 'draft'");
  addColumn(database, "seasons", "updated_at text");
  addColumn(database, "seasons", "intention text");
  addColumn(database, "seasons", "activated_at text");
  addColumn(database, "seasons", "completed_at text");
  addColumn(database, "seasons", "previous_season_id integer");
  addColumn(database, "entries", "area text");
  addColumn(database, "entries", "project text");
  addColumn(database, "entries", "metric_key text");
  addColumn(database, "financial_entries", "area text");
  addColumn(database, "financial_entries", "project text");
  addColumn(database, "financial_entries", "metric_key text");
  const malformedSeasons=database.prepare("select id,start_date from seasons where length(end_date)<>10").all() as Array<{id:number;start_date:string}>;
  for(const season of malformedSeasons){const end=`${season.start_date.slice(0,8)}${String(daysInMonth(season.start_date)).padStart(2,"0")}`;database.prepare("update seasons set end_date=? where id=?").run(end,season.id);}
  database.exec("update goals set deadline=(select end_date from seasons where seasons.id=goals.season_id) where length(deadline)<>10 and season_id is not null");
  // Existing manual values had no event history. Preserve their visible value as the safe baseline; future edits are append-only.
  database.exec("update goals set baseline_value=current_value where tracking_mode='manual' and baseline_value=0 and current_value<>0");
  database.exec("create index if not exists goal_updates_goal_date_idx on goal_updates(goal_id,effective_date desc,id desc)");
  database.exec("create index if not exists weekly_reviews_season_week_idx on weekly_reviews(season_id,week_start)");
  database.exec("create index if not exists season_reviews_season_idx on season_reviews(season_id)");
  database.exec("create index if not exists seasons_status_range_idx on seasons(status,start_date,end_date)");
  database.exec("create index if not exists goals_carried_from_idx on goals(carried_from_goal_id)");
  // Data created before lifecycle support was implicitly current when its dates contained today.
  // Record completion so a newly saved current-date draft is never auto-activated on restart.
  const lifecycleBackfill = database.prepare("select value from settings where key='season_lifecycle_backfill_v1'").get();
  if (!lifecycleBackfill) {
    database.prepare("update seasons set status='active',activated_at=coalesce(activated_at,current_timestamp) where status='draft' and start_date<=? and end_date>=?").run(localDate(),localDate());
    database.prepare("insert into settings(key,value) values('season_lifecycle_backfill_v1','complete')").run();
  }
  // Legacy records receive explicit metadata once; new records never infer it from free text.
  database.exec("update entries set metric_key='dsa_problems', area='Coding' where metric_key is null and type='DSA'");
  database.exec("update entries set metric_key='deep_work_minutes' where metric_key is null and type='Deep work'");
  database.exec("update entries set metric_key='tutoring_revenue', project='Odysseus', area='Odysseus' where metric_key is null and type='Revenue'");
  database.exec("update financial_entries set metric_key='tutoring_revenue', project='Odysseus', area='Odysseus' where metric_key is null and kind='income' and category='Tutoring'");
  const count = database.prepare("select count(*) as n from entries").get() as {n:number};
  if (!count.n) seed(database);
  database.prepare("insert or ignore into season_snapshots(month,bible_days,gym_sessions,coding_problems,deep_work_minutes) values(?,?,?,?,?)").run("September 2026",18,10,52,610);
  return database;
}
function seed(store: SqliteDatabase) {
 const add=store.prepare("insert into entries(type,detail,amount,entry_date) values(?,?,?,?)");
 [["Bible","Jeremiah 12–13 · 28 minutes",2,"2026-10-14"],["Workout","Push · 71 minutes · bench 77.5kg × 7",71,"2026-10-14"],["DSA","4 problems: arrays and hash maps",4,"2026-10-14"],["Deep work","Odysseus pitch deck",90,"2026-10-14"],["Revenue","Tutoring income",800,"2026-10-04"],["Deep work","Ledgerly statement parsing",120,"2026-10-07"]].forEach(v=>add.run(...v));
 store.prepare("insert into journal(entry_type,content,entry_date) values(?,?,?)").run("career","I finally understood how the ERP workflow fits together today. It made the newness of the job feel less intimidating.","2026-10-14");
 const goal=store.prepare("insert into goals(area,title,goal_type,target,current_value,weight,deadline) values(?,?,?,?,?,?,?)");
 [["Faith","Bible reading days","consistency",25,12,15,"2026-10-31"],["Fitness","Gym sessions","count",14,11,12,"2026-10-31"],["Coding","DSA problems","count",100,64,8,"2026-10-31"],["Odysseus","Tutoring revenue","currency",8000,4200,18,"2026-10-31"],["Ledgerly","Usable MVP","milestone",100,43,15,"2026-10-31"]].forEach(v=>goal.run(...v));
 store.prepare("insert into financial_entries(kind,category,amount,entry_date,note) values(?,?,?,?,?)").run("income","Tutoring",800,"2026-10-04","October tutoring");
 store.prepare("insert or ignore into season_snapshots(month,bible_days,gym_sessions,coding_problems,deep_work_minutes) values(?,?,?,?,?)").run("September 2026",18,10,52,610);
}
export function listEntries(){ return db().prepare("select * from entries order by entry_date desc, id desc").all(); }
export function listActivityEntries(entryDate=localDate()){
 const store=db(); const entries=store.prepare("select * from entries where entry_date=? order by id desc").all(entryDate) as Array<Record<string,unknown>>;
 const scripture=store.prepare("select id,'Scripture' as type,book as detail,minutes as amount,entry_date,'Faith' as area,null as project,created_at from bible_entries where entry_date=?").all(entryDate) as Array<Record<string,unknown>>;
 const workouts=store.prepare("select id,'Workout' as type,workout_type as detail,duration as amount,entry_date,'Fitness' as area,null as project,created_at from workouts where entry_date=?").all(entryDate) as Array<Record<string,unknown>>;
 const coding=store.prepare("select id,'DSA' as type,category as detail,problems as amount,entry_date,'Coding' as area,null as project,created_at from coding_entries where entry_date=?").all(entryDate) as Array<Record<string,unknown>>;
 const finance=store.prepare("select id,case when kind='income' then 'Tutoring Revenue' else 'Finance' end as type,category as detail,amount,entry_date,area,project,created_at from financial_entries where entry_date=?").all(entryDate) as Array<Record<string,unknown>>;
 return [...entries,...scripture,...workouts,...coding,...finance].sort((left,right)=>String(right.entry_date).localeCompare(String(left.entry_date))||Number(right.id)-Number(left.id));
}
export function addEntry(type:string,detail:string,amount:number|undefined,date:string, metadata:{area?:string;project?:string;metricKey?:MetricKey}={}){ return db().prepare("insert into entries(type,detail,amount,entry_date,area,project,metric_key) values(?,?,?,?,?,?,?)").run(type,detail,amount ?? null,date,metadata.area??null,metadata.project??null,metadata.metricKey??null); }
export function listJournal(){return db().prepare("select * from journal order by entry_date desc, id desc").all();}
export function addJournal(entryType:string,content:string,date:string){return db().prepare("insert into journal(entry_type,content,entry_date) values(?,?,?)").run(entryType,content,date);}
export function updateJournal(id:number,content:string){return db().prepare("update journal set content=? where id=?").run(content,id)}
export function removeJournal(id:number){return db().prepare("delete from journal where id=?").run(id)}
export function addReview(week:string, accomplishment:string, slipped:string, priority:string){return db().prepare("insert into reviews(week,accomplishment,slipped,priority) values(?,?,?,?)").run(week,accomplishment,slipped,priority);}
export function listGoals(today=localDate()){const season=getActiveSeason(today);return listGoalRecords(db(),season.id);}
export function addGoal(area:string,title:string,goalType:string,target:number,weight:number,deadline:string, options:{metricKey?:MetricKey|null;trackingMode?:"derived"|"manual";seasonId?:number|null}={}){return addGoalRecord(db(),area,title,goalType,target,weight,deadline,options);}
export function updateGoal(id:number,currentValue:number,status:string,effectiveDate=localDate()){const season=getActiveSeason();if(season.status==="completed")throw new Error("Completed season goals are historical records and cannot be changed.");return updateManualGoal(db(),id,currentValue,status,effectiveDate,season.id);}
export function listFinance(){return db().prepare("select * from financial_entries order by entry_date desc,id desc").all();}
export function addFinance(kind:string,category:string,amount:number,date:string,note:string, metadata:{area?:string;project?:string;metricKey?:MetricKey}={}){return db().prepare("insert into financial_entries(kind,category,amount,entry_date,note,area,project,metric_key) values(?,?,?,?,?,?,?,?)").run(kind,category,amount,date,note,metadata.area??null,metadata.project??null,metadata.metricKey??null);}
export function removeFinance(id:number){return db().prepare("delete from financial_entries where id=?").run(id);}
export function listBudgets(){return db().prepare("select * from budgets order by category").all()}
export function saveBudget(category:string,target:number){return db().prepare("insert into budgets(category,monthly_target,updated_at) values(?,?,current_timestamp) on conflict(category) do update set monthly_target=excluded.monthly_target,updated_at=current_timestamp").run(category,target)}
export function addRecord(kind:string, values:Record<string,unknown>){const store=db();const date=String(values.date ?? localDate());if(kind==="bible")return store.prepare("insert into bible_entries(book,chapters,minutes,entry_date,note) values(?,?,?,?,?)").run(values.book,values.chapters??null,values.minutes??null,date,values.note??null);if(kind==="workout"){store.prepare("insert into workouts(workout_type,duration,body_weight,notes,entry_date) values(?,?,?,?,?)").run(values.workoutType,values.duration,values.bodyWeight??null,values.notes??null,date);const id=(store.prepare("select last_insert_rowid() as id").get() as {id:number}).id;const exercises=Array.isArray(values.exercises)?values.exercises:[];for(const item of exercises){if(item&&typeof item==="object"){const x=item as Record<string,unknown>;if(x.exercise)store.prepare("insert into workout_exercises(workout_id,exercise,sets,reps,weight,rpe) values(?,?,?,?,?,?)").run(id,x.exercise,x.sets??null,x.reps??null,x.weight??null,x.rpe??null)}}return id}if(kind==="coding")return store.prepare("insert into coding_entries(problems,category,platform,entry_date,note) values(?,?,?,?,?)").run(values.problems,values.category,values.platform??null,date,values.note??null);if(kind==="pulse")return store.prepare("insert into daily_pulse(entry_date,mood,energy,stress,updated_at) values(?,?,?,?,current_timestamp) on conflict(entry_date) do update set mood=excluded.mood,energy=excluded.energy,stress=excluded.stress,updated_at=current_timestamp").run(date,values.mood,values.energy,values.stress);throw new Error("Unsupported record type");}
export function listRecords(kind:string){const tables:Record<string,string>={bible:"bible_entries",workout:"workouts",coding:"coding_entries",pulse:"daily_pulse"};const table=tables[kind];if(!table)throw new Error("Unsupported record type");return db().prepare(`select * from ${table} order by entry_date desc,id desc`).all();}
export function removeRecord(kind:string,id:number){const tables:Record<string,string>={bible:"bible_entries",workout:"workouts",coding:"coding_entries"};const table=tables[kind];if(!table)throw new Error("Unsupported record type");return db().prepare(`delete from ${table} where id=?`).run(id);}
export function getActiveSeason(today = localDate()): Season {
 const store=db(); const existing=store.prepare("select * from seasons where status in ('active','completed') and start_date<=? and end_date>=? order by case status when 'active' then 0 else 1 end, start_date desc limit 1").get(today,today) as Season|undefined;
 if(existing){store.prepare("update goals set season_id=? where season_id is null and deadline between ? and ?").run(existing.id,existing.start_date,existing.end_date);return existing;}
 const seasonCount = store.prepare("select count(*) as count from seasons").get() as { count: number };
 if (seasonCount.count) throw new Error("There is no active season for this date. Plan and start a season first.");
 // The local demo seeds evidence before its first season exists. This one-time bootstrap
 // preserves that legacy data; all subsequently created seasons begin as drafts.
 const start=`${today.slice(0,7)}-01`; const end=`${today.slice(0,8)}${String(daysInMonth(today)).padStart(2,"0")}`;
 store.prepare("insert or ignore into seasons(name,theme,start_date,end_date,status,activated_at) values(?,?,?,?,?,current_timestamp)").run(monthName(today),"Consistency + Execution",start,end,"active");
 const season=store.prepare("select * from seasons where start_date=? and end_date=?").get(start,end) as Season;
 store.prepare("update goals set season_id=? where season_id is null and deadline between ? and ?").run(season.id,season.start_date,season.end_date);
 return season;
}
export function listSeasons(){ return db().prepare("select * from seasons order by start_date desc").all(); }
export function createSeason(name:string,theme:string,startDate:string,endDate:string){ if(endDate<startDate) throw new Error("Season end must follow its start."); return db().prepare("insert into seasons(name,theme,start_date,end_date,status) values(?,?,?,?,?)").run(name,theme,startDate,endDate,"draft"); }
export function createSeasonPlan(plan: SeasonPlanInput) { return createDraftSeason(db(), plan); }
export function updateSeasonPlan(seasonId: number, plan: SeasonPlanInput) { return updateDraftSeason(db(), seasonId, plan); }
export function activateSeasonPlan(seasonId: number) { return activateDraftSeason(db(), seasonId); }
export function seasonPlanningContext(previousSeasonId?: number) {
 const store = db();
 const previous = previousSeasonId === undefined
   ? store.prepare("select s.* from seasons s join season_reviews r on r.season_id=s.id where r.completed_at is not null order by s.end_date desc limit 1").get() as Season | undefined
   : findSeason(previousSeasonId);
 const defaults = nextCalendarMonth(previous?.end_date ?? localDate());
 const areas = new Set(["Faith", "Fitness", "Odysseus", "Ledgerly", "Career", "Coding", "Finance", "Personal"]);
 if (previous?.id) (store.prepare("select distinct area from goals where season_id=?").all(previous.id) as Array<{ area: string }>).forEach((goal) => areas.add(goal.area));
 const reflection = previous?.id ? savedSeasonReflection(previous.id) : undefined;
 const unfinished: UnfinishedGoal[] = previous?.id ? (store.prepare("select id,area,title,target,current_value,baseline_value,tracking_mode,metric_key,goal_type from goals where season_id=?").all(previous.id) as Array<Record<string, unknown>>).map((goal) => {
   const raw = goal.tracking_mode === "manual" ? manualGoalValueAsOf(store, { id: Number(goal.id), baseline_value: Number(goal.baseline_value ?? 0), current_value: Number(goal.current_value) }, previous.end_date) : goal.metric_key ? getMetricTotalsAsOf(store, previous, previous.end_date)[goal.metric_key as MetricKey] : Number(goal.current_value);
   return { id: Number(goal.id), area: String(goal.area), title: String(goal.title), target: Number(goal.target), current: raw, trackingMode: goal.tracking_mode as UnfinishedGoal["trackingMode"], metricKey: goal.metric_key as UnfinishedGoal["metricKey"], goalType: goal.goal_type as UnfinishedGoal["goalType"] };
 }).filter((goal) => goal.current < goal.target) : [];
 const recommendedAreas = previous?.id ? (store.prepare("select distinct area from goals where season_id=? order by area").all(previous.id) as Array<{ area: string }>).map((item) => item.area) : [];
 return { defaults, previous: previous ? { id: previous.id, name: previous.name, startDate: previous.start_date, endDate: previous.end_date, reflection, unfinished } : null, areas: [...areas], recommendedAreas };
}
/** Current values always stop at the requested local date. */
export function metricTotals(season:Season, asOfDate=localDate()): Record<MetricKey,number> { return getMetricTotalsAsOf(db(),season,asOfDate); }
/** Full-season totals remain available to history and reporting surfaces. */
export function fullSeasonMetricTotals(season:Season): Record<MetricKey,number> { return getMetricTotals(db(),season); }
function goalsForSeasonAsOf(season: Season, asOfDate: string): Goal[] {
 return (listGoalRecords(db(),season.id) as Goal[]).map((goal) => goal.tracking_mode === "manual" ? { ...goal, current_value: manualGoalValueAsOf(db(), goal, asOfDate) } : goal);
}
function trajectorySnapshotFor(season: Season, asOfDate: string) {
 return calculateTrajectorySnapshot({goals:goalsForSeasonAsOf(season,asOfDate),season,today:asOfDate,metrics:metricTotals(season,asOfDate),dailyValues:(metric,start,end)=>getMetricDailyValuesAsOf(db(),metric,season,asOfDate,start,end)});
}
export function goalsWithProgress(today=localDate()) {
 const season=getActiveSeason(today); const snapshot=trajectorySnapshotFor(season,today);
 return snapshot.goals;
}
export function areaMomentum(area:string,today=localDate()) { const season=getActiveSeason(today); return trajectorySnapshotFor(season,today).areas.find((item)=>item.area===area)?.momentum??"insufficient_data"; }
export function insights(today=localDate()){const store=db();const season=getActiveSeason(today);const dateRange=metricRangeAsOf(season,today);const byType=dateRange?store.prepare("select type, count(*) as count, coalesce(sum(amount),0) as total from entries where entry_date between ? and ? group by type").all(dateRange.start_date,dateRange.end_date) as Array<{type:string;count:number;total:number}>:[];const metrics=metricTotals(season,today);return {byType,bibleDays:metrics.bible_days,gymSessions:metrics.gym_sessions,codingProblems:metrics.dsa_problems,deepWorkMinutes:metrics.deep_work_minutes,tutoringRevenue:metrics.tutoring_revenue};}
export function listMilestones(){return db().prepare("select * from milestones order by achieved_at desc,id desc").all();}
export function addMilestone(area:string,title:string,date:string,note:string){return db().prepare("insert into milestones(area,title,achieved_at,note) values(?,?,?,?)").run(area,title,date,note);}
export function removeMilestone(id:number){return db().prepare("delete from milestones where id=?").run(id)}
export function readSettings(){return db().prepare("select * from settings").all();}
export function saveSetting(key:string,value:string){return db().prepare("insert into settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value").run(key,value);}
export function searchEverything(term:string){const q=`%${term.trim()}%`;if(!term.trim())return [];const store=db();return [
 ...store.prepare("select 'journal' as kind,id,content as title,entry_date as date from journal where content like ?").all(q),
 ...store.prepare("select 'goal' as kind,id,title,deadline as date from goals where title like ?").all(q),
 ...store.prepare("select 'milestone' as kind,id,title,achieved_at as date from milestones where title like ?").all(q),
 ...store.prepare("select 'entry' as kind,id,detail as title,entry_date as date from entries where detail like ?").all(q),
 ...store.prepare("select 'weekly review' as kind,id,coalesce(next_primary_focus,lesson,got_in_way) as title,week_start as date from weekly_reviews where next_primary_focus like ? or lesson like ? or got_in_way like ?").all(q,q,q),
 ...store.prepare("select 'season review' as kind,r.id,coalesce(r.lesson,r.carry_forward,r.leave_behind) as title,s.end_date as date from season_reviews r join seasons s on s.id=r.season_id where r.lesson like ? or r.carry_forward like ? or r.leave_behind like ?").all(q,q,q)
 ];}
export function activityDays(){return db().prepare("select entry_date as date,count(*) as count from (select entry_date from entries union all select entry_date from bible_entries union all select entry_date from workouts union all select entry_date from coding_entries union all select entry_date from journal) group by entry_date order by entry_date").all();}
export function activityDaysFor(metric:string){const sql:Record<string,string>={Bible:"select entry_date as date,count(*) as count from bible_entries group by entry_date",Gym:"select entry_date as date,count(*) as count from workouts group by entry_date",Coding:"select entry_date as date,sum(problems) as count from coding_entries group by entry_date",Journal:"select entry_date as date,count(*) as count from journal group by entry_date",Overall:"select entry_date as date,count(*) as count from (select entry_date from entries union all select entry_date from bible_entries union all select entry_date from workouts union all select entry_date from coding_entries union all select entry_date from journal) group by entry_date"};return db().prepare(sql[metric]??sql.Overall).all();}
export function addEvidence(goalId:number,kind:string,value:string,note:string){return addGoalEvidence(db(),goalId,kind,value,note)}
export function listEvidence(goalId:number){return listGoalEvidence(db(),goalId)}
export function goalEvidence(goalId:number,today=localDate()) {
 const store=db(); const season=getActiveSeason(today); const goal=findGoalInSeason(store,goalId,season.id!) as Goal|undefined; if(!goal) return [];
 const manual=(listEvidence(goalId) as Array<Record<string,unknown>>).map(item=>({...item,source:"manual"})); if(goal.tracking_mode!=="derived" || !goal.metric_key) return manual;
 const derived=getMetricEventsAsOf(store,goal.metric_key,season,today).map(item=>({...item,value:item.label,source:"derived"}));
 return [...derived,...manual];
}
/** Evidence for retrospective full-season reporting; live views should use goalEvidence. */
export function fullSeasonGoalEvidence(goalId:number,today=localDate()) {
 const store=db(); const season=getActiveSeason(today); const goal=findGoalInSeason(store,goalId,season.id!) as Goal|undefined; if(!goal) return [];
 const manual=(listEvidence(goalId) as Array<Record<string,unknown>>).map(item=>({...item,source:"manual"})); if(goal.tracking_mode!=="derived" || !goal.metric_key) return manual;
 return [...getFullSeasonMetricEvents(store,goal.metric_key,season).map(item=>({...item,value:item.label,source:"derived"})),...manual];
}
export function exportData(){const store=db();const tables=["entries","journal","reviews","goals","goal_evidence","financial_entries","milestones","bible_entries","workouts","workout_exercises","coding_entries","daily_pulse","settings"];return Object.fromEntries(tables.map(table=>[table,store.prepare(`select * from ${table}`).all()]));}
export function reviewSummary(){const d=insights();const priority=d.deepWorkMinutes<480?"Schedule one protected Ledgerly block before the week fills up.":"Protect the routines that are already generating evidence.";return {summary:`This week contains ${d.bibleDays} Scripture records, ${d.gymSessions} training sessions, and ${d.codingProblems} coding problems.`,priority};}
export function correlations(){const store=db();const trained=store.prepare("select avg(p.mood) as average from daily_pulse p where exists(select 1 from workouts w where w.entry_date=p.entry_date)").get() as {average:number|null};const rest=store.prepare("select avg(p.mood) as average from daily_pulse p where not exists(select 1 from workouts w where w.entry_date=p.entry_date)").get() as {average:number|null};return {gymMood:trained.average===null||rest.average===null?null:{trained:Math.round(trained.average*10)/10,rest:Math.round(rest.average*10)/10}}}
export function comparison(){const previous=db().prepare("select * from season_snapshots order by id desc limit 1").get() as Record<string,unknown>|undefined;const current=insights();return {previous,current:{month:monthName(),bible_days:current.bibleDays,gym_sessions:current.gymSessions,coding_problems:current.codingProblems,deep_work_minutes:current.deepWorkMinutes}}}
export function saveSnapshot(month:string){const d=insights();return db().prepare("insert into season_snapshots(month,bible_days,gym_sessions,coding_problems,deep_work_minutes) values(?,?,?,?,?) on conflict(month) do update set bible_days=excluded.bible_days,gym_sessions=excluded.gym_sessions,coding_problems=excluded.coding_problems,deep_work_minutes=excluded.deep_work_minutes").run(month,d.bibleDays,d.gymSessions,d.codingProblems,d.deepWorkMinutes)}
export function dashboard(today=localDate()){
 const season=getActiveSeason(today); const trajectory=trajectorySnapshotFor(season,today);
 const seasonProgress=calculateSeasonProgress(season,today);
 return {...trajectory,season,seasonProgress:{...seasonProgress,percentage:seasonProgress.totalDays?seasonProgress.elapsedDays/seasonProgress.totalDays*100:0},...insights(today)};
}

const historyMetricLabels: Record<MetricKey, string> = { bible_days: "Bible reading days", gym_sessions: "Gym sessions", dsa_problems: "DSA problems", deep_work_minutes: "Deep work", tutoring_revenue: "Tutoring revenue", savings: "Savings", custom: "Custom" };
const historyMetricKeys: MetricKey[] = ["bible_days", "gym_sessions", "dsa_problems", "deep_work_minutes", "tutoring_revenue", "savings"];
const historyStatus = (season: Season): "draft" | "active" | "completed" => season.status === "active" || season.status === "completed" ? season.status : "draft";
const historyAsOf = (season: Season, today = localDate()) => historyStatus(season) === "active" ? (today < season.end_date ? today : season.end_date) : season.end_date;
const historyMetrics = (totals: Record<MetricKey, number>): HistoryMetric[] => historyMetricKeys.map((key) => ({ key, label: historyMetricLabels[key], total: totals[key] }));

function historySeasonItem(season: Season, today = localDate()): SeasonTimelineItem {
 const store = db(); const status = historyStatus(season);
 if (status === "draft" || today < season.start_date) return { season: { id: season.id!, name: season.name, theme: season.theme, intention: season.intention ?? null, startDate: season.start_date, endDate: season.end_date }, status, trajectory: { start: 0, end: 0, change: 0 }, goals: { total: Number((store.prepare("select count(*) as count from goals where season_id=?").get(season.id) as { count: number }).count), completed: 0, carriedForward: 0 }, metrics: historyMetrics({ bible_days: 0, gym_sessions: 0, dsa_problems: 0, deep_work_minutes: 0, tutoring_revenue: 0, savings: 0, custom: 0 }), milestones: [], dominantAttention: [] };
 const asOf = historyAsOf(season, today); const review = seasonReview(season.id, asOf); const next = store.prepare("select id,name,theme from seasons where previous_season_id=? order by start_date limit 1").get(season.id) as { id: number; name: string; theme: string } | undefined;
 const carriedForward = Number((store.prepare("select count(*) as count from goals where carried_from_goal_id in (select id from goals where season_id=?)").get(season.id) as { count: number }).count);
 return { season: { id: season.id!, name: season.name, theme: season.theme, intention: season.intention ?? null, startDate: season.start_date, endDate: season.end_date }, status, trajectory: { start: review.trajectory.startScore, end: review.trajectory.endScore, change: review.trajectory.change }, goals: { total: review.goals.all.length, completed: review.goals.completed.length, carriedForward }, metrics: review.metrics, milestones: review.milestones, review: review.reflection?.completedAt ? { lesson: review.reflection.lesson, carryForward: review.reflection.carryForward, leaveBehind: review.reflection.leaveBehind, completedAt: review.reflection.completedAt } : undefined, dominantAttention: review.attention.slice(0, 3), nextSeason: next };
}

/** Season-level archive summaries. Each completed season is calculated at its own end date. */
export function lifeTimeline(today = localDate()) { return createLifeTimeline((listSeasons() as Season[]).map((season) => historySeasonItem(season, today))); }
export function historySeason(seasonId: number, today = localDate()) { const season = findSeason(seasonId); if (!season?.id) throw new Error("Season not found."); return { item: historySeasonItem(season, today), review: historyStatus(season) === "draft" || today < season.start_date ? undefined : seasonReview(season.id, historyAsOf(season, today)) }; }

function findHistorySeasonForDate(value: string): Season | undefined { return db().prepare("select * from seasons where status in ('active','completed') and start_date<=? and end_date>=? order by case status when 'active' then 0 else 1 end, start_date desc limit 1").get(value, value) as Season | undefined; }
export function historyDate(value: string): HistoricalDate {
 const season = findHistorySeasonForDate(value); if (!season?.id) return { date: value, season: null, trajectory: null, goals: [], metrics: [] };
 const snapshot = trajectorySnapshotFor(season, value); const metrics = metricTotals(season, value);
 return { date: value, season: { id: season.id, name: season.name, theme: season.theme }, trajectory: { score: snapshot.score, expected: snapshot.expected, projected: snapshot.projected }, goals: snapshot.goals.map((goal) => ({ id: goal.id, area: goal.area, title: goal.title, current: goal.current, target: goal.target, percentage: goal.actualPercentage })), metrics: historyMetrics(metrics) };
}

function historyGoalValue(goal: Goal, season: Season, asOf: string) { const derived = goal.tracking_mode === "derived" && goal.metric_key ? metricTotals(season, asOf)[goal.metric_key] : undefined; return calculateGoalTrajectory(goal.tracking_mode === "manual" ? { ...goal, current_value: manualGoalValueAsOf(db(), goal, asOf) } : goal, season, asOf, derived); }
export function goalJourney(goalId: number, today = localDate()): GoalJourneyItem[] {
 const store = db(); const ancestors = new Set<number>(); let current = store.prepare("select * from goals where id=?").get(goalId) as Goal | undefined; if (!current) throw new Error("Goal not found.");
 while (current.carried_from_goal_id && !ancestors.has(current.id)) { ancestors.add(current.id); const parent = store.prepare("select * from goals where id=?").get(current.carried_from_goal_id) as Goal | undefined; if (!parent) break; current = parent; }
 const lineage: Goal[] = []; const descendants = new Set<number>(); let cursor: Goal | undefined = current;
 while (cursor && !descendants.has(cursor.id)) { descendants.add(cursor.id); lineage.push(cursor); cursor = store.prepare("select * from goals where carried_from_goal_id=? order by id limit 1").get(cursor.id) as Goal | undefined; }
 return lineage.map((goal) => { const season = findSeason(goal.season_id!); if (!season?.id) throw new Error("Goal season not found."); const progress = historyGoalValue(goal, season, historyAsOf(season, today)); return { id: goal.id, seasonId: season.id, seasonName: season.name, seasonStartDate: season.start_date, title: goal.title, area: goal.area, current: progress.current, target: goal.target, percentage: progress.actualPercentage, status: goal.status }; }).sort((left, right) => left.seasonStartDate.localeCompare(right.seasonStartDate));
}

export function areaHistory(area: string, today = localDate()): AreaHistoryItem[] {
 const store = db(); return (listSeasons() as Season[]).filter((season) => historyStatus(season) !== "draft").map((season) => { const asOf = historyAsOf(season, today); const goals = (listGoalRecords(store, season.id) as Goal[]).filter((goal) => goal.area.toLowerCase() === area.toLowerCase()); if (!goals.length) return undefined; const metrics = metricTotals(season, asOf); const metricKeys = [...new Set(goals.flatMap((goal) => goal.metric_key ? [goal.metric_key] : []))]; return { seasonId: season.id!, seasonName: season.name, startDate: season.start_date, status: historyStatus(season), goals: goals.map((goal) => { const progress = historyGoalValue(goal, season, asOf); return { id: goal.id, title: goal.title, current: progress.current, target: goal.target, percentage: progress.actualPercentage }; }), metrics: metricKeys.map((key) => ({ key, label: historyMetricLabels[key], total: metrics[key] })), milestones: (store.prepare("select id,area,title,achieved_at from milestones where area=? and achieved_at between ? and ? order by achieved_at").all(area, season.start_date, asOf) as Array<{ id: number; area: string; title: string; achieved_at: string }>).map((milestone) => ({ id: milestone.id, area: milestone.area, title: milestone.title, achievedAt: milestone.achieved_at })) } as AreaHistoryItem | undefined; }).filter((item): item is AreaHistoryItem => Boolean(item)).sort((left, right) => right.startDate.localeCompare(left.startDate));
}

function comparisonSummary(seasonId: number, today = localDate()): SeasonComparison["left"] { const item = historySeason(seasonId, today).item; return { id: item.season.id, name: item.season.name, theme: item.season.theme, trajectoryEnd: item.trajectory.end, goalsCompleted: item.goals.completed, areasActive: new Set((listGoalRecords(db(), item.season.id) as Goal[]).map((goal) => goal.area)).size, milestones: item.milestones.length, metrics: item.metrics }; }
export function seasonComparison(leftId: number, rightId: number, today = localDate()) { if (leftId === rightId) throw new Error("Choose two different seasons to compare."); return createSeasonComparison(comparisonSummary(leftId, today), comparisonSummary(rightId, today)); }
export function historyYear(year: number) { if (!Number.isInteger(year) || year < 1900 || year > 9999) throw new Error("Year is invalid."); const start = `${year}-01-01`; const end = `${year}-12-31`; const store = db(); const seasons = (store.prepare("select * from seasons where start_date between ? and ? order by start_date").all(start, end) as Season[]).map((season) => ({ id: season.id!, name: season.name, theme: season.theme, status: historyStatus(season), startDate: season.start_date, endDate: season.end_date })); const milestones = Number((store.prepare("select count(*) as count from milestones where achieved_at between ? and ?").get(start, end) as { count: number }).count); return { year, seasons, seasonsCompleted: seasons.filter((season) => season.status === "completed").length, milestones, metrics: historyMetrics(getMetricTotalsInRange(store, start, end)) };
}

const emptyEvidence = (): EvidenceSummary => ({ bibleDays:0, workouts:0, dsaProblems:0, deepWorkMinutes:0, tutoringRevenue:0, records:0 });
function evidenceSummaryForRange(startDate: string, endDate: string): EvidenceSummary {
 const totals=getMetricTotalsInRange(db(),startDate,endDate);
 const records=db().prepare(`select count(*) as count from (
   select id from bible_entries where entry_date between ? and ?
   union all select id from workouts where entry_date between ? and ?
   union all select id from coding_entries where entry_date between ? and ?
   union all select id from entries where entry_date between ? and ? and metric_key is not null
   union all select id from financial_entries where entry_date between ? and ? and metric_key is not null
 )`).get(startDate,endDate,startDate,endDate,startDate,endDate,startDate,endDate,startDate,endDate) as {count:number}|undefined;
 return { bibleDays:totals.bible_days, workouts:totals.gym_sessions, dsaProblems:totals.dsa_problems, deepWorkMinutes:totals.deep_work_minutes, tutoringRevenue:totals.tutoring_revenue, records:Number(records?.count??0) };
}
function savedWeeklyReflection(seasonId: number, weekStart: string): WeeklyReflection | undefined {
 const row=db().prepare("select proud_of,got_in_way,lesson,next_primary_focus,next_secondary_focus,completed_at from weekly_reviews where season_id=? and week_start=?").get(seasonId,weekStart) as Record<string,unknown>|undefined;
 if(!row) return undefined;
 return { proudOf:String(row.proud_of??""), gotInWay:String(row.got_in_way??""), lesson:String(row.lesson??""), nextPrimaryFocus:String(row.next_primary_focus??""), nextSecondaryFocus:String(row.next_secondary_focus??""), completedAt:row.completed_at?String(row.completed_at):null };
}
function previousWeeklyReflection(weekStart: string): WeeklyReflection | undefined {
 const row=db().prepare("select proud_of,got_in_way,lesson,next_primary_focus,next_secondary_focus,completed_at from weekly_reviews where week_start=? order by completed_at desc,id desc limit 1").get(weekStart) as Record<string,unknown>|undefined;
 if(!row) return undefined;
 return { proudOf:String(row.proud_of??""), gotInWay:String(row.got_in_way??""), lesson:String(row.lesson??""), nextPrimaryFocus:String(row.next_primary_focus??""), nextSecondaryFocus:String(row.next_secondary_focus??""), completedAt:row.completed_at?String(row.completed_at):null };
}

/** Generated review analysis is recomputed from evidence. Only the user's reflection is persisted. */
export function weeklyReview(date=localDate()) {
 const range=getWeekRange(date); const previousRange=getPreviousWeekRange(range); const season=getActiveSeason(date); const saved=savedWeeklyReflection(season.id!,range.startDate);
 const endAsOf=range.endDate > localDate() ? localDate() : range.endDate;
 const startSnapshot=trajectorySnapshotFor(season,range.startDate);
 const endSnapshot=trajectorySnapshotFor(season,endAsOf);
 const attention=db().prepare("select coalesce(nullif(project,''),nullif(area,''),'Unassigned') as name, coalesce(sum(amount),0) as minutes from entries where metric_key='deep_work_minutes' and entry_date between ? and ? group by coalesce(nullif(project,''),nullif(area,''),'Unassigned')").all(range.startDate,endAsOf) as Array<{name:string;minutes:number}>;
 const milestones=db().prepare("select id,area,title,achieved_at from milestones where achieved_at between ? and ? order by achieved_at,id").all(range.startDate,endAsOf) as Array<{id:number;area:string;title:string;achieved_at:string}>;
 const journal=db().prepare("select id,content,entry_date from journal where entry_date between ? and ? order by entry_date desc,id desc limit 2").all(range.startDate,endAsOf) as Array<{id:number;content:string;entry_date:string}>;
 const prior=previousWeeklyReflection(previousRange.startDate);
 const state=range.endDate >= localDate() ? "in_progress" : saved?.completedAt ? "complete" : "not_reviewed";
 return { analysis:calculateWeeklyReview({ range, label:formatWeekLabel(range), startGoals:startSnapshot.goals, endGoals:endSnapshot.goals, startScore:startSnapshot.score, endScore:endSnapshot.score, attention, evidence:evidenceSummaryForRange(range.startDate,endAsOf), previousWeek:previousRange.endDate > localDate()?emptyEvidence():evidenceSummaryForRange(previousRange.startDate,previousRange.endDate), milestones:milestones.map((item)=>({id:item.id,area:item.area,title:item.title,achievedAt:item.achieved_at})), journal:journal.map((item)=>({id:item.id,content:item.content,entryDate:item.entry_date})), state, priorCommitment:prior?.nextPrimaryFocus || undefined }), reflection:saved };
}

export function saveWeeklyReview(date:string, reflection: Omit<WeeklyReflection,"completedAt">, complete:boolean) {
 const range=getWeekRange(date); if(range.startDate>localDate()) throw new Error("Future weekly reviews cannot be saved.");
 const season=getActiveSeason(date); const now=complete?new Date().toISOString():null;
 return db().prepare(`insert into weekly_reviews(season_id,week_start,week_end,proud_of,got_in_way,lesson,next_primary_focus,next_secondary_focus,completed_at,updated_at)
 values(?,?,?,?,?,?,?,?,?,current_timestamp)
 on conflict(season_id,week_start) do update set week_end=excluded.week_end,proud_of=excluded.proud_of,got_in_way=excluded.got_in_way,lesson=excluded.lesson,next_primary_focus=excluded.next_primary_focus,next_secondary_focus=excluded.next_secondary_focus,completed_at=case when excluded.completed_at is not null then excluded.completed_at else weekly_reviews.completed_at end,updated_at=current_timestamp`).run(season.id,range.startDate,range.endDate,reflection.proudOf,reflection.gotInWay,reflection.lesson,reflection.nextPrimaryFocus,reflection.nextSecondaryFocus,now);
}

const clampDate = (value: string, start: string, end: string) => value < start ? start : value > end ? end : value;
const metricLabels: Record<MetricKey, string> = { bible_days: "Bible reading days", gym_sessions: "Fitness sessions", dsa_problems: "DSA problems", deep_work_minutes: "Deep work", tutoring_revenue: "Tutoring revenue", savings: "Savings", custom: "Custom" };
const reviewMetricKeys: MetricKey[] = ["bible_days", "gym_sessions", "dsa_problems", "deep_work_minutes", "tutoring_revenue", "savings"];

function findSeason(seasonId: number): Season | undefined {
 return db().prepare("select * from seasons where id=?").get(seasonId) as Season | undefined;
}

function savedSeasonReflection(seasonId: number): SeasonReflection | undefined {
 const row = db().prepare("select proud_of,changed_most,obstacles,lesson,carry_forward,leave_behind,completed_at from season_reviews where season_id=?").get(seasonId) as Record<string, unknown> | undefined;
 if (!row) return undefined;
 return { proudOf: String(row.proud_of ?? ""), changedMost: String(row.changed_most ?? ""), obstacles: String(row.obstacles ?? ""), lesson: String(row.lesson ?? ""), carryForward: String(row.carry_forward ?? ""), leaveBehind: String(row.leave_behind ?? ""), completedAt: row.completed_at ? String(row.completed_at) : null };
}

function reviewState(season: Season, reflection: SeasonReflection | undefined, today = localDate()): "in_progress" | "reviewed" | "not_reviewed" {
 if (reflection?.completedAt) return "reviewed";
 return season.start_date <= today && today <= season.end_date ? "in_progress" : "not_reviewed";
}

/** Reads only dated evidence and append-only goal history so an old season is never calculated from today's values. */
export function seasonReview(seasonId?: number, asOfDate = localDate()): SeasonReview {
 const season = seasonId === undefined ? getActiveSeason(asOfDate) : findSeason(seasonId);
 if (!season?.id) throw new Error("Season not found.");
 if (asOfDate < season.start_date) throw new Error("Season review cannot be calculated before the season begins.");
 const endDate = clampDate(asOfDate, season.start_date, season.end_date);
 const startSnapshot = trajectorySnapshotFor(season, season.start_date);
 const endSnapshot = trajectorySnapshotFor(season, endDate);
 const goals = endSnapshot.goals.map((end) => {
   const start = startSnapshot.goals.find((item) => item.id === end.id) ?? end;
   const events = end.tracking_mode === "derived" && end.metric_key ? getMetricEventsAsOf(db(), end.metric_key, season, endDate) : db().prepare("select effective_date as date from goal_updates where goal_id=? and effective_date between ? and ?").all(end.id, season.start_date, endDate) as Array<{ date: string }>;
   // Textual goal evidence does not determine progress, but belongs in the factual record when it was created during this season.
   const notes = db().prepare("select substr(created_at,1,10) as date from goal_evidence where goal_id=? and substr(created_at,1,10) between ? and ?").all(end.id, season.start_date, endDate) as Array<{ date: string }>;
   const evidence = [...events, ...notes];
   return { id: end.id, area: end.area, title: end.title, target: Number(end.target), startValue: Number(start.current), endValue: Number(end.current), startPercentage: Number(start.actualPercentage), endPercentage: Number(end.actualPercentage), movement: Number(end.actualPercentage - start.actualPercentage), expectedEndPercentage: Number(end.expectedPercentage), trajectoryStatus: end.trajectoryStatus, evidence: { records: evidence.length, activeDays: new Set(evidence.map((event) => event.date)).size } };
 });
 const weeks = getSeasonWeekRanges({ startDate: season.start_date, endDate });
 const totals = getMetricTotalsInRange(db(), season.start_date, endDate);
 const reflection = savedSeasonReflection(season.id);
 const weeklyReviews = db().prepare("select week_start,week_end,next_primary_focus,got_in_way,lesson,completed_at from weekly_reviews where season_id=? and completed_at is not null order by week_start").all(season.id) as Array<Record<string, unknown>>;
 return calculateSeasonReview({
   season: { id: season.id, name: season.name, theme: season.theme, startDate: season.start_date, endDate: season.end_date, totalDays: calculateSeasonProgress(season, season.end_date).totalDays },
   state: reviewState(season, reflection),
   startScore: startSnapshot.score,
   endScore: endSnapshot.score,
   expectedEndScore: endSnapshot.expected,
   goals,
   metrics: reviewMetricKeys.map((key) => ({ key, label: metricLabels[key], total: totals[key] })),
   attention: getDeepWorkAttentionInRange(db(), season.start_date, endDate),
   weeklyTrend: weeks.map((week, index) => ({ ...week, label: week.endDate === endDate ? "Final" : week.label, score: trajectorySnapshotFor(season, week.endDate).score })),
   consistency: reviewMetricKeys.map((key) => ({ key, label: metricLabels[key], weeks: weeks.map((week) => ({ label: week.endDate === endDate ? "Final" : week.label, value: getMetricTotalsInRange(db(), week.startDate, week.endDate)[key] })) })).filter((summary) => summary.weeks.some((week) => week.value > 0)),
   milestones: (db().prepare("select id,area,title,achieved_at from milestones where achieved_at between ? and ? order by achieved_at,id").all(season.start_date, endDate) as Array<{ id: number; area: string; title: string; achieved_at: string }>).map((item) => ({ id: item.id, area: item.area, title: item.title, achievedAt: item.achieved_at })),
   journalHighlights: (db().prepare("select id,content,entry_date from journal where entry_date between ? and ? order by entry_date,id limit 3").all(season.start_date, endDate) as Array<{ id: number; content: string; entry_date: string }>).map((item) => ({ id: item.id, content: item.content, entryDate: item.entry_date })),
   weeklyReviews: weeklyReviews.map((item): WeeklyReviewSummary => ({ weekStart: String(item.week_start), weekEnd: String(item.week_end), primaryFocus: String(item.next_primary_focus ?? ""), obstacles: String(item.got_in_way ?? ""), lesson: String(item.lesson ?? ""), completedAt: item.completed_at ? String(item.completed_at) : null })),
   reflection,
 });
}

export function seasonReviewNavigation(today = localDate()) {
 return (listSeasons() as Season[]).sort((left, right) => left.start_date.localeCompare(right.start_date)).map((season) => {
   const reflection = season.id ? savedSeasonReflection(season.id) : undefined;
   return { id: season.id, name: season.name, startDate: season.start_date, endDate: season.end_date, state: reviewState(season, reflection, today) };
 });
}

export function saveSeasonReview(seasonId: number, reflection: Omit<SeasonReflection, "completedAt">, complete: boolean) {
 const season = findSeason(seasonId);
 if (!season?.id) throw new Error("Season not found.");
 if (savedSeasonReflection(season.id)?.completedAt) throw new Error("Completed season reviews are historical records and cannot be changed.");
 const completedAt = complete ? new Date().toISOString() : null;
 const result = db().prepare(`insert into season_reviews(season_id,proud_of,changed_most,obstacles,lesson,carry_forward,leave_behind,completed_at,updated_at)
 values(?,?,?,?,?,?,?,?,current_timestamp)
 on conflict(season_id) do update set proud_of=excluded.proud_of,changed_most=excluded.changed_most,obstacles=excluded.obstacles,lesson=excluded.lesson,carry_forward=excluded.carry_forward,leave_behind=excluded.leave_behind,completed_at=case when excluded.completed_at is not null then excluded.completed_at else season_reviews.completed_at end,updated_at=current_timestamp`).run(season.id, reflection.proudOf, reflection.changedMost, reflection.obstacles, reflection.lesson, reflection.carryForward, reflection.leaveBehind, completedAt);
 if (complete) db().prepare("update seasons set status='completed',completed_at=current_timestamp,updated_at=current_timestamp where id=? and status<>'completed'").run(season.id);
 return result;
}
