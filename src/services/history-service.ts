import { compareSeasons } from "@/domain/history/comparisons";
import { buildLifeTimeline } from "@/domain/history/timeline";
import type { LifeTimeline, SeasonComparison, SeasonTimelineItem } from "@/domain/history/types";

/** Read-model boundary: archival screens receive already date-bounded data, never live goal state. */
export function createLifeTimeline(items: SeasonTimelineItem[]): LifeTimeline { return buildLifeTimeline(items); }
export function createSeasonComparison(left: SeasonComparison["left"], right: SeasonComparison["right"]): SeasonComparison { return compareSeasons(left, right); }
