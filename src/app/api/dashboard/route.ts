import { NextRequest, NextResponse } from "next/server";
import { dashboard } from "@/lib/local-db";
import { apiError, date } from "@/lib/validation";
export const runtime="nodejs";
export async function GET(request:NextRequest){try{const asOfDate=request.nextUrl.searchParams.get("asOfDate");return NextResponse.json(dashboard(asOfDate?date(asOfDate):undefined));}catch(error){return NextResponse.json(apiError(error),{status:400})}}
