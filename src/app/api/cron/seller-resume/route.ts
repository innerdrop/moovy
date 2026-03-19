// API Route: Resume paused sellers (cron tick)
// POST /api/cron/seller-resume
// Protected with CRON_SECRET Bearer token — timing-safe comparison
import { NextResponse } from "next/server";
import { checkAndResumePaused } from "@/lib/seller-availability";
import { verifyBearerToken } from "@/lib/env-validation";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        // V-028 FIX: timing-safe comparison
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const resumed = await checkAndResumePaused();

        return NextResponse.json({
            success: true,
            message: `Reanudados ${resumed} vendedor(es) pausado(s)`,
            resumed,
        });
    } catch (error) {
        console.error("[SellerResume] Error:", error);
        return NextResponse.json(
            { error: "Error al procesar pausas de vendedores" },
            { status: 500 }
        );
    }
}
