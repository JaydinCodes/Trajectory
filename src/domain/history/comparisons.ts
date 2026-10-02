import type { HistoryMetric, SeasonComparison } from "./types";

export function metricComparison(left: HistoryMetric[], right: HistoryMetric[]) {
  const keys = new Set([...left.map((item) => item.key), ...right.map((item) => item.key)]);
  return [...keys].map((key) => ({ key, label: left.find((item) => item.key === key)?.label ?? right.find((item) => item.key === key)?.label ?? key, left: left.find((item) => item.key === key)?.total ?? 0, right: right.find((item) => item.key === key)?.total ?? 0 }));
}

export function compareSeasons(left: SeasonComparison["left"], right: SeasonComparison["right"]): SeasonComparison { return { left, right }; }
