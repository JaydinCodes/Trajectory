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

## Next integration step

The editorial dashboard uses intentional development seed data in `src/lib/data.ts`. Persisted entries and reflections are served through the local API routes in `src/app/api/`, making the transition to a hosted database a bounded future change.
