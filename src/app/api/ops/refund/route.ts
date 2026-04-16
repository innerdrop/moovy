import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// V-014 FIX: Refund with amount validation, reason requirement, audit logging
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

        // V-014: Require reason with minimum length
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

        // V-014: Validate payment was actually completed before allowing refund
        if (!["COMPLETED", "PAID"].includes(order.paymentStatus || "")) {
            return NextResponse.json({
                error: `No se puede reembolsar un pedido con estado de pago: ${order.paymentStatus || "sin pago"}`
            }, { status: 400 });
        }

        // V-014: Validate amount range (must be > 0 and <= order total)
        const refundAmount = amount ? Number(amount) : order.total;
        if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > order.total) {
            return NextResponse.json({
                error: `Monto inválido. Debe ser entre $0.01 y $${order.total}`
            }, { status: 400 });
        }

        const refundNote = `[REEMBOLSO ${new Date().toLocaleDateString("es-AR")}] $${refundAmount.toLocaleString("es-AR")} — ${reason.trim()} — Por: ${session.user?.name || session.user?.email}`;
        const existingNotes = order.adminNotes ? `${order.adminNotes}\n\n` : "";

        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "REFUNDED",
                adminNotes: `${existingNotes}${refundNote}`,
            },
        });

        // V-023 FIX: Audit log for refund operations
        await logAudit({
            action: "REFUND_PROCESSED",
            entityType: "order",
            entityId: orderId,
            userId: session.user.id,
            details: {
                refundAmount,
                reason: reason.trim(),
                originalTotal: order.total,
                orderNumber: order.orderNumber,
                paymentMethod: order.paymentMethod,
            },
        });

        // FIX 2026-04-15: revertir puntos al hacer refund manual (earn si hab\u00eda DELIVERED, redeem si us\u00f3 puntos)
        try {
            const { reverseOrderPoints } = await import("@/lib/points");
            const result = await reverseOrderPoints(orderId, `reembolso manual: ${reason.trim()}`);
            if (result.earnReverted > 0 || result.redeemReverted > 0) {
                console.log(`[Ops Refund] Points reverted for #${order.orderNumber}: earn=${result.earnReverted}, redeem=${result.redeemReverted}`);
            }
        } catch (pointsError) {
            console.error(`[Ops Refund] Points reverse error for #${order.orderNumber}:`, pointsError);
        }

        return NextResponse.json({
            success: true,
            message: `Reembolso de ${formatCurrency(refundAmount)} registrado para pedido #${order.orderNumber}`,
        });
    } catch (error) {
        console.error("Error processing refund:", error);
        return NextResponse.json({ error: "Error al procesar el reembolso" }, { status: 500 });
    }
}

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
}
