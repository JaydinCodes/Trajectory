# Trajectory

An editorial personal goal operating system with a responsive Today experience, separate review and reflection spaces, and testable trajectory calculations.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local database

Trajectory uses Node 24's built-in SQLite engine. The first journal entry, quick log, or weekly review creates and seeds `data/trajectory.db`; it is deliberately ignored from source control and all records remain on this machine. No account, cloud database, or environment variables are required for local use.

## Quality checks

```bash
npm run build
npm run test
```

## Pattern Intelligence

`/patterns` is a deterministic, retrospective view built from one aggregated weekly dataset; generated observations are never persisted. It uses the same Monday–Sunday ranges, dated metrics, goal snapshots, weekly-review intentions, season records, direction links, and goal lineage as the rest of the app.

- Windows are 4, 8, or 12 most recent recorded weeks, the current calendar year, or all history.
- Fewer than 3 relevant periods never produces an observation. Sample sizes of 3–5 can only be weak, 6–9 can be moderate, and 10+ can be strong; effect size/consistency can only lower confidence.
- Associations require at least 6 weekly records, two groups of at least 3, variable attention, and a non-trivial standardized difference. Mood comparisons require at least 6 workout days and 6 non-workout days.
- Seasonal monotonic trends and carry-forward observations require at least 3 completed seasons. Variability uses coefficient of variation; habit summaries use median and range.
- The UI exposes every supporting period and deliberately uses association wording. It does not make causal claims, predictions, or coaching recommendations.

## Next integration step

The editorial dashboard uses intentional development seed data in `src/lib/data.ts`. Persisted entries and reflections are served through the local API routes in `src/app/api/`, making the transition to a hosted database a bounded future change.
