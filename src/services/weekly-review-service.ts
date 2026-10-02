import { buildWeeklyReviewAnalysis } from "@/domain/review/review-analysis";
import type { WeeklyReviewAnalysis, WeeklyReviewInputs } from "@/domain/review/types";

/** Application service boundary for weekly review orchestration. Data adapters supply evidence and snapshots. */
export function calculateWeeklyReview(input: WeeklyReviewInputs): WeeklyReviewAnalysis {
  return buildWeeklyReviewAnalysis(input);
}
