import { generatePatterns } from "@/domain/patterns/rules";
import { weeksForWindow } from "@/domain/patterns/windows";
import type { PatternDataset, PatternWindow } from "@/domain/patterns/types";

/** Application boundary: data is assembled once by the persistence adapter, then rules remain pure. */
export function calculatePatternIntelligence(dataset: PatternDataset, options: { window: PatternWindow; area?: string; today: string }) {
  const weeks = weeksForWindow(dataset.weeks, options.window, options.today);
  const selected: PatternDataset = { ...dataset, weeks };
  return { patterns: generatePatterns(selected, options.window, options.area), coverage: { ...dataset.coverage, totalWeeks: weeks.length, evidenceWeeks: weeks.filter((week) => Object.values(week.metrics).some((value) => value > 0) || week.goalMovement.length > 0).length, deepWorkWeeks: weeks.filter((week) => week.metrics.deep_work_minutes > 0).length }, availableAreas: dataset.availableAreas };
}
