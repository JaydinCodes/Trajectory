# Supabase migration map

The previous runtime boundary was `src/lib/local-db.ts`, which synchronously opened `data/trajectory.db`. It owns the SQLite schema and all public data methods. The migration retains it only behind `TRAJECTORY_DATA_BACKEND=sqlite` for local rollback and existing unit tests.

| SQLite records | Supabase records | Ownership / date rule |
| --- | --- | --- |
| `seasons`, `season_area_plans`, planning lessons | `seasons`, `season_area_plans`, `season_planning_lessons` | Season is user-owned; start/end values are `date`. |
| `goals`, updates, evidence | `goals`, `goal_updates`, `goal_evidence` | `user_id` plus parent ownership triggers; manual history is `effective_date`. |
| entries, finance, Bible, workouts, coding | equivalent user-owned tables | Evidence dates stay `date`; money is `numeric(15,2)`. |
| journal, milestones, pulse, reviews | equivalent user-owned tables | RLS filters every query by the authenticated owner. |
| weekly/season reviews | `weekly_reviews`, `season_reviews` | One review per user/season/time period. |
| directions and horizons | `life_directions`, versions, horizons, outcomes | Child RLS proves ownership through its parent. |

The domain calculations remain in `src/services` and `src/domain`; repositories return dated evidence, so future evidence and later manual updates cannot affect historical as-of calculations.

## Transactional writes

`complete_onboarding(jsonb)` creates the season, life areas, plans, goals, activation state, and `user_settings` together. It checks `auth.uid()` internally and is executable only by `authenticated`. This prevents both partial onboarding and cross-user writes.

## Import

`scripts/migrate-sqlite-to-supabase.mjs` requires an explicit target user and server-only service-role key. It first reports source counts in `--dry-run` mode, detects demo fixtures, maps legacy numeric IDs through `legacy_import_map`, and leaves SQLite untouched. Back up `data/trajectory.db` before applying an import.

## Validation before cutover

Run `npx supabase db reset`, RLS isolation tests with two users, `npx tsc --noEmit`, `npm run test`, `npm run build`, and authenticated Playwright flows. This workspace could not start a local Supabase stack because its Docker service was unavailable.
