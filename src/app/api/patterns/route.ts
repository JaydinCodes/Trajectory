import { NextRequest, NextResponse } from "next/server";
import { patternIntelligence } from "@/lib/local-db";
import { apiError } from "@/lib/validation";
import { patternWindows } from "@/domain/patterns/windows";
import type { PatternWindow } from "@/domain/patterns/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const rawWindow = request.nextUrl.searchParams.get("window") ?? "8w";
    if (!patternWindows.includes(rawWindow as PatternWindow)) throw new Error("Pattern window is not supported.");
    const area = request.nextUrl.searchParams.get("area")?.trim() || undefined;
    if (area && area.length > 80) throw new Error("Area is too long.");
    return NextResponse.json(patternIntelligence(rawWindow as PatternWindow, area));
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
