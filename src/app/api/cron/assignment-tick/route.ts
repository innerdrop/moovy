// API Route: Process expired assignment offers (cron tick)
// POST /api/cron/assignment-tick
// Protected with CRON_SECRET Bearer token — no fallback
import { NextResponse } from "next/server";
import { processExpiredAssignments } from "@/lib/assignment-engine";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token || token !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const processed = await processExpiredAssignments();

        return NextResponse.json({
            success: true,
            message: `Procesados ${processed} pedidos con timeout`,
            processed,
        });
    } catch (error) {
        console.error("[AssignmentTick] Error:", error);
        return NextResponse.json(
            { error: "Error al procesar timeouts de asignación" },
            { status: 500 }
        );
    }
}
