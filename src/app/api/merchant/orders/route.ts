// API Route: Merchant Orders
// Returns orders for the merchant's store(s)
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

        if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Get merchant(s) owned by this user
        const merchants = await prisma.merchant.findMany({
            where: { ownerId: session.user.id },
            select: { id: true }
        });

        const merchantIds = merchants.map(m => m.id);

        // If ADMIN, show all orders. If MERCHANT, filter by their stores.
        // Always exclude soft-deleted orders
        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        const where = isAdmin
            ? { deletedAt: null }
            : {
                  merchantId: { in: merchantIds.length > 0 ? merchantIds : ["NONE"] },
                  deletedAt: null,
              };

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                subOrders: isAdmin ? undefined : {
                    where: { merchantId: { in: merchantIds } },
                },
                address: { select: { street: true, number: true, city: true } },
                user: { select: { name: true, phone: true } },
                driver: { select: { user: { select: { name: true, phone: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to recent orders
        });

        // ISSUE-001: PIN doble — solo mostrar pickupPin cuando el driver llegó al comercio.
        // Defense-in-depth: aunque el merchant sea dueño del pedido, no exponemos el PIN
        // hasta que sea necesario (DRIVER_ARRIVED). Esto previene leaks accidentales o
        // ataques de phishing donde un falso driver llama antes de llegar.
        const sanitizedOrders = orders.map((order: any) => {
            const canShowPickup = order.deliveryStatus === "DRIVER_ARRIVED";
            return {
                ...order,
                pickupPin: canShowPickup ? order.pickupPin : null,
                deliveryPin: null, // Nunca exponer el deliveryPin al merchant
                subOrders: order.subOrders?.map((sub: any) => ({
                    ...sub,
                    pickupPin: sub.deliveryStatus === "DRIVER_ARRIVED" ? sub.pickupPin : null,
                    deliveryPin: null,
                })),
            };
        });

        return NextResponse.json(sanitizedOrders);
    } catch (error) {
        console.error("Error fetching merchant orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}
