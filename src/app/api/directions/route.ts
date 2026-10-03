import { NextRequest, NextResponse } from "next/server";
import { createDirection, directionOverview } from "@/lib/local-db";
import { apiError, date, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try { const asOfDate = request.nextUrl.searchParams.get("asOfDate"); return NextResponse.json(directionOverview(asOfDate ? date(asOfDate) : undefined)); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const statement = text(body.statement, "Direction statement");
    if (statement.length > 500) throw new Error("Direction statement must be 500 characters or fewer.");
    const why = text(body.why ?? "", "Why", false);
    if (why.length > 1_000) throw new Error("Why must be 1,000 characters or fewer.");
    const id = createDirection({ area: text(body.area, "Life area"), statement, why: why || null, effectiveFrom: date(body.effectiveFrom) });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
