import { describe, expect, it } from "vitest";
import { metricComparison } from "./comparisons";

describe("season comparison", () => {
  it("compares matching metrics descriptively without dropping a season-only metric", () => {
    expect(metricComparison([{ key: "dsa_problems", label: "DSA problems", total: 82 }, { key: "gym_sessions", label: "Gym sessions", total: 13 }], [{ key: "dsa_problems", label: "DSA problems", total: 100 }])).toEqual([
      { key: "dsa_problems", label: "DSA problems", left: 82, right: 100 },
      { key: "gym_sessions", label: "Gym sessions", left: 13, right: 0 },
    ]);
  });
});
