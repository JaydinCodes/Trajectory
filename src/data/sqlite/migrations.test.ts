import { afterEach, describe, expect, it } from "vitest";
import { runMigrations, schemaVersion } from "./migrations";

type NativeDatabase = { exec: (sql: string) => void; prepare: (sql: string) => { run: (...args: unknown[]) => unknown; get: (...args: unknown[]) => unknown; all: (...args: unknown[]) => unknown[] }; close: () => void };
const nodeSqlite: { DatabaseSync: new (path: string) => NativeDatabase } = require("node:sqlite");
const databases: NativeDatabase[] = [];

function legacyDatabase() {
 const database = new nodeSqlite.DatabaseSync(":memory:");
 database.exec(`
  create table entries(id integer primary key, entry_date text, metric_key text);
  create table coding_entries(id integer primary key, entry_date text);
  create table workouts(id integer primary key, entry_date text);
  create table bible_entries(id integer primary key, entry_date text);
  create table financial_entries(id integer primary key, metric_key text, entry_date text);
  create table goals(id integer primary key, season_id integer, status text);
  create table milestones(id integer primary key, achieved_at text);
  create table journal(id integer primary key, entry_date text);
  create table weekly_reviews(id integer primary key, week_start text);
  insert into entries(entry_date,metric_key) values('2026-10-02','dsa_problems');
 `);
 databases.push(database);
 return database;
}

afterEach(() => databases.splice(0).forEach((database) => database.close()));

describe("SQLite migrations", () => {
 it("adopts an existing schema without resetting its records and is idempotent", () => {
  const database = legacyDatabase();
  expect(runMigrations(database, ":memory:")).toBe(3);
  expect(database.prepare("select entry_date,metric_key from entries").get()).toEqual({ entry_date: "2026-10-02", metric_key: "dsa_problems" });
  expect(schemaVersion(database)).toBe(3);
  expect(runMigrations(database, ":memory:")).toBe(3);
  expect(database.prepare("select count(*) as count from schema_migrations").get()).toEqual({ count: 3 });
 });
});
