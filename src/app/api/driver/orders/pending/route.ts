// API Route: Get pending orders for a driver
// Returns orders where this driver is pendingDriverId (offered but not yet accepted)
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
        if (role !== "DRIVER") {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        // Get driver record
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        if (!driver) {
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
        }

        // Find orders offered to this driver
        const pendingOrders = await prisma.order.findMany({
            where: {
                pendingDriverId: driver.id,
                driverId: null, // Not yet accepted
                status: "READY",
            },
            include: {
                address: {
                    select: { street: true, number: true, apartment: true, city: true, latitude: true, longitude: true },
                },
                merchant: {
                    select: { id: true, name: true, address: true, latitude: true, longitude: true },
                },
                items: { select: { id: true, name: true, quantity: true } },
                user: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        // Format for frontend
        const formatted = pendingOrders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            comercio: order.merchant?.name || "Comercio",
            comercioAddress: order.merchant?.address,
            comercioLat: order.merchant?.latitude,
            comercioLng: order.merchant?.longitude,
            direccion: `${order.address.street} ${order.address.number}`,
            destinoLat: order.address.latitude,
            destinoLng: order.address.longitude,
            cliente: order.user?.name,
            clientePhone: order.user?.phone,
            total: order.total,
            items: order.items,
            expiresAt: order.assignmentExpiresAt,
            createdAt: order.createdAt,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching pending orders:", error);
        return NextResponse.json(
            { error: "Error al obtener pedidos pendientes" },
            { status: 500 }
        );
    }
}
