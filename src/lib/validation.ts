import { isDateOnly, localDate } from "./date-time";
import type { GoalType, MetricKey, TrackingMode } from "./trajectory/types";

const metrics: MetricKey[] = ["bible_days", "gym_sessions", "dsa_problems", "deep_work_minutes", "tutoring_revenue", "savings", "custom"];
const goalTypes: GoalType[] = ["binary", "count", "numeric", "currency", "duration", "milestone", "consistency"];
export class ValidationError extends Error {}
export const text = (value: unknown, label: string, required = true) => { if (typeof value !== "string" || (required && !value.trim())) throw new ValidationError(`${label} is required.`); return value.trim(); };
export const number = (value: unknown, label: string, options:{positive?:boolean;min?:number}={}) => { const result=typeof value==="number"?value:Number(value); if(!Number.isFinite(result) || (options.positive && result<=0) || (options.min!==undefined && result<options.min)) throw new ValidationError(`${label} must be a valid${options.positive?" positive":""} number.`); return result; };
export const date = (value: unknown) => { const result=value ?? localDate(); if(!isDateOnly(result)) throw new ValidationError("Date must use YYYY-MM-DD."); return result; };
export const metric = (value: unknown) => { if(value===null || value===undefined || value==="") return null; if(!metrics.includes(value as MetricKey)) throw new ValidationError("Metric key is not supported."); return value as MetricKey; };
export const goalType = (value: unknown) => { if(!goalTypes.includes(value as GoalType)) throw new ValidationError("Goal type is not supported."); return value as GoalType; };
export const trackingMode = (value: unknown): TrackingMode => { if(value!=="manual" && value!=="derived") throw new ValidationError("Tracking mode must be manual or derived."); return value; };
export const apiError = (error: unknown) => ({ error: error instanceof Error ? error.message : "Invalid request payload." });
