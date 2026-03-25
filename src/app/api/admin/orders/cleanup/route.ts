/**
 * Admin: Cleanup hanging test orders
 * POST /api/admin/orders/cleanup
 * Cancels all non-terminal orders (not DELIVERED, CANCELLED, REJECTED)
 * Frees drivers, restores stock, cleans pending assignments
 * Requires ADMIN role + password confirmation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";

const cleanupLogger = logger.child({ context: "admin-orders-cleanup" });

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: "Se requiere contraseña" }, { status: 400 });
        }

        // Verify admin password
        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true, name: true },
        });

        if (!adminUser?.password) {
            return NextResponse.json({ error: "Error de autenticación" }, { status: 401 });
        }

        const passwordValid = await bcrypt.compare(password, adminUser.password);
        if (!passwordValid) {
            return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });
        }

        // Find all hanging orders
        const hangingOrders = await prisma.order.findMany({
            where: {
                status: {
                    notIn: ["DELIVERED", "CANCELLED", "REJECTED"],
                },
            },
            include: {
                items: { select: { productId: true, quantity: true, listingId: true } },
            },
        });

        if (hangingOrders.length === 0) {
            return NextResponse.json({ success: true, message: "No hay pedidos pendientes", cleaned: 0 });
        }

        // Collect driver IDs to free
        const driverIds = new Set<string>();

        await prisma.$transaction(async (tx) => {
            for (const order of hangingOrders) {
                // Cancel the order
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: "CANCELLED",
                        deliveryStatus: null,
                        adminNotes: [
                            order.adminNotes,
                            `[LIMPIEZA ADMIN] ${adminUser.name} - ${new Date().toLocaleString("es-AR")}`,
                        ].filter(Boolean).join("\n"),
                    },
                });

                // Cancel sub-orders
                await tx.subOrder.updateMany({
                    where: { orderId: order.id },
                    data: { status: "CANCELLED" },
                });

                // Track driver for freeing
                if (order.driverId) {
                    driverIds.add(order.driverId);
                }

                // Restore stock
                for (const item of order.items) {
                    if (item.productId) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: item.quantity } },
                        });
                    }
                    if (item.listingId) {
                        await tx.listing.update({
                            where: { id: item.listingId },
                            data: { stock: { increment: item.quantity } },
                        });
                    }
                }

                // Return points if discount was from points
                if (order.discount && order.discount > 0) {
                    const pointsTx = await tx.pointsTransaction.findFirst({
                        where: { orderId: order.id, type: "REDEEM" },
                        select: { amount: true },
                    });
                    if (pointsTx && pointsTx.amount < 0) {
                        const pointsToRestore = Math.abs(pointsTx.amount);
                        await tx.user.update({
                            where: { id: order.userId },
                            data: { pointsBalance: { increment: pointsToRestore } },
                        });
                    }
                }
            }

            // Free all affected drivers
            for (const driverId of driverIds) {
                await tx.driver.update({
                    where: { id: driverId },
                    data: { availabilityStatus: "DISPONIBLE" },
                });
            }

            // Clean all pending assignments
            await tx.pendingAssignment.deleteMany({
                where: {
                    orderId: { in: hangingOrders.map(o => o.id) },
                },
            });
        });

        cleanupLogger.info({
            adminId: session.user.id,
            adminName: adminUser.name,
            ordersCount: hangingOrders.length,
            orderNumbers: hangingOrders.map(o => o.orderNumber),
            driversFreed: driverIds.size,
        }, "Admin cleanup: hanging orders cancelled");

        return NextResponse.json({
            success: true,
            message: `${hangingOrders.length} pedido(s) cancelado(s) correctamente`,
            cleaned: hangingOrders.length,
            driversFreed: driverIds.size,
            orders: hangingOrders.map(o => ({
                orderNumber: o.orderNumber,
                previousStatus: o.status,
            })),
        });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        cleanupLogger.error({ error: errMsg }, "Error in admin cleanup");
        return NextResponse.json({ error: "Error al limpiar pedidos" }, { status: 500 });
    }
}
