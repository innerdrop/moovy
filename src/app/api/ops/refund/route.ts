import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// POST — Mark order as refunded (manual refund tracking)
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { orderId, amount, reason } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
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

        const refundAmount = amount || order.total;
        const refundNote = `[REEMBOLSO ${new Date().toLocaleDateString("es-AR")}] $${refundAmount.toLocaleString("es-AR")} — ${reason || "Sin motivo especificado"} — Por: ${session.user?.name || session.user?.email}`;
        const existingNotes = order.adminNotes ? `${order.adminNotes}\n\n` : "";

        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "REFUNDED",
                adminNotes: `${existingNotes}${refundNote}`,
            },
        });

        // Restore MOOVER points if any were used (future enhancement)
        // TODO: If the order used MOOVER points, restore them to the user

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
