import type { MetricKey, Season } from "../../lib/trajectory/types";
import type { SqliteDatabase } from "./types";

export type MetricEvent = { id: number; source: string; date: string; kind: "activity" | "measurement"; value: number; label: string; note: string | null };
const range = (season: Pick<Season, "start_date" | "end_date">) => [season.start_date, season.end_date];

/** This is the sole mapping from persisted evidence to metric values. */
export function getMetricEvents(database: SqliteDatabase, metric: MetricKey, season: Pick<Season, "start_date" | "end_date">): MetricEvent[] {
  const dates = range(season);
  if (metric === "bible_days") return database.prepare("select id, 'bible' as source, entry_date as date, 'activity' as kind, 1 as value, coalesce(book,'Scripture') as label, note from bible_entries where entry_date between ? and ? order by entry_date desc,id desc").all(...dates) as MetricEvent[];
  if (metric === "gym_sessions") return database.prepare("select id, 'workout' as source, entry_date as date, 'activity' as kind, 1 as value, workout_type as label, notes as note from workouts where entry_date between ? and ? order by entry_date desc,id desc").all(...dates) as MetricEvent[];
  if (metric === "dsa_problems") return [
    ...(database.prepare("select id, 'coding' as source, entry_date as date, 'measurement' as kind, problems as value, problems || ' problems' as label, trim(coalesce(category,'') || ' ' || coalesce(platform,'')) as note from coding_entries where entry_date between ? and ?").all(...dates) as MetricEvent[]),
    ...(database.prepare("select id, 'entry' as source, entry_date as date, 'measurement' as kind, amount as value, coalesce(amount,0) || ' problems' as label, detail as note from entries where metric_key='dsa_problems' and entry_date between ? and ?").all(...dates) as MetricEvent[]),
  ];
  if (metric === "deep_work_minutes") return database.prepare("select id, 'entry' as source, entry_date as date, 'activity' as kind, amount as value, coalesce(amount,0) || ' minutes' as label, detail as note from entries where metric_key='deep_work_minutes' and entry_date between ? and ?").all(...dates) as MetricEvent[];
  if (metric === "tutoring_revenue") return [
    ...(database.prepare("select id, 'finance' as source, entry_date as date, 'measurement' as kind, amount as value, 'R' || amount as label, trim(coalesce(project,'') || ' ' || coalesce(note,'')) as note from financial_entries where metric_key='tutoring_revenue' and entry_date between ? and ?").all(...dates) as MetricEvent[]),
    ...(database.prepare("select id, 'entry' as source, entry_date as date, 'measurement' as kind, amount as value, 'R' || amount as label, detail as note from entries where metric_key='tutoring_revenue' and entry_date between ? and ?").all(...dates) as MetricEvent[]),
  ];
  if (metric === "savings") return database.prepare("select id, 'finance' as source, entry_date as date, 'measurement' as kind, amount as value, 'R' || amount as label, note from financial_entries where metric_key='savings' and entry_date between ? and ?").all(...dates) as MetricEvent[];
  return [];
}

export function getMetricTotals(database: SqliteDatabase, season: Season): Record<MetricKey, number> {
  const total = (metric: MetricKey) => getMetricEvents(database, metric, season).reduce((sum, event) => sum + Number(event.value), 0);
  const bibleDays = new Set(getMetricEvents(database, "bible_days", season).map((event) => event.date)).size;
  return { bible_days: bibleDays, gym_sessions: total("gym_sessions"), dsa_problems: total("dsa_problems"), deep_work_minutes: total("deep_work_minutes"), tutoring_revenue: total("tutoring_revenue"), savings: total("savings"), custom: 0 };
}

export function getMetricDailyValues(database: SqliteDatabase, metric: MetricKey, start: string, end: string): number[] {
  const events = getMetricEvents(database, metric, { start_date: start, end_date: end });
  if (metric === "bible_days") return [...new Set(events.map((event) => event.date))].map(() => 1);
  const valuesByDay = events.reduce<Record<string, number>>((days, event) => ({ ...days, [event.date]: (days[event.date] ?? 0) + Number(event.value) }), {});
  return Object.values(valuesByDay);
}
