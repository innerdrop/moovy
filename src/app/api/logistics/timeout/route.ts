// API Route: Process expired assignment timeouts
// POST /api/logistics/timeout (should be called by cron job or scheduler)
import { NextResponse } from "next/server";
import { processExpiredAssignments } from "@/lib/logistics";

// Secret key to prevent unauthorized calls (set in .env)
const CRON_SECRET = process.env.CRON_SECRET || "moovy-cron-secret-change-in-production";

export async function POST(request: Request) {
    try {
        // Verify secret for cron jobs
        const authHeader = request.headers.get("authorization");
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret") || authHeader?.replace("Bearer ", "");

        if (secret !== CRON_SECRET) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const processed = await processExpiredAssignments();

        return NextResponse.json({
            success: true,
            message: `Procesados ${processed} pedidos con timeout`,
            processed,
        });
    } catch (error) {
        console.error("Error in logistics/timeout:", error);
        return NextResponse.json(
            { error: "Error al procesar timeouts" },
            { status: 500 }
        );
    }
}
