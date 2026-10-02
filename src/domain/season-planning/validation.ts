import type { SeasonPlanInput } from "./types";

const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

/** Validation shared by draft saving and activation; activation applies the hard errors atomically. */
export function validateSeasonPlan(plan: SeasonPlanInput, options: { requireGoals?: boolean } = {}) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!plan.name.trim()) errors.push("Season name is required.");
  if (!plan.theme.trim()) errors.push("Season theme is required.");
  if (!dateOnly.test(plan.startDate) || !dateOnly.test(plan.endDate) || plan.endDate < plan.startDate) errors.push("Season dates must be valid and the end date must follow the start date.");
  if (options.requireGoals !== false && !plan.goals.length) errors.push("Create at least one meaningful goal before starting a season.");
  const metrics = new Set<string>();
  for (const goal of plan.goals) {
    if (!goal.title.trim() || !goal.area.trim()) errors.push("Each goal needs a title and life area.");
    if (!Number.isFinite(goal.target) || goal.target <= 0) errors.push(`“${goal.title || "Goal"}” needs a positive target.`);
    const deadline = goal.deadline ?? plan.endDate;
    if (!dateOnly.test(deadline) || deadline < plan.startDate || deadline > plan.endDate) errors.push(`“${goal.title || "Goal"}” has a deadline outside this season.`);
    if (goal.trackingMode === "derived") {
      if (!goal.metricKey) errors.push(`“${goal.title || "Goal"}” needs a tracking metric.`);
      else if (metrics.has(goal.metricKey)) errors.push(`Only one derived goal can use ${goal.metricKey} in a season.`);
      else metrics.add(goal.metricKey);
    }
    if (goal.baselineValue !== undefined && (!Number.isFinite(goal.baselineValue) || goal.baselineValue < 0 || goal.baselineValue > goal.target)) errors.push(`“${goal.title || "Goal"}” has an invalid baseline.`);
  }
  if (plan.goals.length > 8) warnings.push(`You have ${plan.goals.length} active goals. Trajectory works best with a small number of meaningful outcomes.`);
  if (plan.areaPlans.filter((area) => area.outcome.trim()).length === 0) warnings.push("Outcomes give goals their direction. Consider writing one for each active area.");
  return { errors: [...new Set(errors)], warnings };
}
