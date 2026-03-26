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

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching merchant orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}
