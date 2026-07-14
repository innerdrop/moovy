import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// feat/moover-canje-recompensas: recompensas activas (público). Alimenta los
// botones de un toque del checkout y la vidriera de /puntos. El cliente compara
// pointsCost con su saldo; la validación real (saldo + activo) es server-side
// en la creación del pedido.
export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "rewards:list", 40, 60_000);
    if (limited) return limited;
    try {
        const rewards = await prisma.reward.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
                id: true,
                label: true,
                icon: true,
                description: true,
                pointsCost: true,
                type: true,
                value: true,
            },
        });
        return NextResponse.json({ rewards });
    } catch (error) {
        // Si la tabla no existe todavía (pre-migración), devolvemos vacío en vez
        // de romper el checkout.
        console.error("Error fetching rewards:", error);
        return NextResponse.json({ rewards: [] });
    }
}
