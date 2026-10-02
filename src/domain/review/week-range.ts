import { isDateOnly } from "../../lib/date-time";
import type { WeekRange } from "./types";

const offsetDate = (date: string, offset: number) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};

/** Calendar weeks are Monday through Sunday in the user's Johannesburg date boundary. */
export function getWeekRange(date: string): WeekRange {
  if (!isDateOnly(date)) throw new Error("Expected a valid YYYY-MM-DD date.");
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const startDate = offsetDate(date, -daysSinceMonday);
  return { startDate, endDate: offsetDate(startDate, 6) };
}

export function getPreviousWeekRange(dateOrRange: string | WeekRange): WeekRange {
  const range = typeof dateOrRange === "string" ? getWeekRange(dateOrRange) : dateOrRange;
  return { startDate: offsetDate(range.startDate, -7), endDate: offsetDate(range.endDate, -7) };
}

export function formatWeekLabel(range: WeekRange): string {
  const format = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Johannesburg", month: "short", day: "numeric" });
  return `${format.format(new Date(`${range.startDate}T12:00:00Z`))} — ${format.format(new Date(`${range.endDate}T12:00:00Z`))}`;
}
