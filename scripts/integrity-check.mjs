import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const databasePath = process.env.TRAJECTORY_DB_PATH || path.join(process.cwd(), "data", "trajectory.db");
const database = new DatabaseSync(databasePath);
database.exec("pragma foreign_keys = on");
const integrity = database.prepare("pragma integrity_check").all().map((row) => row.integrity_check);
const foreignKeys = database.prepare("pragma foreign_key_check").all();
console.log(`integrity_check: ${integrity.join(", ")}`);
console.log(`foreign_key_check: ${foreignKeys.length ? JSON.stringify(foreignKeys) : "ok"}`);
if (integrity.some((value) => value !== "ok") || foreignKeys.length) process.exitCode = 1;
