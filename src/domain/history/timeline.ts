import type { LifeTimeline, SeasonTimelineItem } from "./types";

export function chronologicalSeasons(items: SeasonTimelineItem[]) {
  return [...items].sort((left, right) => right.season.startDate.localeCompare(left.season.startDate) || right.season.id - left.season.id);
}

export function groupTimelineByStartYear(items: SeasonTimelineItem[]): LifeTimeline["years"] {
  const grouped = new Map<number, SeasonTimelineItem[]>();
  for (const item of chronologicalSeasons(items)) {
    const year = Number(item.season.startDate.slice(0, 4));
    grouped.set(year, [...(grouped.get(year) ?? []), item]);
  }
  return [...grouped.entries()].sort(([left], [right]) => right - left).map(([year, seasons]) => ({ year, seasons }));
}

export function buildLifeTimeline(items: SeasonTimelineItem[]): LifeTimeline {
  const seasons = chronologicalSeasons(items);
  return { seasons, years: groupTimelineByStartYear(seasons) };
}
