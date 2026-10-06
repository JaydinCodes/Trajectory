# Trajectory

An editorial personal goal operating system with a responsive Today experience, separate review and reflection spaces, and testable trajectory calculations.

## Local use

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Persistent local SQLite rollback backend

SQLite remains available as an explicit local rollback/test backend (`TRAJECTORY_DATA_BACKEND=sqlite`). It is not suitable for Vercel production persistence.

### Supabase production setup

Set `TRAJECTORY_DATA_BACKEND=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Then apply tracked migrations with `npx supabase db push` (or `npx supabase db reset` locally). Configure the Supabase Auth Site URL for the Vercel production URL and add local/preview callback URLs ending in `/auth/callback`. Do not switch production until every private API route has been moved from `local-db.ts` to its Supabase repository and the RLS suite has passed.

Do not set a service-role key in Vercel unless running a controlled, server-only import. It must never use a `NEXT_PUBLIC_` name.

To import an existing local record, make a filesystem backup of `data/trajectory.db`, set `SUPABASE_MIGRATION_USER_ID` explicitly, and run `npm run migrate:supabase -- --dry-run` first. The import is idempotent through `legacy_import_map`; it never runs as part of the app and never deletes SQLite.

### Optional demo fixtures

Demo records are never created by default. For explicitly requested visual/demo work only, set `TRAJECTORY_SEED_DEMO=true` before the database is first opened. This marks that demo database as onboarded; it does not affect existing databases.

## Vercel deployment

Vercel never treats the function filesystem as persistent storage. The Supabase auth, onboarding, and Quick Log path is implemented; the remaining SQLite-coupled domain endpoints must be ported before production cutover.

## Quality checks

```bash
npm run build
npx tsc --noEmit
npm run test
```

## Pattern Intelligence

`/patterns` is a deterministic, retrospective view built from one aggregated weekly dataset; generated observations are never persisted. It uses the same Monday–Sunday ranges, dated metrics, goal snapshots, weekly-review intentions, season records, direction links, and goal lineage as the rest of the app.

- Windows are 4, 8, or 12 most recent recorded weeks, the current calendar year, or all history.
- Fewer than 3 relevant periods never produces an observation. Sample sizes of 3–5 can only be weak, 6–9 can be moderate, and 10+ can be strong; effect size/consistency can only lower confidence.
- Associations require at least 6 weekly records, two groups of at least 3, variable attention, and a non-trivial standardized difference. Mood comparisons require at least 6 workout days and 6 non-workout days.
- Seasonal monotonic trends and carry-forward observations require at least 3 completed seasons. Variability uses coefficient of variation; habit summaries use median and range.
- The UI exposes every supporting period and deliberately uses association wording. It does not make causal claims, predictions, or coaching recommendations.
