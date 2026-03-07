// API Route: Get payment status for an order (polling endpoint)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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
                mpStatus: true,
                paidAt: true,
                mpPreferenceId: true,
                orderNumber: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        // Only owner or admin can check payment status
        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        if (order.userId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        return NextResponse.json({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus,
            mpStatus: order.mpStatus,
            paidAt: order.paidAt,
        });
    } catch (error) {
        console.error("Error fetching payment status:", error);
        return NextResponse.json(
            { error: "Error al consultar el estado del pago" },
            { status: 500 }
        );
    }
}
