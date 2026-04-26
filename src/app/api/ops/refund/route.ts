// src/app/api/ops/refund/route.ts
//
// Endpoint admin "Procesar Reembolso" del panel /ops/pedidos/[id].
//
// Consolidado en la rama fix/refund-automatico (2026-04-26):
//   - Si la orden está PAID con MercadoPago, usa el helper canónico
//     `refundOrderIfPaid` que dispara MP API real + audit + email + socket.
//   - Si está PAID con efectivo, registra el refund (el admin ya devolvió
//     físicamente la plata).
//   - Para otros estados (AWAITING_PAYMENT, FAILED, etc), permite
//     registro manual del refund con nota descriptiva — útil para
//     testing en localhost donde MP webhook no llega.
//
// Reembolso parcial: hoy el helper devuelve siempre el total. Si admin
// pide partial refund, lo registramos como ADMIN_NOTE pero el MP refund
// es siempre full. Para partials reales hay que extender createRefund
// con amount, queda para post-launch (caso edge poco común).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { refundOrderIfPaid } from "@/lib/order-refund";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { orderId, amount, reason } = await request.json();

        if (!orderId || typeof orderId !== "string") {
            return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
        }

        if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
            return NextResponse.json({ error: "Motivo requerido (mínimo 5 caracteres)" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                total: true,
                paymentStatus: true,
                paymentMethod: true,
                adminNotes: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.paymentStatus === "REFUNDED") {
            return NextResponse.json({ error: "Este pedido ya fue reembolsado" }, { status: 400 });
        }

        const refundAmount = amount ? Number(amount) : order.total;
        if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > order.total) {
            return NextResponse.json({
                error: `Monto inválido. Debe ser entre $0.01 y $${order.total}`
            }, { status: 400 });
        }

        const trimmedReason = reason.trim();
        const adminName = session.user?.name || session.user?.email || "admin";
        const refundNote = `[REEMBOLSO ${new Date().toLocaleDateString("es-AR")}] $${refundAmount.toLocaleString("es-AR")} — ${trimmedReason} — Por: ${adminName}`;
        const existingNotes = order.adminNotes ? `${order.adminNotes}\n\n` : "";

        // Path 1: Orden PAID con MercadoPago → helper canónico (refund real a MP)
        const isPaidMP = (
            order.paymentMethod === "mercadopago" &&
            (order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED")
        );

        if (isPaidMP) {
            const result = await refundOrderIfPaid(orderId, {
                triggeredBy: "admin",
                actorId: session.user.id,
                reason: trimmedReason,
                sendEmail: true,
            });

            if (result.failed) {
                return NextResponse.json({
                    error: "El refund a MercadoPago falló. Quedó registrado para resolución manual. Revisar logs.",
                    detail: result.reason,
                }, { status: 502 });
            }

            if (!result.refunded && !result.alreadyRefunded) {
                // Edge: notApplicable después del isPaidMP check (race condition raro)
                return NextResponse.json({
                    error: `No se pudo procesar el reembolso: ${result.reason}`,
                }, { status: 400 });
            }

            // El helper ya marcó paymentStatus=REFUNDED + audit log + email + socket.
            // Solo agregamos la nota del admin con el monto/motivo formateado.
            await prisma.order.update({
                where: { id: orderId },
                data: { adminNotes: `${existingNotes}${refundNote}` },
            });

            return NextResponse.json({
                success: true,
                refundedToMp: true,
                amount: result.amount ?? refundAmount,
                message: `Reembolso de ${formatCurrency(result.amount ?? refundAmount)} procesado en MercadoPago para pedido #${order.orderNumber}`,
            });
        }

        // Path 2: Refund manual (efectivo, testing, casos no-MP).
        // El admin ya devolvió la plata afuera del sistema (transferencia,
        // efectivo, etc.) y solo registramos el evento en la DB.
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "REFUNDED",
                adminNotes: `${existingNotes}${refundNote}`,
            },
        });

        await logAudit({
            action: "REFUND_PROCESSED_MANUAL",
            entityType: "order",
            entityId: orderId,
            userId: session.user.id,
            details: {
                refundAmount,
                reason: trimmedReason,
                originalTotal: order.total,
                orderNumber: order.orderNumber,
                paymentMethod: order.paymentMethod,
                originalPaymentStatus: order.paymentStatus,
            },
        });

        // Reversión de puntos (idempotente — si la orden no llegó a DELIVERED, no había earn que revertir)
        try {
            const { reverseOrderPoints } = await import("@/lib/points");
            const result = await reverseOrderPoints(orderId, `reembolso manual: ${trimmedReason}`);
            if (result.earnReverted > 0 || result.redeemReverted > 0) {
                console.log(`[Ops Refund] Points reverted for #${order.orderNumber}: earn=${result.earnReverted}, redeem=${result.redeemReverted}`);
            }
        } catch (pointsError) {
            console.error(`[Ops Refund] Points reverse error for #${order.orderNumber}:`, pointsError);
        }

        return NextResponse.json({
            success: true,
            refundedToMp: false,
            amount: refundAmount,
            message: `Reembolso de ${formatCurrency(refundAmount)} registrado manualmente para pedido #${order.orderNumber}`,
        });
    } catch (error) {
        console.error("Error processing refund:", error);
        return NextResponse.json({ error: "Error al procesar el reembolso" }, { status: 500 });
    }
}

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
}
