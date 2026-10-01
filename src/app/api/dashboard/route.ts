import { NextResponse } from "next/server";import { dashboard } from "@/lib/local-db";export const runtime="nodejs";export async function GET(){return NextResponse.json(dashboard())}
