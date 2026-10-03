import { NextRequest, NextResponse } from "next/server";
import { listDirectionVersions, setDirectionStatus, updateDirection } from "@/lib/local-db";
import { apiError, date, number, text } from "@/lib/validation";

export const runtime = "nodejs";
const status = (value: unknown) => { if (value === "active" || value === "paused" || value === "archived") return value; throw new Error("Direction status is not supported."); };

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try { const { id } = await context.params; return NextResponse.json({ versions: listDirectionVersions(number(id, "Direction ID", { positive: true })) }); }
  catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const directionId = number(id, "Direction ID", { positive: true }); const body = await request.json() as Record<string, unknown>;
    if (body.status !== undefined) setDirectionStatus(directionId, status(body.status));
    else {
      const statement = text(body.statement, "Direction statement"); const why = text(body.why ?? "", "Why", false);
      if (statement.length > 500 || why.length > 1_000) throw new Error("Direction text is too long.");
      updateDirection(directionId, { area: text(body.area, "Life area"), statement, why: why || null, effectiveFrom: date(body.effectiveFrom) });
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); }
}
