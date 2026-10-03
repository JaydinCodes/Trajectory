import type { PatternWindow, WeeklyPatternRecord } from "./types";

export const windowLabels: Record<PatternWindow, string> = { "4w": "Last 4 weeks", "8w": "Last 8 weeks", "12w": "Last 12 weeks", year: "This year", all: "All history" };
export const patternWindows: PatternWindow[] = ["4w", "8w", "12w", "year", "all"];

export function weeksForWindow(weeks: WeeklyPatternRecord[], window: PatternWindow, today: string): WeeklyPatternRecord[] {
  const ordered = [...weeks].sort((left, right) => left.weekStart.localeCompare(right.weekStart));
  if (window === "all") return ordered;
  if (window === "year") return ordered.filter((week) => week.weekEnd.slice(0, 4) === today.slice(0, 4));
  const size = Number.parseInt(window, 10);
  return ordered.slice(-size);
}
