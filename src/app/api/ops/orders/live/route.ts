// API Route: Ops Live Orders
// Returns active orders for real-time ops monitoring
//
// Rama fix/state-machine-paralela-merchant-driver: filtro por NOT IN terminales
// en vez de enumerar activos. Antes pedidos con status=DRIVER_ARRIVED desaparecían
// del live dashboard del ops.
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { LEGACY_TERMINAL_STATUSES } from "@/lib/orders/order-status-machine";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        // Get active orders (not delivered/cancelled, not soft-deleted).
        // fix/aprobacion-sin-foto-driver (2026-04-28): respetar el soft delete del
        // endpoint DELETE /api/admin/orders. Antes esta query no filtraba deletedAt
        // y los pedidos eliminados desde /ops/pedidos quedaban "colgados" en /ops/live.
        const orders = await prisma.order.findMany({
            where: {
                status: { notIn: [...LEGACY_TERMINAL_STATUSES] },
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

        // Calculate stats. Buckets mutuamente excluyentes — cada pedido cae en uno solo.
        // Bucket "driverFlow" agrupa los estados donde driver ya está involucrado
        // (asignado, llegando al comercio, o llegó al comercio sin pickup todavía).
        const stats = {
            pending: orders.filter(o => o.status === "PENDING").length,
            inProgress: orders.filter(o => ["CONFIRMED", "PREPARING"].includes(o.status)).length,
            ready: orders.filter(o => o.status === "READY").length,
            driverFlow: orders.filter(o => ["DRIVER_ASSIGNED", "DRIVER_ARRIVED"].includes(o.status)).length,
            inDelivery: orders.filter(o => ["PICKED_UP", "IN_DELIVERY"].includes(o.status)).length,
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
