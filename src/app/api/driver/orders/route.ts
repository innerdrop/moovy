// API Route: Driver Orders
// Returns available orders (CONFIRMED/PREPARING, no driver) and driver's current deliveries
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

// Haversine distance in km between two lat/lng points
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "activos";

        const orderInclude = {
            items: { select: { id: true, name: true, quantity: true } },
            address: { select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true } },
            user: { select: { name: true, phone: true } },
            merchant: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
        };

        let orders: any[] = [];

        if (status === "disponibles") {
            // Available orders: CONFIRMED or PREPARING, no driver assigned
            const rawOrders = await prisma.order.findMany({
                where: {
                    status: { in: ["CONFIRMED", "PREPARING"] },
                    driverId: null,
                },
                include: orderInclude,
                orderBy: { createdAt: "asc" },
                take: 20,
            });

            // Sort by distance to driver if driver has location
            if (driver?.latitude && driver?.longitude) {
                rawOrders.sort((a, b) => {
                    const distA = a.merchant?.latitude && a.merchant?.longitude
                        ? haversineKm(driver.latitude!, driver.longitude!, a.merchant.latitude, a.merchant.longitude)
                        : Infinity;
                    const distB = b.merchant?.latitude && b.merchant?.longitude
                        ? haversineKm(driver.latitude!, driver.longitude!, b.merchant.latitude, b.merchant.longitude)
                        : Infinity;
                    return distA - distB;
                });
            }

            orders = rawOrders;
        } else if (status === "activos") {
            // My active deliveries
            if (driver) {
                const rawOrders = await prisma.order.findMany({
                    where: {
                        driverId: driver.id,
                        status: { in: ["IN_DELIVERY", "PICKED_UP"] },
                    },
                    include: orderInclude,
                    orderBy: { createdAt: "asc" },
                });
                orders = rawOrders;
            }
        } else if (status === "historial") {
            // My completed/cancelled deliveries
            if (driver) {
                const rawOrders = await prisma.order.findMany({
                    where: {
                        driverId: driver.id,
                        status: { in: ["DELIVERED", "CANCELLED"] },
                    },
                    include: orderInclude,
                    orderBy: { createdAt: "desc" },
                    take: 50,
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
