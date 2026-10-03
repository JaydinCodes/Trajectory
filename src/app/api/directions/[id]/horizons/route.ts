import { NextRequest, NextResponse } from "next/server";
import { createHorizon } from "@/lib/local-db";
import { apiError, date, number, text } from "@/lib/validation";
import { validHorizonRange } from "@/domain/direction/horizons";
import type { HorizonType } from "@/domain/direction/types";

export const runtime = "nodejs";
const type = (value: unknown): HorizonType => { if (value === "quarter" || value === "year" || value === "custom") return value; throw new Error("Horizon type is not supported."); };

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const body = await request.json() as Record<string, unknown>; const horizonType = type(body.horizonType);
    const startDate = body.startDate ? date(body.startDate) : null; const endDate = body.endDate ? date(body.endDate) : null;
    if (!validHorizonRange(horizonType, startDate, endDate)) throw new Error("This horizon needs a valid date range.");
    const outcomes = Array.isArray(body.outcomes) ? body.outcomes.map((item) => text(item, "Outcome")).filter(Boolean).slice(0, 6) : [];
    const horizonId = createHorizon(number(id, "Direction ID", { positive: true }), { name: text(body.name, "Horizon name"), horizonType, startDate, endDate, statement: text(body.statement, "Horizon statement"), outcomes });
    return NextResponse.json({ id: horizonId }, { status: 201 });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
