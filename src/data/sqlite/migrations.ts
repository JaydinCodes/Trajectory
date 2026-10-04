import fs from "node:fs";
import path from "node:path";
import type { SqliteDatabase } from "./types";
import { withTransaction } from "./transaction";

type Migration = { id: string; apply: (database: SqliteDatabase) => void };

const migrations: Migration[] = [
  // Existing installations are adopted without resetting or recreating their data.
  { id: "001_baseline_adoption", apply: () => undefined },
  { id: "002_integrity_indexes", apply: (database) => database.exec(`
    create index if not exists entries_entry_date_idx on entries(entry_date);
    create index if not exists entries_metric_date_idx on entries(metric_key,entry_date);
    create index if not exists coding_entries_entry_date_idx on coding_entries(entry_date);
    create index if not exists workouts_entry_date_idx on workouts(entry_date);
    create index if not exists bible_entries_entry_date_idx on bible_entries(entry_date);
    create index if not exists financial_entries_metric_date_idx on financial_entries(metric_key,entry_date);
    create index if not exists goals_season_status_idx on goals(season_id,status);
    create index if not exists milestones_achieved_at_idx on milestones(achieved_at);
    create index if not exists journal_entry_date_idx on journal(entry_date);
    create index if not exists weekly_reviews_week_start_idx on weekly_reviews(week_start);
  `) },
];

function backup(database: SqliteDatabase, databasePath: string) {
  const backupDir = path.join(path.dirname(databasePath), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupDir, `trajectory-${timestamp}.db`).replace(/'/g, "''");
  database.exec(`vacuum into '${target}'`);
  const backups = fs.readdirSync(backupDir).filter((file) => file.endsWith(".db")).sort().reverse();
  for (const stale of backups.slice(3)) fs.unlinkSync(path.join(backupDir, stale));
}

export function runMigrations(database: SqliteDatabase, databasePath: string) {
  database.exec("create table if not exists schema_migrations (id text primary key, applied_at text not null default current_timestamp)");
  const applied = new Set((database.prepare("select id from schema_migrations").all() as Array<{ id: string }>).map((row) => row.id));
  const pending = migrations.filter((migration) => !applied.has(migration.id));
  if (!pending.length) return migrations.length;
  if (fs.existsSync(databasePath) && fs.statSync(databasePath).size > 0) backup(database, databasePath);
  for (const migration of pending) withTransaction(database, () => {
    migration.apply(database);
    database.prepare("insert into schema_migrations(id) values(?)").run(migration.id);
  });
  return migrations.length;
}

export function schemaVersion(database: SqliteDatabase) {
  return Number((database.prepare("select count(*) as count from schema_migrations").get() as { count: number }).count);
}
