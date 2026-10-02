import { NextRequest, NextResponse } from "next/server";
import { goalJourney } from "@/lib/local-db";
import { apiError, number } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) { try { const { id } = await context.params; return NextResponse.json(goalJourney(number(id, "Goal ID", { positive: true }))); } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); } }
