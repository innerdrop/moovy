// API Route: Ops Live Orders
// Returns active orders for real-time ops monitoring
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Get active orders (not delivered/cancelled, not soft-deleted).
        // fix/aprobacion-sin-foto-driver (2026-04-28): respetar el soft delete del
        // endpoint DELETE /api/admin/orders. Antes esta query no filtraba deletedAt
        // y los pedidos eliminados desde /ops/pedidos quedaban "colgados" en /ops/live.
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_DELIVERY"] },
                deletedAt: null,
            },
            include: {
                items: { select: { id: true, name: true, quantity: true } },
                address: { select: { street: true, number: true, city: true } },
                user: { select: { name: true, email: true, phone: true } },
                driver: { select: { user: { select: { name: true } } } },
                merchant: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Calculate stats
        const stats = {
            pending: orders.filter(o => o.status === "PENDING").length,
            inProgress: orders.filter(o => ["CONFIRMED", "PREPARING"].includes(o.status)).length,
            ready: orders.filter(o => o.status === "READY").length,
            inDelivery: orders.filter(o => o.status === "IN_DELIVERY").length,
        };

        return NextResponse.json({ orders, stats });
    } catch (error) {
        console.error("Error fetching live orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}
