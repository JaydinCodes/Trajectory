import { NextResponse } from "next/server";
import { databaseHealth } from "@/lib/local-db";
import { isLocalPersistenceAvailable } from "@/lib/runtime";
import { AuthenticationRequiredError, requireAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.TRAJECTORY_DATA_BACKEND === "supabase" || process.env.VERCEL === "1") {
    try {
      await requireAuthenticatedUser();
      return NextResponse.json({ status: "ok", persistence: "supabase-postgres", database: "ready" });
    } catch (error) {
      return NextResponse.json({ error: { code: "AUTH_REQUIRED", message: "Authentication is required." } }, { status: error instanceof AuthenticationRequiredError ? 401 : 503 });
    }
  }
  const health = databaseHealth();
  return NextResponse.json({ status: health.ok ? "ok" : "unavailable", runtime: "nodejs", persistence: isLocalPersistenceAvailable() ? "local-sqlite" : "unavailable", database: health.ok ? "ready" : "unavailable", schemaVersion: health.ok ? health.schemaVersion : undefined }, { status: health.ok ? 200 : 503 });
}
