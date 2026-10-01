import { NextRequest, NextResponse } from "next/server";
import { addGoal, getActiveSeason, goalsWithProgress, updateGoal } from "@/lib/local-db";
import { apiError, goalType, metric, number, text, trackingMode } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() { return NextResponse.json(goalsWithProgress()); }

export async function POST(request: NextRequest) {
  try {
   const body = await request.json() as Record<string, unknown>;
   if (body.id !== undefined) { const id=number(body.id,"Goal id",{positive:true}); const current=number(body.currentValue,"Current value",{min:0}); updateGoal(id,current,text(body.status??"active","Status")); return NextResponse.json({ok:true}); }
   const mode=trackingMode(body.trackingMode??"manual"); const metricKey=metric(body.metricKey);
   if(mode==="derived" && !metricKey) throw new Error("Derived goals need a metric key.");
   const season=getActiveSeason(); addGoal(text(body.area,"Area"),text(body.title,"Title"),goalType(body.goalType),number(body.target,"Target",{positive:true}),number(body.weight??1,"Weight",{positive:true}),typeof body.deadline==="string"?body.deadline:season.end_date,{metricKey,trackingMode:mode,seasonId:typeof body.seasonId==="number"?body.seasonId:season.id??null});
   return NextResponse.json({ ok: true }, { status: 201 });
  } catch(error) { return NextResponse.json(apiError(error), {status:400}); }
}
