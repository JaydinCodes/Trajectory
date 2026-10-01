/** Date-only values are always interpreted in the user's configured timezone. */
export const USER_TIME_ZONE = "Africa/Johannesburg";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: USER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFor = (value: Date) => Object.fromEntries(dateFormatter.formatToParts(value).map(({ type, value: part }) => [type, part]));

export function localDate(value = new Date()): string {
  const parts = partsFor(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function utcDate(date: string): Date {
  if (!isDateOnly(date)) throw new Error("Expected a valid YYYY-MM-DD date.");
  return new Date(`${date}T00:00:00.000Z`);
}

export function daysBetweenInclusive(start: string, end: string): number {
  return Math.floor((utcDate(end).getTime() - utcDate(start).getTime()) / 86_400_000) + 1;
}

export function daysInMonth(date = localDate()): number {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function dayOfMonth(date = localDate()): number {
  return Number(date.slice(8, 10));
}

export function monthProgress(date = localDate()) {
  const day = dayOfMonth(date);
  const total = daysInMonth(date);
  return { day, daysInMonth: total, elapsedPercentage: (day / total) * 100, remainingDays: total - day };
}

export function formatDashboardDate(date = localDate()): string {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: USER_TIME_ZONE, weekday: "short", day: "numeric", month: "long" }).format(utcDate(date));
}

export function monthName(date = localDate()): string {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: USER_TIME_ZONE, month: "long", year: "numeric" }).format(utcDate(date));
}
