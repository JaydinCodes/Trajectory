import { NextResponse } from "next/server";
import { lifeTimeline } from "@/lib/local-db";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json(lifeTimeline()); }
