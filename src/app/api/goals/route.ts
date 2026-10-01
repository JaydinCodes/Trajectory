import { NextRequest, NextResponse } from "next/server";
import { addGoal, listGoals, updateGoal } from "@/lib/local-db";

export const runtime = "nodejs";

export async function GET() { return NextResponse.json(listGoals()); }

export async function POST(request: NextRequest) {
  let body: { area: string; title: string; goalType: string; target: number; weight: number; deadline: string; id?: number; currentValue?: number; status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid goal payload." }, { status: 400 }); }
  if (!body.area || !body.title) return NextResponse.json({ error: "An area and title are required." }, { status: 400 });
  if (body.id) updateGoal(body.id, body.currentValue ?? 0, body.status ?? "active");
  else addGoal(body.area, body.title, body.goalType, body.target, body.weight, body.deadline);
  return NextResponse.json({ ok: true }, { status: 201 });
}
