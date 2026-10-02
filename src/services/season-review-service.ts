import { buildSeasonReview } from "@/domain/season-review/review-analysis";
import type { SeasonReview, SeasonReviewInputs } from "@/domain/season-review/types";

/** Application-service boundary for season retrospective orchestration. */
export function calculateSeasonReview(input: SeasonReviewInputs): SeasonReview {
  return buildSeasonReview(input);
}
