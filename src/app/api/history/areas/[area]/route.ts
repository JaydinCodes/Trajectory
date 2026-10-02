import { NextRequest, NextResponse } from "next/server";
import { areaHistory } from "@/lib/local-db";
import { apiError, text } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, context: { params: Promise<{ area: string }> }) { try { const { area } = await context.params; return NextResponse.json(areaHistory(text(decodeURIComponent(area), "Area"))); } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); } }
