import path from "node:path";
import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { localDate } from "./date-time";

const databasePath = path.join(process.cwd(), ".tmp", "tests", `onboarding-${process.pid}.db`);

describe("first-run onboarding", () => {
  beforeEach(() => { fs.rmSync(databasePath, { force: true }); vi.resetModules(); process.env.TRAJECTORY_DB_PATH = databasePath; process.env.TRAJECTORY_SEED_DEMO = "false"; });

  it("keeps a fresh database empty until onboarding completes", async () => {
    const local = await import("./local-db");
    expect(local.onboardingStatus()).toEqual({ completed: false });
    expect(local.listSeasons()).toHaveLength(0);
    expect(local.listRecords("bible")).toHaveLength(0);
    expect(local.listRecords("workout")).toHaveLength(0);
    expect(local.listRecords("coding")).toHaveLength(0);
    expect(local.listJournal()).toHaveLength(0);
    expect(local.listMilestones()).toHaveLength(0);

    const today = localDate(); const end = `${today.slice(0, 8)}${String(new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0)).getUTCDate()).padStart(2, "0")}`;
    expect(local.completeOnboarding({ name: "First season", theme: "Begin", startDate: today, endDate: end, areaPlans: [{ area: "Coding", outcome: "Build a steady practice." }], goals: [{ title: "DSA", area: "Coding", target: 20, goalType: "count", trackingMode: "derived", metricKey: "dsa_problems", importance: "normal" }], lessons: [] })).toEqual({ seasonId: 1, alreadyCompleted: false });
    expect(local.onboardingStatus()).toEqual({ completed: true });
    expect(local.listSeasons()).toHaveLength(1);
    expect(local.listGoals()).toHaveLength(1);
  });
});
