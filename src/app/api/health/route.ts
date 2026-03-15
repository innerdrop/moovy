// Health check endpoint for Next.js app
// GET /api/health — returns app status + DB connectivity
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // 1. Database connectivity
    const dbStart = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch (e: any) {
        checks.database = { status: "error", latencyMs: Date.now() - dbStart, error: e.message };
    }

    // 2. Socket server connectivity
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socketStart = Date.now();
    try {
        const res = await fetch(`${socketUrl}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const data = await res.json();
            checks.socketServer = { status: "ok", latencyMs: Date.now() - socketStart, ...data };
        } else {
            checks.socketServer = { status: "error", latencyMs: Date.now() - socketStart, error: `HTTP ${res.status}` };
        }
    } catch (e: any) {
        checks.socketServer = { status: "error", latencyMs: Date.now() - socketStart, error: e.message };
    }

    const allOk = Object.values(checks).every(c => c.status === "ok");

    return NextResponse.json(
        { status: allOk ? "healthy" : "degraded", timestamp: new Date().toISOString(), checks },
        { status: allOk ? 200 : 503 }
    );
}
