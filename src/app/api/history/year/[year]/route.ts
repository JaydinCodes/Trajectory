import { NextRequest, NextResponse } from "next/server";
import { historyYear } from "@/lib/local-db";
import { apiError, number } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, context: { params: Promise<{ year: string }> }) { try { const { year } = await context.params; return NextResponse.json(historyYear(number(year, "Year", { positive: true }))); } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); } }
