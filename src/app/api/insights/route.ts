import { NextResponse } from "next/server";import { insights } from "@/lib/local-db";export const runtime="nodejs";export async function GET(){return NextResponse.json(insights())}
