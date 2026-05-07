// API Route: Resume paused sellers (cron tick)
// POST /api/cron/seller-resume
// Protected with CRON_SECRET Bearer token — timing-safe comparison
// Rama chore/cron-monitoring-completo: envuelto con recordCronRun.
import { NextResponse } from "next/server";
import { checkAndResumePaused } from "@/lib/seller-availability";
import { verifyBearerToken } from "@/lib/env-validation";
import { recordCronRun } from "@/lib/cron-health";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        return await recordCronRun<NextResponse>("seller-resume", async () => {
            const resumed = await checkAndResumePaused();
            return {
                result: NextResponse.json({
                    success: true,
                    message: `Reanudados ${resumed} vendedor(es) pausado(s)`,
                    resumed,
                }) as NextResponse,
                itemsProcessed: resumed,
            };
        });
    } catch (error) {
        console.error("[SellerResume] Error:", error);
        return NextResponse.json(
            { error: "Error al procesar pausas de vendedores" },
            { status: 500 }
        );
    }
}
