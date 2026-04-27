// API Route: Get payment status for an order (polling endpoint)
//
// GET /api/payments/[orderId]/status
//
// Devuelve el estado del pago. Si la orden está en AWAITING_PAYMENT/PENDING y
// fue creada con MercadoPago, hace fallback a MP API (search por external_reference)
// para detectar pagos que ya se acreditaron pero el webhook no procesó todavía
// (delay normal 5-30s) o nunca llegó (localhost sin túnel + casos edge en prod).
//
// Idempotente y safe: si MP confirma, dispara la misma lógica que el webhook
// (PAID, CONFIRMED, socket emit, email) vía el helper canónico
// `confirmOrderPaymentFromMp`. Si dos requests concurrentes (webhook + polling)
// ganan a la vez, solo una hace los side effects — la otra retorna alreadyConfirmed.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { confirmOrderPaymentFromMp } from "@/lib/order-payment-confirm";

const PENDING_STATES = new Set(["AWAITING_PAYMENT", "PENDING"]);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { orderId } = await params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                status: true,
                paymentStatus: true,
                paymentMethod: true,
                mpStatus: true,
                paidAt: true,
                mpPreferenceId: true,
                orderNumber: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        if (order.userId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Si está pendiente y es MP, intentar confirmar contra MP API.
        // Defense in depth: cubre webhook tardío (delay normal 5-30s) o caído.
        let currentPaymentStatus = order.paymentStatus;
        let currentMpStatus = order.mpStatus;
        let currentPaidAt = order.paidAt;
        let currentOrderStatus = order.status;
        let confirmedJustNow = false;

        if (PENDING_STATES.has(order.paymentStatus) && order.paymentMethod === "mercadopago") {
            try {
                const result = await confirmOrderPaymentFromMp(orderId);
                if (result.confirmed || result.alreadyConfirmed) {
                    currentPaymentStatus = result.paymentStatus;
                    currentMpStatus = result.mpStatus ?? currentMpStatus;
                    currentPaidAt = result.paidAt ?? currentPaidAt;
                    currentOrderStatus = result.confirmed ? "CONFIRMED" : currentOrderStatus;
                    confirmedJustNow = result.confirmed;
                } else if (result.failed) {
                    // amount_mismatch / mp_search_failed — no rompemos el polling, devolvemos lo que tenemos
                    console.warn(`[payments/status] confirm failed for ${orderId}: ${result.reason}`);
                } else if (result.mpStatus) {
                    // pending/in_process en MP — devolvemos el mpStatus actualizado
                    currentMpStatus = result.mpStatus;
                }
            } catch (err) {
                // Helper falló entero — devolvemos estado de DB sin tocarlo
                console.error(`[payments/status] confirmOrderPaymentFromMp threw for ${orderId}:`, err);
            }
        }

        return NextResponse.json({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: currentOrderStatus,
            paymentStatus: currentPaymentStatus,
            mpStatus: currentMpStatus,
            paidAt: currentPaidAt,
            confirmedJustNow,
        });
    } catch (error) {
        console.error("Error fetching payment status:", error);
        return NextResponse.json(
            { error: "Error al consultar el estado del pago" },
            { status: 500 }
        );
    }
}
