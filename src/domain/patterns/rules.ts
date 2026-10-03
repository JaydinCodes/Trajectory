import type { MetricKey } from "@/lib/trajectory/types";
import { confidenceFor, confidenceScore } from "./confidence";
import { effectSize, mean, median, normalizedSpread } from "./statistics";
import type { GoalLineageRecord, PatternDataset, PatternObservation, PatternWindow, SeasonPatternRecord, WeeklyPatternRecord } from "./types";
import { windowLabels } from "./windows";

const round = (value: number) => Math.round(value * 10) / 10;
const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
const areaMatches = (value: string | undefined, area: string) => value?.toLocaleLowerCase().includes(area.toLocaleLowerCase()) ?? false;

function observation(input: Omit<PatternObservation, "timeWindow" | "score"> & { score?: number }, window: PatternWindow): PatternObservation {
  const confidenceWeight = confidenceScore[input.confidence];
  return { ...input, timeWindow: windowLabels[window], score: input.score ?? confidenceWeight * 100 + input.sampleSize };
}

function areaFilter(weeks: WeeklyPatternRecord[], area?: string) {
  // A zero is evidence too. Filtering out weeks with no area activity would turn a
  // seven-week record into a misleading one-week record for area-specific rules.
  return weeks;
}

export function consistencyPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const definitions: Array<{ area: string; metric: MetricKey; minimum: number; title: string; label: string }> = [
    { area: "Faith", metric: "bible_days", minimum: 4, title: "Bible reading consistency", label: "Bible reading was recorded on at least 4 days" },
    { area: "Fitness", metric: "gym_sessions", minimum: 1, title: "Fitness consistency", label: "At least one fitness session was recorded" },
    { area: "Coding", metric: "dsa_problems", minimum: 1, title: "Coding consistency", label: "DSA activity was recorded" },
  ];
  return definitions.filter((definition) => !area || definition.area === area).flatMap((definition) => {
    let streak: WeeklyPatternRecord[] = [];
    for (const week of [...weeks].reverse()) { if (week.metrics[definition.metric] >= definition.minimum) streak.push(week); else break; }
    if (streak.length < 3) return [];
    const confidence = confidenceFor(streak.length, 1, Math.min(1, streak.length / 6));
    return [observation({ id: `consistency:${definition.metric}`, category: "consistency", title: definition.title, statement: `${definition.label} in each of the last ${streak.length} recorded weeks.`, sampleSize: streak.length, confidence, relatedAreas: [definition.area], relatedMetrics: [definition.metric], firstObserved: streak.at(-1)?.weekStart, lastObserved: streak[0]?.weekEnd, evidence: streak.reverse().map((week) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: definition.metric === "bible_days" ? "Reading days" : definition.metric === "gym_sessions" ? "Sessions" : "DSA problems", value: week.metrics[definition.metric] }] })) }, window)];
  });
}

export function repeatedStallPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const grouped = new Map<string, Array<{ week: WeeklyPatternRecord; goal: WeeklyPatternRecord["goalMovement"][number] }>>();
  weeks.forEach((week) => week.goalMovement.filter((goal) => !area || goal.area === area).forEach((goal) => {
    const key = `${goal.area}:${goal.title}`; grouped.set(key, [...(grouped.get(key) ?? []), { week, goal }]);
  }));
  return [...grouped.values()].flatMap((history) => {
    const stalled = history.filter(({ goal }) => goal.movement === "stalled" || goal.movement === "drifted");
    if (history.length < 3 || stalled.length < 3) return [];
    const goal = history[0].goal; const confidence = confidenceFor(history.length, stalled.length / history.length, stalled.length / history.length);
    return [observation({ id: `stalls:${goal.id}`, category: "goal_progress", title: `${goal.area}: repeated stalled weeks`, statement: `${goal.title} recorded no meaningful movement in ${stalled.length} of ${history.length} observed weeks.`, sampleSize: history.length, confidence, relatedAreas: [goal.area], evidence: history.map(({ week, goal: item }) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: "Movement", value: item.movement }, { label: "Goal change", value: `${round(item.progressChange)} points` }] })) }, window)];
  });
}

export function focusAlignmentPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const areas = area ? [area] : [...new Set(weeks.flatMap((week) => [...Object.keys(week.deepWorkByArea), ...week.goalMovement.map((goal) => goal.area)]))];
  return areas.flatMap((name) => {
    const selected = weeks.filter((week) => areaMatches(week.primaryFocus, name));
    if (selected.length < 3) return [];
    const meaningful = selected.filter((week) => (week.deepWorkByArea[name] ?? 0) > 0);
    const focusedAverage = mean(selected.map((week) => week.deepWorkByArea[name] ?? 0)) ?? 0;
    const otherAverage = mean(weeks.filter((week) => !selected.includes(week)).map((week) => week.deepWorkByArea[name] ?? 0)) ?? 0;
    const confidence = confidenceFor(selected.length, meaningful.length / selected.length, Math.min(1, Math.abs(focusedAverage - otherAverage) / Math.max(60, focusedAverage, otherAverage)));
    return [observation({ id: `focus:${name.toLowerCase()}`, category: "focus_alignment", title: `${name}: planned versus recorded attention`, statement: `${name} was selected as a primary focus in ${selected.length} weeks. Meaningful ${name} deep-work attention was recorded in ${meaningful.length} of those weeks.`, sampleSize: selected.length, confidence, relatedAreas: [name], relatedMetrics: ["deep_work_minutes"], evidence: selected.map((week) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: "Primary focus", value: week.primaryFocus ?? "" }, { label: "Deep work", value: `${week.deepWorkByArea[name] ?? 0} min` }] })) }, window)];
  });
}

export function attentionProgressPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const areas = area ? [area] : [...new Set(weeks.flatMap((week) => [...Object.keys(week.deepWorkByArea), ...week.goalMovement.map((goal) => goal.area)]))];
  return areas.flatMap((name) => {
    const values = weeks.map((week) => ({ week, attention: week.deepWorkByArea[name] ?? 0, progress: week.goalMovement.filter((goal) => goal.area === name).reduce((sum, goal) => sum + goal.progressChange, 0) }));
    if (values.length < 6 || new Set(values.map((item) => item.attention)).size < 2) return [];
    const threshold = median(values.map((item) => item.attention)) ?? 0;
    const attended = values.filter((item) => item.attention >= threshold && item.attention > 0);
    const lessAttended = values.filter((item) => item.attention < threshold);
    if (attended.length < 3 || lessAttended.length < 3) return [];
    const high = mean(attended.map((item) => item.progress)) ?? 0; const low = mean(lessAttended.map((item) => item.progress)) ?? 0;
    const effect = effectSize(attended.map((item) => item.progress), lessAttended.map((item) => item.progress));
    if (effect === null || Math.abs(effect) < 0.3) return [];
    const confidence = confidenceFor(values.length, Math.min(1, Math.abs(effect) / 1.2), Math.min(1, Math.abs(effect) / 1.2));
    return [observation({ id: `attention-progress:${name.toLowerCase()}`, category: "correlation", title: `${name}: attention and goal movement`, statement: `Weeks with at least ${duration(threshold)} of ${name}-related deep work were associated with an average ${round(high)} percentage-point goal change, compared with ${round(low)} in other recorded weeks.`, sampleSize: values.length, confidence, relatedAreas: [name], relatedMetrics: ["deep_work_minutes"], evidence: values.map(({ week, attention, progress }) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: "Deep work", value: `${attention} min` }, { label: "Goal change", value: `${round(progress)} points` }] })) }, window)];
  });
}

export function strongestWeekPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const relevant = areaFilter(weeks, area); if (relevant.length < 6) return [];
  const top = [...relevant].sort((left, right) => right.trajectoryChange - left.trajectoryChange).slice(0, Math.min(3, Math.floor(relevant.length / 2)));
  const other = relevant.filter((week) => !top.includes(week));
  const topWork = mean(top.map((week) => Object.values(week.deepWorkByArea).reduce((sum, minutes) => sum + minutes, 0))) ?? 0;
  const otherWork = mean(other.map((week) => Object.values(week.deepWorkByArea).reduce((sum, minutes) => sum + minutes, 0))) ?? 0;
  const effect = effectSize(top.map((week) => Object.values(week.deepWorkByArea).reduce((sum, minutes) => sum + minutes, 0)), other.map((week) => Object.values(week.deepWorkByArea).reduce((sum, minutes) => sum + minutes, 0)));
  const confidence = confidenceFor(relevant.length, effect === null ? 0.4 : Math.min(1, Math.abs(effect) / 1.2), topWork > otherWork ? 1 : 0.5);
  return [observation({ id: `strongest-weeks${area ? `:${area.toLowerCase()}` : ""}`, category: "attention", title: "Your strongest weeks", statement: `Your top ${top.length} weeks by overall trajectory improvement averaged ${duration(topWork)} of recorded deep work; other recorded weeks averaged ${duration(otherWork)}. This comparison describes what coincided with those weeks.`, sampleSize: relevant.length, confidence, relatedAreas: area ? [area] : undefined, relatedMetrics: ["deep_work_minutes"], evidence: top.map((week) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: "Trajectory change", value: `${round(week.trajectoryChange)} points` }, { label: "Deep work", value: `${Object.values(week.deepWorkByArea).reduce((sum, minutes) => sum + minutes, 0)} min` }] })) }, window)];
}

/** Uses the existing trajectory momentum labels captured in the weekly dataset; it does not invent a second model. */
export function recoveryAndMomentumPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const areas = area ? [area] : [...new Set(weeks.flatMap((week) => week.goalMovement.map((goal) => goal.area)))];
  return areas.flatMap((name) => {
    const transitions = weeks.slice(0, -1).map((week, index) => ({ week, next: weeks[index + 1], goals: week.goalMovement.filter((goal) => goal.area === name), nextGoals: weeks[index + 1].goalMovement.filter((goal) => goal.area === name) }));
    const recoveryCases = transitions.filter((item) => item.goals.some((goal) => goal.movement === "stalled" || goal.movement === "drifted"));
    const recovered = recoveryCases.filter((item) => item.nextGoals.some((goal) => goal.movement === "advanced" || goal.movement === "completed"));
    const patterns: PatternObservation[] = [];
    if (recoveryCases.length >= 3) patterns.push(observation({ id: `recovery:${name.toLowerCase()}`, category: "recovery", title: `${name}: recovery after stalled weeks`, statement: `After ${name} recorded a stalled week, the following week included recorded goal movement in ${recovered.length} of ${recoveryCases.length} observed cases.`, sampleSize: recoveryCases.length, confidence: confidenceFor(recoveryCases.length, recovered.length / recoveryCases.length, recovered.length / recoveryCases.length), relatedAreas: [name], evidence: recoveryCases.map((item) => ({ label: `${item.week.weekStart} – ${item.next.weekEnd}`, period: { startDate: item.week.weekStart, endDate: item.next.weekEnd }, values: [{ label: "Stalled week", value: item.week.weekStart }, { label: "Following week movement", value: recovered.includes(item) ? "Recorded" : "None recorded" }] })) }, window));
    const accelerating = transitions.filter((item) => item.goals.some((goal) => goal.momentum === "accelerating"));
    const stayedPositive = accelerating.filter((item) => item.nextGoals.some((goal) => goal.movement === "advanced" || goal.movement === "completed"));
    if (accelerating.length >= 3) patterns.push(observation({ id: `momentum:${name.toLowerCase()}`, category: "goal_progress", title: `${name}: momentum persistence`, statement: `When ${name} entered accelerating momentum, recorded goal movement remained positive in the following week in ${stayedPositive.length} of ${accelerating.length} observed cases.`, sampleSize: accelerating.length, confidence: confidenceFor(accelerating.length, stayedPositive.length / accelerating.length, stayedPositive.length / accelerating.length), relatedAreas: [name], evidence: accelerating.map((item) => ({ label: `${item.week.weekStart} – ${item.next.weekEnd}`, period: { startDate: item.week.weekStart, endDate: item.next.weekEnd }, values: [{ label: "Momentum", value: "accelerating" }, { label: "Following movement", value: stayedPositive.includes(item) ? "positive" : "not positive" }] })) }, window));
    return patterns;
  });
}

export function habitAndConcentrationPatterns(weeks: WeeklyPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const results: PatternObservation[] = [];
  const habits: Array<{ metric: MetricKey; area: string; label: string }> = [{ metric: "gym_sessions", area: "Fitness", label: "Fitness sessions" }, { metric: "bible_days", area: "Faith", label: "Bible reading days" }, { metric: "dsa_problems", area: "Coding", label: "DSA problems" }];
  for (const habit of habits.filter((item) => !area || item.area === area)) {
    const values = weeks.map((week) => week.metrics[habit.metric]).filter((value) => value > 0);
    if (values.length < 3) continue;
    const middle = median(values) ?? 0; const min = Math.min(...values); const max = Math.max(...values);
    results.push(observation({ id: `stability:${habit.metric}`, category: "consistency", title: `${habit.area}: habit stability`, statement: `${habit.label} had a median of ${round(middle)} per recorded week, with a range of ${min}–${max}.`, sampleSize: values.length, confidence: confidenceFor(values.length, 1 - Math.min(1, (max - min) / Math.max(1, middle * 2)), 0.7), relatedAreas: [habit.area], relatedMetrics: [habit.metric], evidence: weeks.map((week) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: habit.label, value: week.metrics[habit.metric] }] })) }, window));
    const spread = normalizedSpread(values);
    if (spread !== null && spread >= 0.75 && values.length >= 6) results.push(observation({ id: `variability:${habit.metric}`, category: "consistency", title: `${habit.area}: variable weekly output`, statement: `${habit.label} varied substantially week to week across the last ${values.length} recorded weeks.`, sampleSize: values.length, confidence: confidenceFor(values.length, Math.min(1, spread), Math.min(1, spread)), relatedAreas: [habit.area], relatedMetrics: [habit.metric], evidence: weeks.map((week) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: habit.label, value: week.metrics[habit.metric] }] })) }, window));
  }
  const totals = new Map<string, number>(); weeks.forEach((week) => Object.entries(week.deepWorkByArea).forEach(([name, minutes]) => totals.set(name, (totals.get(name) ?? 0) + minutes)));
  const grandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const leader = [...totals.entries()].sort((left, right) => right[1] - left[1])[0];
  if (leader && grandTotal > 0 && (!area || leader[0] === area)) results.push(observation({ id: `concentration:${leader[0].toLowerCase()}`, category: "attention", title: "Attention concentration", statement: `${leader[0]} received ${Math.round(leader[1] / grandTotal * 100)}% of all recorded deep-work time in this window.`, sampleSize: weeks.length, confidence: confidenceFor(weeks.length, leader[1] / grandTotal, leader[1] / grandTotal), relatedAreas: [leader[0]], relatedMetrics: ["deep_work_minutes"], evidence: weeks.filter((week) => (week.deepWorkByArea[leader[0]] ?? 0) > 0).map((week) => ({ label: `${week.weekStart} – ${week.weekEnd}`, period: { startDate: week.weekStart, endDate: week.weekEnd }, values: [{ label: `${leader[0]} deep work`, value: `${week.deepWorkByArea[leader[0]]} min` }] })) }, window));
  return results;
}

export function seasonalPatterns(seasons: SeasonPatternRecord[], window: PatternWindow, area?: string): PatternObservation[] {
  const completed = seasons.filter((season) => season.completed).sort((left, right) => left.startDate.localeCompare(right.startDate));
  if (completed.length < 3) return [];
  const results: PatternObservation[] = [];
  for (const metric of ["dsa_problems", "deep_work_minutes", "gym_sessions"] as MetricKey[]) {
    if (area && !((metric === "dsa_problems" && area === "Coding") || (metric === "gym_sessions" && area === "Fitness") || metric === "deep_work_minutes")) continue;
    const last = completed.slice(-3); const values = last.map((season) => season.metrics[metric]);
    if (values[0] < values[1] && values[1] < values[2]) results.push(observation({ id: `seasonal:${metric}`, category: "seasonal", title: `${metric === "dsa_problems" ? "DSA" : metric === "gym_sessions" ? "Fitness" : "Deep work"}: three-season trend`, statement: `${metric === "dsa_problems" ? "DSA problems" : metric === "gym_sessions" ? "Fitness sessions" : "Deep work"} increased across three completed seasons.`, sampleSize: 3, confidence: "weak", relatedAreas: metric === "dsa_problems" ? ["Coding"] : metric === "gym_sessions" ? ["Fitness"] : undefined, relatedMetrics: [metric], evidence: last.map((season) => ({ label: season.name, period: { startDate: season.startDate, endDate: season.endDate }, values: [{ label: metric === "deep_work_minutes" ? "Deep work" : metric === "dsa_problems" ? "DSA problems" : "Sessions", value: season.metrics[metric] }] })) }, window));
  }
  return results;
}

export function directionAndLineagePatterns(dataset: PatternDataset, window: PatternWindow, area?: string): PatternObservation[] {
  const completed = dataset.seasons.filter((season) => season.completed && (!area || season.goalAreas.includes(area))).sort((left, right) => right.startDate.localeCompare(left.startDate));
  const patterns: PatternObservation[] = [];
  for (const direction of [...new Set(completed.flatMap((season) => season.directionAreas))]) {
    if (area && direction !== area) continue;
    const recent = completed.slice(0, 5); const linked = recent.filter((season) => season.directionAreas.includes(direction));
    if (recent.length >= 3 && linked.length) patterns.push(observation({ id: `direction:${direction.toLowerCase()}`, category: "direction_alignment", title: `${direction}: direction alignment`, statement: `${linked.length} of the last ${recent.length} completed seasons included at least one goal connected to your ${direction} direction.`, sampleSize: recent.length, confidence: confidenceFor(recent.length, linked.length / recent.length, linked.length / recent.length), relatedAreas: [direction], evidence: recent.map((season) => ({ label: season.name, period: { startDate: season.startDate, endDate: season.endDate }, values: [{ label: "Linked goal", value: season.directionAreas.includes(direction) ? "Yes" : "No" }] })) }, window));
  }
  const byRoot = new Map<number, GoalLineageRecord[]>();
  for (const item of dataset.lineages) { let root = item; const visited = new Set<number>(); while (root.carriedFromGoalId !== null && !visited.has(root.id)) { visited.add(root.id); const parent = dataset.lineages.find((candidate) => candidate.id === root.carriedFromGoalId); if (!parent) break; root = parent; } byRoot.set(root.id, [...(byRoot.get(root.id) ?? []), item]); }
  for (const chain of byRoot.values()) { const ordered = [...chain].sort((left, right) => left.seasonStart.localeCompare(right.seasonStart)); if (ordered.length < 3) continue; const latest = ordered.at(-1)!; if (area && latest.area !== area) continue; patterns.push(observation({ id: `carry-forward:${ordered[0].id}`, category: "goal_progress", title: `${latest.area}: carry-forward history`, statement: `${latest.title} was carried across ${ordered.length} seasons. The record shows the goal required multiple seasons to complete.`, sampleSize: ordered.length, confidence: confidenceFor(ordered.length, 1, 0.7), relatedAreas: [latest.area], evidence: ordered.map((item) => ({ label: item.seasonName, values: [{ label: "Progress", value: `${round(item.progress)}%` }, { label: "Completed", value: item.completed ? "Yes" : "No" }] })) }, window)); }
  return patterns;
}

export function moodPatterns(dataset: PatternDataset, window: PatternWindow): PatternObservation[] {
  const workout = dataset.moodDays.filter((day) => day.workout); const rest = dataset.moodDays.filter((day) => !day.workout);
  if (workout.length < 6 || rest.length < 6) return [];
  const workoutAverage = mean(workout.map((day) => day.mood)) ?? 0; const restAverage = mean(rest.map((day) => day.mood)) ?? 0;
  const effect = effectSize(workout.map((day) => day.mood), rest.map((day) => day.mood));
  if (effect === null || Math.abs(effect) < 0.3) return [];
  return [observation({ id: "mood:workout", category: "correlation", title: "Mood and training", statement: `Recorded mood was ${workoutAverage >= restAverage ? "higher" : "lower"} on workout days (${round(workoutAverage)}) than on non-workout days (${round(restAverage)}). This is an association in recorded days, not a causal conclusion.`, sampleSize: workout.length + rest.length, confidence: confidenceFor(workout.length + rest.length, Math.min(1, Math.abs(effect) / 1.2), Math.min(1, Math.abs(effect) / 1.2)), relatedAreas: ["Fitness"], evidence: [{ label: "Workout days", values: [{ label: "Average mood", value: round(workoutAverage) }, { label: "Recorded days", value: workout.length }] }, { label: "Non-workout days", values: [{ label: "Average mood", value: round(restAverage) }, { label: "Recorded days", value: rest.length }] }] }, window)];
}

/** Runs only deterministic rules over one pre-aggregated dataset. */
export function generatePatterns(dataset: PatternDataset, window: PatternWindow, area?: string): PatternObservation[] {
  const weeks = areaFilter(dataset.weeks, area);
  const raw = [...consistencyPatterns(weeks, window, area), ...repeatedStallPatterns(weeks, window, area), ...focusAlignmentPatterns(weeks, window, area), ...attentionProgressPatterns(weeks, window, area), ...strongestWeekPatterns(weeks, window, area), ...recoveryAndMomentumPatterns(weeks, window, area), ...habitAndConcentrationPatterns(weeks, window, area), ...seasonalPatterns(dataset.seasons, window, area), ...directionAndLineagePatterns(dataset, window, area), ...moodPatterns(dataset, window)];
  const seen = new Set<string>();
  return raw.filter((pattern) => pattern.confidence !== "insufficient_data").sort((left, right) => right.score - left.score).filter((pattern) => { const key = `${pattern.relatedAreas?.join(",") ?? "all"}:${pattern.category}`; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 8);
}
