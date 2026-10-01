import { NextRequest, NextResponse } from "next/server";
import { addReview } from "@/lib/local-db";
export const runtime="nodejs";
export async function POST(request:NextRequest){const b=await request.json() as {week:string;accomplishment:string;slipped:string;priority:string};addReview(b.week,b.accomplishment,b.slipped,b.priority);return NextResponse.json({ok:true},{status:201});}
