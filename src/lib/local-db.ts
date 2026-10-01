import "server-only";
import fs from "node:fs";
import path from "node:path";
import { localDate, monthName, daysInMonth } from "@/lib/date-time";
import type { Goal, MetricKey, Season } from "@/lib/trajectory/types";
import { addGoal as addGoalRecord, addGoalEvidence, listGoalEvidence, listGoals as listGoalRecords, updateGoal as updateGoalRecord } from "@/data/sqlite/goals-repository";
import { getMetricDailyValues, getMetricTotals } from "@/data/sqlite/metrics-repository";
import { calculateTrajectorySnapshot } from "@/services/trajectory-service";
import type { SqliteDatabase } from "@/data/sqlite/types";
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
  `);
  addColumn(database, "goals", "metric_key text");
  addColumn(database, "goals", "tracking_mode text not null default 'manual'");
  addColumn(database, "goals", "season_id integer");
  addColumn(database, "entries", "area text");
  addColumn(database, "entries", "project text");
  addColumn(database, "entries", "metric_key text");
  addColumn(database, "financial_entries", "area text");
  addColumn(database, "financial_entries", "project text");
  addColumn(database, "financial_entries", "metric_key text");
  const malformedSeasons=database.prepare("select id,start_date from seasons where length(end_date)<>10").all() as Array<{id:number;start_date:string}>;
  for(const season of malformedSeasons){const end=`${season.start_date.slice(0,8)}${String(daysInMonth(season.start_date)).padStart(2,"0")}`;database.prepare("update seasons set end_date=? where id=?").run(end,season.id);}
  database.exec("update goals set deadline=(select end_date from seasons where seasons.id=goals.season_id) where length(deadline)<>10 and season_id is not null");
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
export function addEntry(type:string,detail:string,amount:number|undefined,date:string, metadata:{area?:string;project?:string;metricKey?:MetricKey}={}){ return db().prepare("insert into entries(type,detail,amount,entry_date,area,project,metric_key) values(?,?,?,?,?,?,?)").run(type,detail,amount ?? null,date,metadata.area??null,metadata.project??null,metadata.metricKey??null); }
export function listJournal(){return db().prepare("select * from journal order by entry_date desc, id desc").all();}
export function addJournal(entryType:string,content:string,date:string){return db().prepare("insert into journal(entry_type,content,entry_date) values(?,?,?)").run(entryType,content,date);}
export function updateJournal(id:number,content:string){return db().prepare("update journal set content=? where id=?").run(content,id)}
export function removeJournal(id:number){return db().prepare("delete from journal where id=?").run(id)}
export function addReview(week:string, accomplishment:string, slipped:string, priority:string){return db().prepare("insert into reviews(week,accomplishment,slipped,priority) values(?,?,?,?)").run(week,accomplishment,slipped,priority);}
export function listGoals(){return listGoalRecords(db());}
export function addGoal(area:string,title:string,goalType:string,target:number,weight:number,deadline:string, options:{metricKey?:MetricKey|null;trackingMode?:"derived"|"manual";seasonId?:number|null}={}){return addGoalRecord(db(),area,title,goalType,target,weight,deadline,options);}
export function updateGoal(id:number,currentValue:number,status:string){return updateGoalRecord(db(),id,currentValue,status);}
export function listFinance(){return db().prepare("select * from financial_entries order by entry_date desc,id desc").all();}
export function addFinance(kind:string,category:string,amount:number,date:string,note:string, metadata:{area?:string;project?:string;metricKey?:MetricKey}={}){return db().prepare("insert into financial_entries(kind,category,amount,entry_date,note,area,project,metric_key) values(?,?,?,?,?,?,?,?)").run(kind,category,amount,date,note,metadata.area??null,metadata.project??null,metadata.metricKey??null);}
export function removeFinance(id:number){return db().prepare("delete from financial_entries where id=?").run(id);}
export function listBudgets(){return db().prepare("select * from budgets order by category").all()}
export function saveBudget(category:string,target:number){return db().prepare("insert into budgets(category,monthly_target,updated_at) values(?,?,current_timestamp) on conflict(category) do update set monthly_target=excluded.monthly_target,updated_at=current_timestamp").run(category,target)}
export function addRecord(kind:string, values:Record<string,unknown>){const store=db();const date=String(values.date ?? localDate());if(kind==="bible")return store.prepare("insert into bible_entries(book,chapters,minutes,entry_date,note) values(?,?,?,?,?)").run(values.book,values.chapters??null,values.minutes??null,date,values.note??null);if(kind==="workout"){store.prepare("insert into workouts(workout_type,duration,body_weight,notes,entry_date) values(?,?,?,?,?)").run(values.workoutType,values.duration,values.bodyWeight??null,values.notes??null,date);const id=(store.prepare("select last_insert_rowid() as id").get() as {id:number}).id;const exercises=Array.isArray(values.exercises)?values.exercises:[];for(const item of exercises){if(item&&typeof item==="object"){const x=item as Record<string,unknown>;if(x.exercise)store.prepare("insert into workout_exercises(workout_id,exercise,sets,reps,weight,rpe) values(?,?,?,?,?,?)").run(id,x.exercise,x.sets??null,x.reps??null,x.weight??null,x.rpe??null)}}return id}if(kind==="coding")return store.prepare("insert into coding_entries(problems,category,platform,entry_date,note) values(?,?,?,?,?)").run(values.problems,values.category,values.platform??null,date,values.note??null);if(kind==="pulse")return store.prepare("insert into daily_pulse(entry_date,mood,energy,stress,updated_at) values(?,?,?,?,current_timestamp) on conflict(entry_date) do update set mood=excluded.mood,energy=excluded.energy,stress=excluded.stress,updated_at=current_timestamp").run(date,values.mood,values.energy,values.stress);throw new Error("Unsupported record type");}
export function listRecords(kind:string){const tables:Record<string,string>={bible:"bible_entries",workout:"workouts",coding:"coding_entries",pulse:"daily_pulse"};const table=tables[kind];if(!table)throw new Error("Unsupported record type");return db().prepare(`select * from ${table} order by entry_date desc,id desc`).all();}
export function removeRecord(kind:string,id:number){const tables:Record<string,string>={bible:"bible_entries",workout:"workouts",coding:"coding_entries"};const table=tables[kind];if(!table)throw new Error("Unsupported record type");return db().prepare(`delete from ${table} where id=?`).run(id);}
export function getActiveSeason(today = localDate()): Season {
 const store=db(); const existing=store.prepare("select * from seasons where start_date<=? and end_date>=? order by start_date desc limit 1").get(today,today) as Season|undefined;
 if(existing) return existing;
 const start=`${today.slice(0,7)}-01`; const end=`${today.slice(0,8)}${String(daysInMonth(today)).padStart(2,"0")}`;
 store.prepare("insert or ignore into seasons(name,theme,start_date,end_date) values(?,?,?,?)").run(monthName(today),"Consistency + Execution",start,end);
 return store.prepare("select * from seasons where start_date=? and end_date=?").get(start,end) as Season;
}
export function listSeasons(){ return db().prepare("select * from seasons order by start_date desc").all(); }
export function createSeason(name:string,theme:string,startDate:string,endDate:string){ return db().prepare("insert into seasons(name,theme,start_date,end_date) values(?,?,?,?)").run(name,theme,startDate,endDate); }
export function metricTotals(season:Season): Record<MetricKey,number> { return getMetricTotals(db(),season); }
export function goalsWithProgress(today=localDate()) {
 const season=getActiveSeason(today); const snapshot=calculateTrajectorySnapshot({goals:listGoals() as Goal[],season,today,metrics:metricTotals(season),dailyValues:(metric,start,end)=>getMetricDailyValues(db(),metric,start,end)});
 return snapshot.goals;
}
export function areaMomentum(area:string,today=localDate()) { const season=getActiveSeason(today); return calculateTrajectorySnapshot({goals:listGoals() as Goal[],season,today,metrics:metricTotals(season),dailyValues:(metric,start,end)=>getMetricDailyValues(db(),metric,start,end)}).areas.find((item)=>item.area===area)?.momentum??"insufficient_data"; }
export function insights(today=localDate()){const store=db();const byType=store.prepare("select type, count(*) as count, coalesce(sum(amount),0) as total from entries group by type").all() as Array<{type:string;count:number;total:number}>;const metrics=metricTotals(getActiveSeason(today));return {byType,bibleDays:metrics.bible_days,gymSessions:metrics.gym_sessions,codingProblems:metrics.dsa_problems,deepWorkMinutes:metrics.deep_work_minutes,tutoringRevenue:metrics.tutoring_revenue};}
export function listMilestones(){return db().prepare("select * from milestones order by achieved_at desc,id desc").all();}
export function addMilestone(area:string,title:string,date:string,note:string){return db().prepare("insert into milestones(area,title,achieved_at,note) values(?,?,?,?)").run(area,title,date,note);}
export function removeMilestone(id:number){return db().prepare("delete from milestones where id=?").run(id)}
export function readSettings(){return db().prepare("select * from settings").all();}
export function saveSetting(key:string,value:string){return db().prepare("insert into settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value").run(key,value);}
export function searchEverything(term:string){const q=`%${term.trim()}%`;if(!term.trim())return [];const store=db();return [
 ...store.prepare("select 'journal' as kind,id,content as title,entry_date as date from journal where content like ?").all(q),
 ...store.prepare("select 'goal' as kind,id,title,deadline as date from goals where title like ?").all(q),
 ...store.prepare("select 'milestone' as kind,id,title,achieved_at as date from milestones where title like ?").all(q),
 ...store.prepare("select 'entry' as kind,id,detail as title,entry_date as date from entries where detail like ?").all(q)
 ];}
export function activityDays(){return db().prepare("select entry_date as date,count(*) as count from (select entry_date from entries union all select entry_date from bible_entries union all select entry_date from workouts union all select entry_date from coding_entries union all select entry_date from journal) group by entry_date order by entry_date").all();}
export function activityDaysFor(metric:string){const sql:Record<string,string>={Bible:"select entry_date as date,count(*) as count from bible_entries group by entry_date",Gym:"select entry_date as date,count(*) as count from workouts group by entry_date",Coding:"select entry_date as date,sum(problems) as count from coding_entries group by entry_date",Journal:"select entry_date as date,count(*) as count from journal group by entry_date",Overall:"select entry_date as date,count(*) as count from (select entry_date from entries union all select entry_date from bible_entries union all select entry_date from workouts union all select entry_date from coding_entries union all select entry_date from journal) group by entry_date"};return db().prepare(sql[metric]??sql.Overall).all();}
export function addEvidence(goalId:number,kind:string,value:string,note:string){return addGoalEvidence(db(),goalId,kind,value,note)}
export function listEvidence(goalId:number){return listGoalEvidence(db(),goalId)}
export function goalEvidence(goalId:number) {
 const store=db(); const goal=goalsWithProgress().find(item=>item.id===goalId); if(!goal) return [];
 const manual=(listEvidence(goalId) as Array<Record<string,unknown>>).map(item=>({...item,source:"manual"})); if(goal.tracking_mode!=="derived" || !goal.metric_key) return manual;
 let derived:Array<Record<string,unknown>>=[];
 if(goal.metric_key==="bible_days") derived=store.prepare("select id, entry_date as date, 'activity' as kind, coalesce(book,'Scripture') as value, note from bible_entries order by entry_date desc,id desc").all() as typeof derived;
 if(goal.metric_key==="gym_sessions") derived=store.prepare("select id, entry_date as date, 'activity' as kind, workout_type as value, notes as note from workouts order by entry_date desc,id desc").all() as typeof derived;
 if(goal.metric_key==="dsa_problems") derived=store.prepare("select id, entry_date as date, 'measurement' as kind, problems || ' problems' as value, trim(coalesce(category,'') || ' ' || coalesce(platform,'')) as note from coding_entries order by entry_date desc,id desc").all() as typeof derived;
 if(goal.metric_key==="deep_work_minutes") derived=store.prepare("select id, entry_date as date, 'activity' as kind, amount || ' minutes' as value, detail as note from entries where metric_key='deep_work_minutes' order by entry_date desc,id desc").all() as typeof derived;
 if(goal.metric_key==="tutoring_revenue") derived=store.prepare("select id, entry_date as date, 'measurement' as kind, 'R' || amount as value, trim(coalesce(project,'') || ' ' || coalesce(note,'')) as note from financial_entries where metric_key='tutoring_revenue' order by entry_date desc,id desc").all() as typeof derived;
 return [...derived.map(item=>({...item,source:"derived"})),...manual];
}
export function exportData(){const store=db();const tables=["entries","journal","reviews","goals","goal_evidence","financial_entries","milestones","bible_entries","workouts","workout_exercises","coding_entries","daily_pulse","settings"];return Object.fromEntries(tables.map(table=>[table,store.prepare(`select * from ${table}`).all()]));}
export function reviewSummary(){const d=insights();const priority=d.deepWorkMinutes<480?"Schedule one protected Ledgerly block before the week fills up.":"Protect the routines that are already generating evidence.";return {summary:`This week contains ${d.bibleDays} Scripture records, ${d.gymSessions} training sessions, and ${d.codingProblems} coding problems.`,priority};}
export function correlations(){const store=db();const trained=store.prepare("select avg(p.mood) as average from daily_pulse p where exists(select 1 from workouts w where w.entry_date=p.entry_date)").get() as {average:number|null};const rest=store.prepare("select avg(p.mood) as average from daily_pulse p where not exists(select 1 from workouts w where w.entry_date=p.entry_date)").get() as {average:number|null};return {gymMood:trained.average===null||rest.average===null?null:{trained:Math.round(trained.average*10)/10,rest:Math.round(rest.average*10)/10}}}
export function comparison(){const previous=db().prepare("select * from season_snapshots order by id desc limit 1").get() as Record<string,unknown>|undefined;const current=insights();return {previous,current:{month:monthName(),bible_days:current.bibleDays,gym_sessions:current.gymSessions,coding_problems:current.codingProblems,deep_work_minutes:current.deepWorkMinutes}}}
export function saveSnapshot(month:string){const d=insights();return db().prepare("insert into season_snapshots(month,bible_days,gym_sessions,coding_problems,deep_work_minutes) values(?,?,?,?,?) on conflict(month) do update set bible_days=excluded.bible_days,gym_sessions=excluded.gym_sessions,coding_problems=excluded.coding_problems,deep_work_minutes=excluded.deep_work_minutes").run(month,d.bibleDays,d.gymSessions,d.codingProblems,d.deepWorkMinutes)}
export function dashboard(today=localDate()){
 const season=getActiveSeason(today); const trajectory=calculateTrajectorySnapshot({goals:listGoals() as Goal[],season,today,metrics:metricTotals(season),dailyValues:(metric,start,end)=>getMetricDailyValues(db(),metric,start,end)});
 return {...trajectory,season,...insights(today)};
}
