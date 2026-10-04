# Data integrity model

Trajectory stores raw, dated evidence in SQLite. Metrics, trajectory, reviews, history, and patterns are derived from that evidence at read time. `YYYY-MM-DD` is the only domain-date format and is resolved using `Africa/Johannesburg`.

## Invariants

- Evidence is stored against its recorded date; malformed dates are rejected at API boundaries.
- Historical calculations use only evidence and manual-goal updates dated on or before the requested as-of date and inside the relevant season.
- Derived goals resolve exclusively from the central metric repository. Manual goals resolve append-only `goal_updates` as-of the requested date.
- A carry-forward creates a new goal linked to the prior goal; it never changes the prior season's goal.
- Weekly and season reviews are keyed to their season and period. Review text never owns or deletes evidence.
- Only one active season may overlap a proposed activation range. Activation checks this under a write transaction.
- Completed season goal configuration is immutable through application services. Directions retain versions rather than replacing historical text.
- Logical multi-step writes use a short SQLite transaction and either commit completely or roll back.

## Persistence lifecycle

`schema_migrations` records ordered migrations. Existing databases are adopted by the baseline migration without reset. Before a pending structural migration, the database file is copied to `data/backups/` (the three newest backups are retained). Set `TRAJECTORY_DB_PATH` for an isolated database; production defaults to `data/trajectory.db`.

Demo data is never inserted merely because a database is empty. It is permitted only when `TRAJECTORY_SEED_DEMO=true`, which the isolated Playwright server sets explicitly.

`season_snapshots` is legacy, recomputable reporting data; it is not used as an authoritative source for trajectory or historical calculations.

## Deletion policy

Raw evidence may be deleted; all dependent calculations recalculate from remaining evidence. Workout exercises cascade with their workout. Goal, review, season, and direction deletion are intentionally not exposed as normal APIs: completed history is retained, directions are archived, and review text does not delete evidence.

## Recovery

Restore a backup by stopping the application, copying the chosen file from `data/backups/` over `data/trajectory.db`, and restarting. Run `npm run integrity:check` before and after restoration.
