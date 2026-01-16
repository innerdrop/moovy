// API Route: Driver Orders
// Returns available orders (READY, no driver) and driver's current deliveries
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
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

        // Available orders: status=READY, no driver assigned
        const available = await prisma.order.findMany({
            where: {
                status: "READY",
                driverId: null,
            },
            include: {
                items: { select: { id: true, name: true, quantity: true } },
                address: { select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true } },
                user: { select: { name: true, phone: true } },
                merchant: { select: { name: true, address: true } },
            },
            orderBy: { createdAt: "asc" }, // Oldest first
            take: 20,
        });

        // My deliveries: assigned to this driver, not yet delivered
        const myDeliveries = driver ? await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: "IN_DELIVERY",
            },
            include: {
                items: { select: { id: true, name: true, quantity: true } },
                address: { select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true } },
                user: { select: { name: true, phone: true } },
                merchant: { select: { name: true, address: true } },
            },
            orderBy: { createdAt: "asc" },
        }) : [];

        return NextResponse.json({ available, myDeliveries });
    } catch (error) {
        console.error("Error fetching driver orders:", error);
        return NextResponse.json(
            { error: "Error al obtener los pedidos" },
            { status: 500 }
        );
    }
}
