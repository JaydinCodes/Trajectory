import { getWeekRange } from "../review/week-range";

export type SeasonDateRange = { startDate: string; endDate: string };

const shiftDate = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

/** ISO date strings sort chronologically, so these checks are timezone-stable date-only comparisons. */
export function isWithinSeason(date: string, season: SeasonDateRange): boolean {
  return date >= season.startDate && date <= season.endDate;
}

/** Uses the Weekly Review's Monday-to-Sunday boundaries and clips the first/last week to the season. */
export function getSeasonWeekRanges(season: SeasonDateRange): Array<SeasonDateRange & { label: string }> {
  const weeks: Array<SeasonDateRange & { label: string }> = [];
  let cursor = getWeekRange(season.startDate).startDate;
  let index = 1;
  while (cursor <= season.endDate) {
    const rawEnd = shiftDate(cursor, 6);
    weeks.push({ label: `Week ${index}`, startDate: cursor < season.startDate ? season.startDate : cursor, endDate: rawEnd > season.endDate ? season.endDate : rawEnd });
    cursor = shiftDate(cursor, 7);
    index += 1;
  }
  return weeks;
}
