import { NextRequest, NextResponse } from "next/server";
import { addJournal, listJournal,removeJournal,updateJournal } from "@/lib/local-db";
import { apiError,date,text } from "@/lib/validation";
export const runtime="nodejs";
export async function GET(){return NextResponse.json(listJournal());}
export async function POST(request:NextRequest){try{const b=await request.json() as Record<string,unknown>;addJournal(text(b.entryType??"reflection","Entry type"),text(b.content,"Content"),date(b.date));return NextResponse.json({ok:true},{status:201})}catch(error){return NextResponse.json(apiError(error),{status:400})}}
export async function PATCH(request:NextRequest){const b=await request.json() as {id:number;content:string};updateJournal(b.id,b.content);return NextResponse.json({ok:true})}export async function DELETE(request:NextRequest){removeJournal(Number(request.nextUrl.searchParams.get("id")));return NextResponse.json({ok:true})}
