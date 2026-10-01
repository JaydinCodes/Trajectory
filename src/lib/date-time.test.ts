import { describe, expect, it } from "vitest";
import { dayOfMonth, daysInMonth, localDate, monthProgress } from "./date-time";
describe("Johannesburg dates",()=>{
 it("does not use UTC date at a Johannesburg month boundary",()=>expect(localDate(new Date("2026-10-31T22:30:00.000Z"))).toBe("2026-11-01"));
 it("handles February and month end",()=>{expect(daysInMonth("2028-02-29")).toBe(29);expect(dayOfMonth("2026-10-31")).toBe(31);expect(monthProgress("2026-10-31")).toMatchObject({remainingDays:0,elapsedPercentage:100});});
});
