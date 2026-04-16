// API Route: GET /api/driver/active-order
// Devuelve el pedido activo del driver si lo tiene (aceptado, en camino, etc.)
// Usado por PortalSwitcher para bloquear el cambio de portal cuando hay una entrega en curso.
// Creado 2026-04-15 como parte del fix de auto-desconexi\u00f3n driver al cambiar de portal.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTIVE_DELIVERY_STATUSES = ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP"] as const;

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!driver) {
            // No es driver \u2014 no bloquea cambio de portal
            return NextResponse.json({ hasActive: false, orderId: null, orderNumber: null });
        }

        // Buscar pedido con deliveryStatus en estados que impliquen compromiso activo
        const activeOrder = await prisma.order.findFirst({
            where: {
                driverId: driver.id,
                deliveryStatus: { in: [...ACTIVE_DELIVERY_STATUSES] },
                deletedAt: null,
            },
            select: {
                id: true,
                orderNumber: true,
                deliveryStatus: true,
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({
            hasActive: Boolean(activeOrder),
            orderId: activeOrder?.id ?? null,
            orderNumber: activeOrder?.orderNumber ?? null,
            deliveryStatus: activeOrder?.deliveryStatus ?? null,
        });
    } catch (error) {
        console.error("[Driver Active Order] Error:", error);
        return NextResponse.json(
            { error: "Error al consultar pedido activo" },
            { status: 500 }
        );
    }
}
