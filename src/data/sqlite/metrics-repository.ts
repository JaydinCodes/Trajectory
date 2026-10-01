import type { MetricKey, Season } from "@/lib/trajectory/types";
import type { SqliteDatabase } from "./types";

const metricKeys: MetricKey[] = ["bible_days", "gym_sessions", "dsa_problems", "deep_work_minutes", "tutoring_revenue", "savings", "custom"];

export function getMetricTotals(database: SqliteDatabase, season: Season): Record<MetricKey, number> {
  const range = [season.start_date, season.end_date];
  const one = (sql: string, ...params: unknown[]) => Number((database.prepare(sql).get(...params) as { value: number } | undefined)?.value ?? 0);
  return {
    bible_days: one("select count(distinct entry_date) as value from bible_entries where entry_date between ? and ?", ...range),
    gym_sessions: one("select count(*) as value from workouts where entry_date between ? and ?", ...range),
    dsa_problems: one("select coalesce(sum(problems),0) as value from coding_entries where entry_date between ? and ?", ...range) + one("select coalesce(sum(amount),0) as value from entries where metric_key='dsa_problems' and entry_date between ? and ?", ...range),
    deep_work_minutes: one("select coalesce(sum(amount),0) as value from entries where metric_key='deep_work_minutes' and entry_date between ? and ?", ...range),
    tutoring_revenue: one("select coalesce(sum(amount),0) as value from financial_entries where metric_key='tutoring_revenue' and entry_date between ? and ?", ...range) + one("select coalesce(sum(amount),0) as value from entries where metric_key='tutoring_revenue' and entry_date between ? and ?", ...range),
    savings: one("select coalesce(sum(amount),0) as value from financial_entries where metric_key='savings' and entry_date between ? and ?", ...range),
    custom: 0,
  };
}

export function getMetricDailyValues(database: SqliteDatabase, metric: MetricKey, start: string, end: string): number[] {
  let rows: Array<{ value: number }> = [];
  if (metric === "bible_days") rows = database.prepare("select 1 as value from bible_entries where entry_date between ? and ? group by entry_date").all(start, end) as typeof rows;
  if (metric === "gym_sessions") rows = database.prepare("select 1 as value from workouts where entry_date between ? and ?").all(start, end) as typeof rows;
  if (metric === "dsa_problems") rows = database.prepare("select coalesce(sum(problems),0) as value from coding_entries where entry_date between ? and ? group by entry_date").all(start, end) as typeof rows;
  if (metric === "deep_work_minutes") rows = database.prepare("select coalesce(sum(amount),0) as value from entries where metric_key='deep_work_minutes' and entry_date between ? and ? group by entry_date").all(start, end) as typeof rows;
  if (metric === "tutoring_revenue") rows = database.prepare("select coalesce(sum(amount),0) as value from financial_entries where metric_key='tutoring_revenue' and entry_date between ? and ? group by entry_date").all(start, end) as typeof rows;
  if (!metricKeys.includes(metric)) return [];
  return rows.map((row) => Number(row.value));
}
