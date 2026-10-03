import { describe, expect, it } from "vitest";
import { effectSize, mean, median, pearsonCorrelation, standardDeviation } from "./statistics";

describe("pattern statistics", () => {
  it("calculates robust central values while ignoring missing values", () => {
    expect(mean([1, null, 3, undefined])).toBe(2);
    expect(median([5, 1, 3, null])).toBe(3);
    expect(standardDeviation([1, 1, 1])).toBe(0);
  });
  it("rejects correlation with too little data or no variance", () => {
    expect(pearsonCorrelation([1, 2], [1, 2])).toBeNull();
    expect(pearsonCorrelation([1, 1, 1], [1, 2, 3])).toBeNull();
  });
  it("calculates correlation and effect size for usable numeric evidence", () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(effectSize([8, 9, 10], [1, 2, 3])).toBeGreaterThan(1);
  });
});
