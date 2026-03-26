/**
 * API: Get delivery context for buyer-driver chat
 * Returns driver location, distance, and ETA to help format chat header
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDeliveryContext } from "@/lib/delivery-chat";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { id: orderId } = await params;

        // Get order with driver and delivery address
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                status: true,
                driver: {
                    select: {
                        latitude: true,
                        longitude: true,
                        user: { select: { name: true } },
                    },
                },
                address: {
                    select: {
                        latitude: true,
                        longitude: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Verify user is the buyer
        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // If no driver assigned or no location data, return empty context
        if (!order.driver || !order.driver.latitude || !order.address?.latitude) {
            return NextResponse.json({
                status: order.status,
                driverName: order.driver?.user?.name,
            });
        }

        // Build delivery context
        const context = buildDeliveryContext(
            order.driver.latitude,
            order.driver.longitude || undefined,
            order.address.latitude,
            order.address.longitude || undefined,
            order.status
        );

        return NextResponse.json({
            ...context,
            status: order.status,
            driverName: order.driver.user?.name,
        });
    } catch (error) {
        console.error("Error fetching delivery context:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
