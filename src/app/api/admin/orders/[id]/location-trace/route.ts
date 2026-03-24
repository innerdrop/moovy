// API Route: Get GPS trace for an order (for dispute resolution)
// GET /api/admin/orders/[id]/location-trace - Returns complete GPS trace with timestamps
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";

const logger = createRequestLogger("location-trace");

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Auth: ADMIN only
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json(
                { error: "Solo administradores pueden ver trazas de ubicación" },
                { status: 403 }
            );
        }

        const orderId = params.id;

        // Fetch order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                driverId: true,
                status: true,
                deliveryStatus: true,
                createdAt: true,
                deliveredAt: true,
                driver: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Pedido no encontrado" },
                { status: 404 }
            );
        }

        // If no driver assigned, return empty trace
        if (!order.driverId) {
            return NextResponse.json({
                orderId,
                orderNumber: order.orderNumber,
                status: order.status,
                deliveryStatus: order.deliveryStatus,
                driverId: null,
                driver: null,
                createdAt: order.createdAt,
                deliveredAt: order.deliveredAt,
                trace: [],
                totalDistance: 0,
                duration: 0,
                message: "Sin repartidor asignado",
            });
        }

        // Get location history for this order
        const trace = await prisma.driverLocationHistory.findMany({
            where: {
                orderId: orderId,
            },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                accuracy: true,
                speed: true,
                heading: true,
                timestamp: true,
                createdAt: true,
            },
            orderBy: {
                timestamp: "asc",
            },
        });

        // Calculate statistics
        let totalDistance = 0;
        let duration = 0;

        if (trace.length > 1) {
            // Calculate time duration
            const startTime = new Date(trace[0].timestamp);
            const endTime = new Date(trace[trace.length - 1].timestamp);
            duration = Math.round(
                (endTime.getTime() - startTime.getTime()) / 1000
            ); // seconds

            // Calculate total distance using Haversine formula
            for (let i = 1; i < trace.length; i++) {
                const lat1 = trace[i - 1].latitude;
                const lon1 = trace[i - 1].longitude;
                const lat2 = trace[i].latitude;
                const lon2 = trace[i].longitude;

                const R = 6371; // Earth's radius in km
                const dLat = ((lat2 - lat1) * Math.PI) / 180;
                const dLon = ((lon2 - lon1) * Math.PI) / 180;

                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((lat1 * Math.PI) / 180) *
                        Math.cos((lat2 * Math.PI) / 180) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);

                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                totalDistance += R * c; // Add distance in km
            }
        }

        logger.info(
            {
                orderId,
                driverId: order.driverId,
                tracePoints: trace.length,
                totalDistance: totalDistance.toFixed(2),
                duration,
            },
            "Location trace retrieved"
        );

        return NextResponse.json({
            orderId,
            orderNumber: order.orderNumber,
            status: order.status,
            deliveryStatus: order.deliveryStatus,
            driverId: order.driverId,
            driver: order.driver,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            trace,
            totalDistance: Math.round(totalDistance * 1000) / 1000, // Round to 3 decimals (meters)
            duration, // in seconds
            pointCount: trace.length,
        });
    } catch (error) {
        logger.error(
            { error, orderId: params.id },
            "Error retrieving location trace"
        );
        return NextResponse.json(
            { error: "Error al obtener traza de ubicación" },
            { status: 500 }
        );
    }
}
