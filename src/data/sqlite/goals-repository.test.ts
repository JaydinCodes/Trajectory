import { describe, expect, it } from "vitest";
import { listGoals } from "./goals-repository";
import type { SqliteDatabase } from "./types";

const octoberGoal = { id: 1, season_id: 1, title: "October DSA" };
const novemberGoal = { id: 2, season_id: 2, title: "November DSA" };
const database: SqliteDatabase = { exec: () => undefined, prepare: () => ({ run: () => undefined, get: () => undefined, all: (...args) => args[0] === 1 ? [octoberGoal] : args[0] === 2 ? [novemberGoal] : [octoberGoal, novemberGoal] }) };

describe("season-scoped goals", () => {
  it("queries only goals linked to the requested active season", () => {
    expect(listGoals(database, 1)).toEqual([octoberGoal]);
    expect(listGoals(database, 2)).toEqual([novemberGoal]);
  });
});
