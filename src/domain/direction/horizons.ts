import type { HorizonType } from "./types";

export function validHorizonRange(type: HorizonType, startDate: string | null, endDate: string | null) {
  if (type === "custom" && (!startDate || !endDate)) return false;
  return !startDate || !endDate || startDate <= endDate;
}

export function isYearHorizon(horizonType: HorizonType, startDate: string | null, endDate: string | null, year: number) {
  return horizonType === "year" && startDate === `${year}-01-01` && endDate === `${year}-12-31`;
}
