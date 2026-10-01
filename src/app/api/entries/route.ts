import { NextRequest, NextResponse } from "next/server";
import { addEntry, listEntries } from "@/lib/local-db";
export const runtime = "nodejs";
export async function GET(){return NextResponse.json(listEntries());}
export async function POST(request:NextRequest){const body=await request.json() as {type?:string;detail?:string;amount?:number;date?:string};if(!body.type||!body.detail)return NextResponse.json({error:"A type and detail are required."},{status:400});addEntry(body.type,body.detail,body.amount,body.date ?? new Date().toISOString().slice(0,10));return NextResponse.json({ok:true},{status:201});}
