# Trajectory

An editorial personal goal operating system with a responsive Today experience, separate review and reflection spaces, and testable trajectory calculations.

## Local use

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Persistent local SQLite

Trajectory uses Node's built-in SQLite engine (Node `>=22.13.0 <25`). A new `data/trajectory.db` contains only the schema and migrations; the first visit opens onboarding so you can create your own first season. All records remain on this machine. No account, cloud database, or environment variables are required for local use.

### Optional demo fixtures

Demo records are never created by default. For explicitly requested visual/demo work only, set `TRAJECTORY_SEED_DEMO=true` before the database is first opened. This marks that demo database as onboarded; it does not affect existing databases.

## Vercel deployment

Vercel can build and preview the Next.js application, but it is not an authoritative Trajectory data host yet. The application deliberately refuses to use Vercel's ephemeral function filesystem for SQLite persistence. Preview deployments do not seed demo data or reuse a local database; `/api/health` reports persistence as unavailable.

For fully usable, persistent Trajectory today, run locally. A future hosted-database decision is intentionally separate from this repository stage. See [deployment notes](docs/deployment.md).

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
