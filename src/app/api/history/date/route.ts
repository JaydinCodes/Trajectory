import { NextRequest, NextResponse } from "next/server";
import { historyDate } from "@/lib/local-db";
import { apiError, date } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { try { const value = request.nextUrl.searchParams.get("date"); if (value === null) throw new Error("Date is required."); return NextResponse.json(historyDate(date(value))); } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); } }
