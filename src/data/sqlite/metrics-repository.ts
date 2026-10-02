import type { MetricKey, Season } from "../../lib/trajectory/types";
import type { SqliteDatabase } from "./types";

export type MetricEvent = { id: number; source: string; date: string; kind: "activity" | "measurement"; value: number; label: string; note: string | null };
export type AttentionEvent = { name: string; minutes: number };
export type MetricDateRange = Pick<Season, "start_date" | "end_date">;
const range = (season: MetricDateRange) => [season.start_date, season.end_date];

/** Returns no range before a season starts, and never extends beyond its end. */
export function metricRangeAsOf(season: MetricDateRange, asOfDate: string): MetricDateRange | null {
  if (asOfDate < season.start_date) return null;
  return { start_date: season.start_date, end_date: asOfDate < season.end_date ? asOfDate : season.end_date };
}

function intersectRanges(left: MetricDateRange, right: MetricDateRange): MetricDateRange | null {
  const start_date = left.start_date > right.start_date ? left.start_date : right.start_date;
  const end_date = left.end_date < right.end_date ? left.end_date : right.end_date;
  return start_date > end_date ? null : { start_date, end_date };
}

/** This is the sole mapping from persisted evidence to metric values. */
export function getMetricEvents(database: SqliteDatabase, metric: MetricKey, season: MetricDateRange): MetricEvent[] {
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

/** Full-season evidence is intentionally available for reports and history. */
export function getFullSeasonMetricEvents(database: SqliteDatabase, metric: MetricKey, season: MetricDateRange): MetricEvent[] {
  return getMetricEvents(database, metric, season);
}

export function getMetricEventsAsOf(database: SqliteDatabase, metric: MetricKey, season: MetricDateRange, asOfDate: string): MetricEvent[] {
  const asOfRange = metricRangeAsOf(season, asOfDate);
  return asOfRange ? getMetricEvents(database, metric, asOfRange) : [];
}

function totalsFor(eventsFor: (metric: MetricKey) => MetricEvent[]): Record<MetricKey, number> {
  const total = (metric: MetricKey) => eventsFor(metric).reduce((sum, event) => sum + Number(event.value), 0);
  const bibleDays = new Set(eventsFor("bible_days").map((event) => event.date)).size;
  return { bible_days: bibleDays, gym_sessions: total("gym_sessions"), dsa_problems: total("dsa_problems"), deep_work_minutes: total("deep_work_minutes"), tutoring_revenue: total("tutoring_revenue"), savings: total("savings"), custom: 0 };
}

export function getMetricTotals(database: SqliteDatabase, season: Season): Record<MetricKey, number> {
  return totalsFor((metric) => getFullSeasonMetricEvents(database, metric, season));
}

/** Weekly reporting uses the exact requested range while preserving metric aggregation semantics. */
export function getMetricTotalsInRange(database: SqliteDatabase, startDate: string, endDate: string): Record<MetricKey, number> {
  return totalsFor((metric) => getMetricEvents(database, metric, { start_date: startDate, end_date: endDate }));
}

/** The same persisted deep-work source used by the deep-work metric, grouped only for retrospective attention reporting. */
export function getDeepWorkAttentionInRange(database: SqliteDatabase, startDate: string, endDate: string): AttentionEvent[] {
  return database.prepare("select coalesce(nullif(project,''), nullif(area,''), 'Unassigned') as name, coalesce(sum(amount),0) as minutes from entries where metric_key='deep_work_minutes' and entry_date between ? and ? group by coalesce(nullif(project,''), nullif(area,''), 'Unassigned')").all(startDate, endDate) as AttentionEvent[];
}

/** Totals used by live trajectory calculations. Future evidence is never included. */
export function getMetricTotalsAsOf(database: SqliteDatabase, season: Season, asOfDate: string): Record<MetricKey, number> {
  const asOfRange = metricRangeAsOf(season, asOfDate);
  if (!asOfRange) return { bible_days: 0, gym_sessions: 0, dsa_problems: 0, deep_work_minutes: 0, tutoring_revenue: 0, savings: 0, custom: 0 };
  return totalsFor((metric) => getMetricEvents(database, metric, asOfRange));
}

export function getMetricDailyValues(database: SqliteDatabase, metric: MetricKey, start: string, end: string): number[] {
  const events = getMetricEvents(database, metric, { start_date: start, end_date: end });
  if (metric === "bible_days") return [...new Set(events.map((event) => event.date))].map(() => 1);
  const valuesByDay = events.reduce<Record<string, number>>((days, event) => ({ ...days, [event.date]: (days[event.date] ?? 0) + Number(event.value) }), {});
  return Object.values(valuesByDay);
}

/** Daily values are clipped to the season and requested as-of date for momentum. */
export function getMetricDailyValuesAsOf(database: SqliteDatabase, metric: MetricKey, season: MetricDateRange, asOfDate: string, start: string, end: string): number[] {
  const asOfRange = metricRangeAsOf(season, asOfDate);
  if (!asOfRange) return [];
  const requested = intersectRanges(asOfRange, { start_date: start, end_date: end });
  return requested ? getMetricDailyValues(database, metric, requested.start_date, requested.end_date) : [];
}
