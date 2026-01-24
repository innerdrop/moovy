// API Route: Driver Orders
// Returns available orders (READY, no driver) and driver's current deliveries
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const role = (session.user as any).role;

        // Security: Only DRIVER or ADMIN can access this
        if (!["DRIVER", "ADMIN"].includes(role)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Get driver record for current user
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "activos";

        let orders: any[] = [];

        if (status === "disponibles") {
            // Available orders: status=READY, no driver assigned
            const rawOrders = await prisma.order.findMany({
                where: {
                    status: "READY",
                    driverId: null,
                },
                include: {
                    items: { select: { id: true, name: true, quantity: true } },
                    address: { select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true } },
                    user: { select: { name: true, phone: true } },
                    merchant: { select: { id: true, name: true, address: true } },
                },
                orderBy: { createdAt: "asc" }, // Oldest first
                take: 20,
            });
            orders = rawOrders;
        } else if (status === "activos") {
            // My active deliveries
            if (driver) {
                const rawOrders = await prisma.order.findMany({
                    where: {
                        driverId: driver.id,
                        status: { in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"] }, // Active statuses
                    },
                    include: {
                        items: { select: { id: true, name: true, quantity: true } },
                        address: { select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true } },
                        user: { select: { name: true, phone: true } },
                        merchant: { select: { id: true, name: true, address: true } },
                    },
                    orderBy: { createdAt: "asc" },
                });
                orders = rawOrders;
            }
        } else if (status === "historial") {
            // My completed/cancelled deliveries (limited)
            if (driver) {
                const rawOrders = await prisma.order.findMany({
                    where: {
                        driverId: driver.id,
                        status: { in: ["DELIVERED", "CANCELLED"] },
                    },
                    include: {
                        items: { select: { id: true, name: true, quantity: true } },
                        address: { select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true } },
                        user: { select: { name: true, phone: true } },
                        merchant: { select: { id: true, name: true, address: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20
                });
                orders = rawOrders;
            }
        }

        // Flatten data for frontend
        const formattedOrders = orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            comercio: o.merchant?.name || "Comercio",
            merchantId: o.merchant?.id,
            direccion: `${o.address.street} ${o.address.number}`,
            estado: o.status,
            total: o.total,
            createdAt: o.createdAt,
        }));

        return NextResponse.json(formattedOrders);
    } catch (error) {
        console.error("Error fetching driver orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}
