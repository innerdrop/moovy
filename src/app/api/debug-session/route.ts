import { NextResponse } from "next/server";

// V-005 FIX: Debug endpoints disabled — return 404 in all environments
export async function GET() {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
}
