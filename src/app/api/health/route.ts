import { NextResponse } from "next/server";
import { databaseHealth } from "@/lib/local-db";
import { isLocalPersistenceAvailable } from "@/lib/runtime";

export const runtime = "nodejs";

export async function GET() {
  const health = databaseHealth();
  return NextResponse.json({ status: health.ok ? "ok" : "unavailable", runtime: "nodejs", persistence: isLocalPersistenceAvailable() ? "local-sqlite" : "unavailable", database: health.ok ? "ready" : "unavailable", schemaVersion: health.ok ? health.schemaVersion : undefined }, { status: health.ok ? 200 : 503 });
}
