import type { MetricKey } from "@/lib/trajectory/types";

export const derivedMetrics: ReadonlyArray<{ key: Exclude<MetricKey, "custom">; label: string; goalType: "count" | "currency" | "duration" | "consistency" }> = [
  { key: "bible_days", label: "Bible reading days", goalType: "consistency" },
  { key: "gym_sessions", label: "Gym sessions", goalType: "count" },
  { key: "dsa_problems", label: "DSA problems", goalType: "count" },
  { key: "deep_work_minutes", label: "Deep-work minutes", goalType: "duration" },
  { key: "tutoring_revenue", label: "Tutoring revenue", goalType: "currency" },
  { key: "savings", label: "Savings", goalType: "currency" },
];
