import { NextRequest, NextResponse } from "next/server";
import { seasonComparison } from "@/lib/local-db";
import { apiError, number } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { try { return NextResponse.json(seasonComparison(number(request.nextUrl.searchParams.get("left"), "Left season", { positive: true }), number(request.nextUrl.searchParams.get("right"), "Right season", { positive: true }))); } catch (error) { return NextResponse.json(apiError(error), { status: 400 }); } }
