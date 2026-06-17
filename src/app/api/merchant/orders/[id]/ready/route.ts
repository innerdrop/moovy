// Merchant Mark Order Ready — merchantStatus PREPARING -> READY + notify driver
//
// Rama fix/state-machine-paralela-merchant-driver:
// Antes chequeaba `order.status IN ["PREPARING","DRIVER_ASSIGNED"]` y bloqueaba
// cuando el driver ya había llegado (status = "DRIVER_ARRIVED"). Ahora chequea
// el merchantStatus paralelo, independiente del flujo del driver. El comercio
// puede marcar listo en cualquier momento mientras esté en PREPARING.
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";
import { notifyDriver, notifyBuyer } from "@/lib/notifications";
import { sendOrderReadyForPickupEmail } from "@/lib/email-legal-ux";
import {
    getEffectiveMerchantStatus,
    getEffectiveDriverStatus,
    deriveLegacyStatus,
} from "@/lib/orders/order-status-machine";

const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    }).catch((err) => console.error("[Socket] emit error:", err));
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth contra DB (no contra el JWT cache). Ver src/lib/merchant-auth.ts.
        // El helper ya garantiza: o hay comercio propio, o es ADMIN.
        const authResult = await requireMerchantApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { merchant, isAdmin } = authResult;

        const { id: orderId } = await params;

        // Find order with driver info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                merchantStatus: true,
                driverStatus: true,
                merchantId: true,
                userId: true,
                orderNumber: true,
                driverId: true,
                isPickup: true,
                merchant: { select: { name: true, address: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (!isAdmin && order.merchantId !== merchant?.id) {
            return NextResponse.json({ error: "Pedido no pertenece a tu comercio" }, { status: 403 });
        }

        // El comercio puede marcar READY siempre que esté en PREPARING,
        // independiente de dónde esté el driver (incluso si ya llegó).
        // Esto fixea el bug pre-launch: antes bloqueaba cuando driver=DRIVER_ARRIVED.
        const effectiveMerchantStatus = getEffectiveMerchantStatus(order);
        if (effectiveMerchantStatus !== "PREPARING") {
            return NextResponse.json(
                { error: `El pedido ya está en estado ${effectiveMerchantStatus.toLowerCase()}, no se puede marcar como listo otra vez` },
                { status: 400 }
            );
        }

        // Recalcular `status` legacy a partir de los campos parallel (mantener consumers en sync)
        const newDriverStatus = getEffectiveDriverStatus(order);
        const newLegacyStatus = deriveLegacyStatus("READY", newDriverStatus);

        // Atomic conditional update: solo si merchantStatus sigue en PREPARING
        // (defensa contra race con otro click simultaneo)
        const updateResult = await prisma.order.updateMany({
            where: {
                id: orderId,
                OR: [
                    { merchantStatus: "PREPARING" },
                    // Fallback para pedidos viejos sin merchantStatus seteado
                    { merchantStatus: null, status: { in: ["PREPARING", "DRIVER_ASSIGNED", "DRIVER_ARRIVED"] } },
                ],
            },
            data: {
                merchantStatus: "READY",
                status: newLegacyStatus,
            },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "El pedido ya cambió de estado" },
                { status: 409 }
            );
        }

        // Notify assigned driver if exists
        if (order.driverId) {
            notifyDriver(order.driverId, order.orderNumber, order.merchant?.name || undefined, orderId).catch(console.error);
        }

        // Notify buyer that order is ready
        if (order.userId) {
            notifyBuyer(order.userId, "READY", order.orderNumber, {
                merchantName: order.merchant?.name || undefined,
                orderId,
            }).catch(console.error);

            // Email UX: listo para retirar (solo cuando es pickup). Fire-and-forget.
            if (order.isPickup && order.merchant?.name) {
                (async () => {
                    try {
                        const buyer = await prisma.user.findUnique({
                            where: { id: order.userId },
                            select: { email: true, firstName: true },
                        });
                        if (!buyer?.email) return;
                        await sendOrderReadyForPickupEmail({
                            buyerEmail: buyer.email,
                            buyerName: buyer.firstName ?? null,
                            orderNumber: order.orderNumber,
                            merchantName: order.merchant!.name,
                            merchantAddress: order.merchant?.address || "Pasá por el comercio",
                        });
                    } catch (err) {
                        console.error("[Merchant Ready] Pickup email error:", err);
                    }
                })();
            }
        }

        // Socket notifications
        const socketData = { orderId, status: "READY", orderNumber: order.orderNumber };
        emitSocket("order_status_changed", `merchant:${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_status_changed", "admin:orders", socketData).catch(console.error);
        if (order.driverId) {
            emitSocket("order_status_changed", `driver:${order.driverId}`, socketData).catch(console.error);
        }
        if (order.userId) {
            emitSocket("order_status_changed", `customer:${order.userId}`, socketData).catch(console.error);
        }

        return NextResponse.json({ success: true, status: "READY" });
    } catch (error) {
        console.error("[Merchant Ready] Error:", error);
        return NextResponse.json({ error: "Error al marcar el pedido como listo" }, { status: 500 });
    }
}
