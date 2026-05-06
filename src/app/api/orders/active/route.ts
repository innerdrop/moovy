// API Route: Get active orders for current user
//
// Rama fix/state-machine-paralela-merchant-driver:
// Antes enumeraba estados activos hardcodeados y olvidaba DRIVER_ARRIVED, RETURNING,
// etc. Ahora usa LEGACY_TERMINAL_STATUSES y filtra por NOT IN, así estados nuevos
// del flujo caen automáticamente en "activos" sin romper este endpoint.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEGACY_TERMINAL_STATUSES } from "@/lib/orders/order-status-machine";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ order: null });
        }

        // Find most recent active order (cualquier estado NO terminal)
        const activeOrder = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: { notIn: [...LEGACY_TERMINAL_STATUSES] },
                deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                createdAt: true
            }
        });

        return NextResponse.json({ order: activeOrder });
    } catch (error) {
        console.error("Error fetching active orders:", error);
        return NextResponse.json({ order: null });
    }
}
