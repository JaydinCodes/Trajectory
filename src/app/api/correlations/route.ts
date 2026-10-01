import { NextResponse } from "next/server";import { correlations } from "@/lib/local-db";export const runtime="nodejs";export async function GET(){return NextResponse.json(correlations())}
