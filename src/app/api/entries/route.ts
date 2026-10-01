import { NextRequest, NextResponse } from "next/server";
import { addEntry, listEntries } from "@/lib/local-db";
import { apiError, date, metric, number, text } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(){return NextResponse.json(listEntries());}
export async function POST(request:NextRequest){try{const body=await request.json() as Record<string,unknown>;const amount=body.amount===undefined||body.amount===""?undefined:number(body.amount,"Amount",{min:0});addEntry(text(body.type,"Type"),text(body.detail,"Detail"),amount,date(body.date),{area:typeof body.area==="string"?body.area:undefined,project:typeof body.project==="string"?body.project:undefined,metricKey:metric(body.metricKey)??undefined});return NextResponse.json({ok:true},{status:201})}catch(error){return NextResponse.json(apiError(error),{status:400})}}
