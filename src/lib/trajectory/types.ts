export type MetricKey = "bible_days" | "gym_sessions" | "dsa_problems" | "deep_work_minutes" | "tutoring_revenue" | "savings" | "custom";
export type GoalType = "binary" | "count" | "numeric" | "currency" | "duration" | "milestone" | "consistency";
export type TrackingMode = "derived" | "manual";
export type TrajectoryStatus = "ahead" | "on_track" | "slightly_behind" | "behind" | "completed";
export type Momentum = "accelerating" | "steady" | "slowing" | "stalled" | "insufficient_data";

export type Season = { id?: number; name: string; theme: string; intention?: string | null; start_date: string; end_date: string; status?: "draft" | "active" | "completed"; activated_at?: string | null; completed_at?: string | null; previous_season_id?: number | null };
export type Goal = { id: number; area: string; title: string; goal_type: GoalType; target: number; current_value: number; baseline_value?: number; weight: number; deadline: string | null; status: string; metric_key: MetricKey | null; tracking_mode: TrackingMode; season_id: number | null; carried_from_goal_id?: number | null };
export type GoalProgress = Goal & { current: number; actualPercentage: number; expectedPercentage: number; expectedValue: number; deltaPercentage: number; projectedValue: number; projectedPercentage: number; trajectoryStatus: TrajectoryStatus };
