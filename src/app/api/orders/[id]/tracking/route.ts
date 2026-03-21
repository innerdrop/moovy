// API Route: Public Order Tracking
// No authentication required - returns only non-sensitive order data for real-time tracking
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true,
                estimatedTime: true,
                address: {
                    select: {
                        street: true,
                        number: true,
                        latitude: true,
                        longitude: true,
                    }
                },
                driver: {
                    select: {
                        id: true,
                        latitude: true,
                        longitude: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                            }
                        }
                    }
                },
                driverRating: true,
                ratingComment: true,
                merchant: {
                    select: {
                        name: true,
                        latitude: true,
                        longitude: true,
                        address: true,
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Pedido no encontrado" },
                { status: 404 }
            );
        }

        // Return only non-sensitive data
        return NextResponse.json(order);
    } catch (error) {
        console.error("Error fetching order tracking data:", error);
        return NextResponse.json(
            { error: "Error al obtener información del pedido" },
            { status: 500 }
        );
    }
}
