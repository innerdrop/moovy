// API Route: Process expired assignment offers (cron tick)
// POST /api/cron/assignment-tick
// Protected with CRON_SECRET Bearer token — timing-safe comparison
//
// Rama chore/cron-monitoring-completo: envuelto con recordCronRun para que
// aparezca en el dashboard /ops/crons con success rate, tiempo promedio, etc.
import { NextResponse } from "next/server";
import { processExpiredAssignments, retryAllSearchingOrders } from "@/lib/assignment-engine";
import { verifyBearerToken } from "@/lib/env-validation";
import { recordCronRun } from "@/lib/cron-health";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        // V-028 FIX: timing-safe comparison
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        return await recordCronRun<NextResponse>("assignment-tick", async () => {
            const processed = await processExpiredAssignments();
            // feat/asignacion-reintento-y-reembolso: reintentar los pedidos en
            // "buscando repartidor" y finalizar/reembolsar los que vencieron la ventana.
            const searching = await retryAllSearchingOrders().catch(() => 0);
            return {
                result: NextResponse.json({
                    success: true,
                    message: `Procesados ${processed} timeouts · ${searching} pedidos en búsqueda reintentados`,
                    processed,
                    searching,
                }) as NextResponse,
                itemsProcessed: processed + searching,
            };
        });
    } catch (error) {
        console.error("[AssignmentTick] Error:", error);
        return NextResponse.json(
            { error: "Error al procesar timeouts de asignación" },
            { status: 500 }
        );
    }
}
