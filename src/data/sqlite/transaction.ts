import type { SqliteDatabase } from "./types";

/** Executes a short, write-locked SQLite transaction with one consistent rollback path. */
export function withTransaction<T>(database: SqliteDatabase, operation: () => T): T {
  database.exec("begin immediate");
  try {
    const result = operation();
    database.exec("commit");
    return result;
  } catch (error) {
    database.exec("rollback");
    throw error;
  }
}
