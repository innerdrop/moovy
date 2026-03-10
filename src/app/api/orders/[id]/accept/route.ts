import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
            return NextResponse.json({ error: "Solo repartidores pueden aceptar pedidos" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get driver profile
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id }
        });

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        if (!driver.isActive) {
            return NextResponse.json({ error: "Tu cuenta de repartidor no está activa" }, { status: 403 });
        }

        // Transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Check if order is still available
            const order = await tx.order.findUnique({
                where: { id },
                include: {
                    merchant: { select: { id: true } },
                    user: { select: { id: true } },
                },
            });

            if (!order) {
                throw new Error("Pedido no encontrado");
            }

            if (!["CONFIRMED", "PREPARING"].includes(order.status)) {
                throw new Error("Este pedido ya no está disponible");
            }

            if (order.driverId) {
                throw new Error("Este pedido ya tiene un repartidor asignado");
            }

            // Assign driver and change status to IN_DELIVERY
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    status: "IN_DELIVERY",
                    driverId: driver.id,
                    deliveryStatus: "IN_DELIVERY",
                },
            });

            // Set driver as busy
            await tx.driver.update({
                where: { id: driver.id },
                data: { availabilityStatus: "OCUPADO" },
            });

            return { ...updatedOrder, merchantId: order.merchantId, buyerUserId: order.userId };
        });

        // --- Socket notifications (fire-and-forget) ---
        try {
            const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
            const socketHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.CRON_SECRET}`,
            };
            const socketData = {
                orderId: result.id,
                orderNumber: result.orderNumber,
                status: "IN_DELIVERY",
                driverId: driver.id,
            };

            const emitPromises = [];

            // Notify merchant
            if (result.merchantId) {
                emitPromises.push(
                    fetch(`${socketUrl}/emit`, {
                        method: "POST",
                        headers: socketHeaders,
                        body: JSON.stringify({
                            event: "order_status_changed",
                            room: `merchant:${result.merchantId}`,
                            data: socketData,
                        }),
                    })
                );
            }

            // Notify buyer (via order room)
            emitPromises.push(
                fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: socketHeaders,
                    body: JSON.stringify({
                        event: "order_status_changed",
                        room: `order:${result.id}`,
                        data: { ...socketData, message: "¡Tu pedido está en camino!" },
                    }),
                })
            );

            // Notify admin/ops
            emitPromises.push(
                fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: socketHeaders,
                    body: JSON.stringify({
                        event: "order_status_changed",
                        room: "admin:orders",
                        data: socketData,
                    }),
                })
            );

            await Promise.allSettled(emitPromises);
        } catch (e) {
            console.error("[Socket-Emit] Failed to notify order acceptance:", e);
        }

        // --- Push notification to buyer (fire-and-forget) ---
        if (result.buyerUserId) {
            notifyBuyer(result.buyerUserId, "IN_DELIVERY", result.orderNumber).catch(
                (err) => console.error("[Push] Error notifying buyer:", err)
            );
        }

        return NextResponse.json({
            success: true,
            message: "Pedido aceptado",
            order: {
                id: result.id,
                orderNumber: result.orderNumber,
                status: result.status,
            },
        });
    } catch (error: any) {
        console.error("Error accepting order:", error);
        return NextResponse.json(
            { error: error.message || "Error al aceptar el pedido" },
            { status: 400 }
        );
    }
}
