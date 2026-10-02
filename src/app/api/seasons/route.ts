import { NextRequest, NextResponse } from "next/server";
import { createSeason, getActiveSeason, listSeasons } from "@/lib/local-db";
import { apiError, date, text } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET() { try { return NextResponse.json({ active: getActiveSeason(), seasons: listSeasons() }); } catch { return NextResponse.json({ active: null, seasons: listSeasons() }); } }
export async function POST(request: NextRequest) { try { const body=await request.json() as Record<string,unknown>; const start=date(body.startDate); const end=date(body.endDate); if(end<start) throw new Error("Season end must follow its start."); createSeason(text(body.name,"Name"),text(body.theme??"","Theme",false),start,end); return NextResponse.json({ok:true},{status:201}); } catch(error) { return NextResponse.json(apiError(error),{status:400}); } }
