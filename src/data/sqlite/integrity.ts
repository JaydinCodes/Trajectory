import type { SqliteDatabase } from "./types";

export type IntegrityReport = { integrity: string[]; foreignKeys: Array<Record<string, unknown>>; foreignKeysEnabled: boolean };

export function integrityReport(database: SqliteDatabase): IntegrityReport {
  const integrity = (database.prepare("pragma integrity_check").all() as Array<{ integrity_check: string }>).map((row) => row.integrity_check);
  const foreignKeys = database.prepare("pragma foreign_key_check").all() as Array<Record<string, unknown>>;
  const enabled = database.prepare("pragma foreign_keys").get() as { foreign_keys: number };
  return { integrity, foreignKeys, foreignKeysEnabled: enabled.foreign_keys === 1 };
}
