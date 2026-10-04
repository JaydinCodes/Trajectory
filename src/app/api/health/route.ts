import { NextResponse } from "next/server";
import { databaseHealth } from "@/lib/local-db";

export const runtime = "nodejs";

export async function GET() {
  const health = databaseHealth();
  return NextResponse.json({ ok: health.ok, database: health.ok ? "ready" : "unavailable", schemaVersion: health.schemaVersion }, { status: health.ok ? 200 : 503 });
}
