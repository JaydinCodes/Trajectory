# Deployment

## Local development

Use Node `>=22.13.0 <25`, then run:

```bash
npm install
npm run dev
```

Local Trajectory is fully usable. Its authoritative database is the persistent SQLite file at `data/trajectory.db` (or `TRAJECTORY_DB_PATH` when explicitly set). The application creates the directory, applies migrations, and makes rotation backups in `data/backups/` only in this local-persistence mode.

## Environment

```env
# Optional local path override
TRAJECTORY_DB_PATH=

# Explicit local-only fixture switch; false by default
TRAJECTORY_SEED_DEMO=false
```

`TRAJECTORY_SEED_DEMO=true` is only for an intentionally created local demo database. It is refused whenever the application is running in a production environment, and must not be configured in Vercel.

## Vercel

No `vercel.json` is required: this is a standard Next.js build. Connect the GitHub repository to Vercel and use the default build pipeline:

```bash
npm ci
npx tsc --noEmit
npm test
npm run build
```

The runtime uses Node.js API routes, including all SQLite-dependent routes. Vercel preview and production deployments build safely, but do **not** provide durable Trajectory storage. The runtime detects Vercel and refuses persistence initialization rather than creating an ephemeral `data/trajectory.db` or using `/tmp` as a database. This protects previews from seeding fake records, mutating committed files, or implying that a temporary filesystem is authoritative.

`GET /api/health` is the deployment smoke check. A local instance reports `status: "ok"`, `runtime: "nodejs"`, and `persistence: "local-sqlite"`. A Vercel deployment returns HTTP 503 with `persistence: "unavailable"`, which is expected until hosted durable persistence is deliberately designed.

## Verify a deployment

Confirm the build succeeds and visit these routes to catch route or client-import failures:

- `/`, `/onboarding`, `/review`, `/review/season`, `/plan/season`
- `/history`, `/direction`, `/patterns`, `/journal`, `/milestones`, `/search`

On Vercel, `/` redirects to onboarding with a clear durable-storage notice. It must not display an empty dashboard that looks like a real user record.

## Current limitation

Local SQLite is authoritative for real user data at this stage. Vercel deployment is application and preview infrastructure only; a future durable hosted database remains an intentionally undecided architectural requirement.
