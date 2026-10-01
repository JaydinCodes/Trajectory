import { NextRequest, NextResponse } from "next/server";
import { addJournal, listJournal,removeJournal,updateJournal } from "@/lib/local-db";
export const runtime="nodejs";
export async function GET(){return NextResponse.json(listJournal());}
export async function POST(request:NextRequest){const b=await request.json() as {entryType?:string;content?:string;date?:string};if(!b.content)return NextResponse.json({error:"Write something before saving."},{status:400});addJournal(b.entryType ?? "reflection",b.content,b.date ?? new Date().toISOString().slice(0,10));return NextResponse.json({ok:true},{status:201});}
export async function PATCH(request:NextRequest){const b=await request.json() as {id:number;content:string};updateJournal(b.id,b.content);return NextResponse.json({ok:true})}export async function DELETE(request:NextRequest){removeJournal(Number(request.nextUrl.searchParams.get("id")));return NextResponse.json({ok:true})}
