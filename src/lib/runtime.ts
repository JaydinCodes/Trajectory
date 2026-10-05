import "server-only";

/**
 * Trajectory currently has one authoritative persistence mode: a local,
 * writable SQLite file. Vercel's function filesystem is deliberately not
 * treated as a database, even though a function may be able to write briefly.
 */
export const isVercel = () => process.env.VERCEL === "1";
export const isProduction = () => process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
export const isLocalPersistenceAvailable = () => !isVercel();

export class PersistenceUnavailableError extends Error {
  constructor() {
    super("Persistent local SQLite storage is unavailable in this hosted runtime. Local SQLite is authoritative for Trajectory data at this stage.");
    this.name = "PersistenceUnavailableError";
  }
}

export function assertLocalPersistenceAvailable() {
  if (!isLocalPersistenceAvailable()) throw new PersistenceUnavailableError();
}

export function assertDemoSeedingAllowed() {
  if (process.env.TRAJECTORY_SEED_DEMO === "true" && isProduction()) {
    throw new Error("TRAJECTORY_SEED_DEMO=true is not allowed in production.");
  }
}
