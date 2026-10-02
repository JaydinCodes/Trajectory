import type { GoalImportance } from "./types";

export const importanceWeights: Record<GoalImportance, number> = {
  low: 0.5,
  normal: 1,
  high: 1.5,
  critical: 2,
};

export function focusIndicator(goalCount: number, areaCount: number) {
  if (goalCount <= 4 && areaCount <= 4) return "Focused";
  if (goalCount <= 7 && areaCount <= 6) return "Balanced";
  return "Broad";
}

export function nextCalendarMonth(endDate?: string) {
  const base = new Date(`${endDate ?? new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  base.setUTCMonth(base.getUTCMonth() + 1, 1);
  const year = base.getUTCFullYear();
  const month = String(base.getUTCMonth() + 1).padStart(2, "0");
  const end = new Date(Date.UTC(year, base.getUTCMonth() + 1, 0)).getUTCDate();
  return { startDate: `${year}-${month}-01`, endDate: `${year}-${month}-${String(end).padStart(2, "0")}`, name: new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" }).format(base) };
}
