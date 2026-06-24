import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { LEGACY_TERMINAL_STATUSES } from "@/lib/orders/order-status-machine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/active-orders
 * Lightweight endpoint for sidebar live indicator.
 * Returns only the count of active orders (any state that is NOT terminal).
 *
 * Rama fix/state-machine-paralela-merchant-driver: usa LEGACY_TERMINAL_STATUSES
 * con notIn para que estados nuevos del flujo caigan automáticamente en "activos"
 * sin tener que actualizar este endpoint.
 */
export async function GET() {
    try {
        // Behavior degradado: si la auth no es admin (DB source of truth),
        // devolvemos count:0 para no romper el render del sidebar.
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) {
            return NextResponse.json({ count: 0 });
        }

        const count = await prisma.order.count({
            where: {
                status: { notIn: [...LEGACY_TERMINAL_STATUSES] },
                deletedAt: null,
            },
        });

        return NextResponse.json({ count });
    } catch {
        return NextResponse.json({ count: 0 });
    }
}
