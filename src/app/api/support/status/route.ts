// API: Get support status (public - no auth required)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// feat/chat-en-vivo: un operador cuenta como "en línea" solo si su latido
// (lastSeenAt) es reciente. Si cerró la pestaña, en ~2 min deja de contar —
// así el usuario no ve un operador fantasma. El heartbeat lo mandan el portal
// /soporte y la bandeja de OPS cada ~30s.
const OPERATOR_STALE_MS = 2 * 60 * 1000;

export async function GET(request: NextRequest) {
    try {
        // Check if any operator is online, active AND fresh (heartbeat reciente)
        const activeOperator = await (prisma as any).supportOperator.findFirst({
            where: {
                isActive: true,
                isOnline: true,
                lastSeenAt: { gte: new Date(Date.now() - OPERATOR_STALE_MS) }
            }
        });

        return NextResponse.json({
            isOnline: !!activeOperator,
            message: activeOperator ? "Estamos en línea" : "Estamos fuera de línea"
        });
    } catch (error) {
        console.error("Error checking support status:", error);
        return NextResponse.json({
            isOnline: false,
            message: "No disponible"
        });
    }
}
