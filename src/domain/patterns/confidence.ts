import type { PatternConfidence } from "./types";

export function confidenceFor(sampleSize: number, consistency = 1, effect = 1): PatternConfidence {
  if (sampleSize < 3) return "insufficient_data";
  const signal = Math.min(1, Math.max(0, consistency)) * Math.min(1, Math.max(0, effect));
  if (sampleSize >= 10 && signal >= 0.6) return "strong";
  if (sampleSize >= 6 && signal >= 0.45) return "moderate";
  return "weak";
}

export const confidenceScore: Record<PatternConfidence, number> = { insufficient_data: 0, weak: 1, moderate: 2, strong: 3 };
