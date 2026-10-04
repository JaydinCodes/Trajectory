import { afterEach, describe, expect, it } from "vitest";
import { integrityReport } from "./integrity";
import { withTransaction } from "./transaction";

type NativeDatabase = { exec: (sql: string) => void; prepare: (sql: string) => { run: (...args: unknown[]) => unknown; get: (...args: unknown[]) => unknown; all: (...args: unknown[]) => unknown[] }; close: () => void };
const nodeSqlite: { DatabaseSync: new (path: string) => NativeDatabase } = require("node:sqlite");
const databases: NativeDatabase[] = [];
function database() { const value = new nodeSqlite.DatabaseSync(":memory:"); value.exec("pragma foreign_keys = on"); databases.push(value); return value; }
afterEach(() => databases.splice(0).forEach((database) => database.close()));

describe("SQLite integrity boundaries", () => {
  it("enforces foreign keys on every explicitly configured connection", () => {
    const db = database(); db.exec("create table parent(id integer primary key); create table child(id integer primary key,parent_id integer not null references parent(id));");
    expect(() => db.prepare("insert into child(id,parent_id) values(1,99)").run()).toThrow();
    expect(integrityReport(db).foreignKeysEnabled).toBe(true);
  });

  it("rolls back a partially failed logical write", () => {
    const db = database(); db.exec("create table records(id integer primary key,value text not null unique)");
    expect(() => withTransaction(db, () => { db.prepare("insert into records(value) values(?)").run("first"); db.prepare("insert into records(value) values(?)").run("first"); })).toThrow();
    expect(db.prepare("select count(*) as count from records").get()).toEqual({ count: 0 });
  });
});
