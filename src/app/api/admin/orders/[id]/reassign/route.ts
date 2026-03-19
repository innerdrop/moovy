import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { driverId } = body;

        if (!driverId || typeof driverId !== "string") {
            return NextResponse.json(
                { error: "driverId es requerido" },
                { status: 400 }
            );
        }

        // Verify driver exists
        const driver = await prisma.driver.findUnique({
            where: { id: driverId }
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Repartidor no encontrado" },
                { status: 404 }
            );
        }

        // Update order with new driver
        const { id } = await params;
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { driverId },
            include: {
                items: true,
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                driver: {
                    include: {
                        user: { select: { name: true } }
                    }
                },
                merchant: { select: { id: true, name: true } }
            }
        });

        // V-023 FIX: Audit log for driver reassignment
        await logAudit({
            action: "ORDER_DRIVER_REASSIGNED",
            entityType: "order",
            entityId: id,
            userId: session.user.id!,
            details: {
                newDriverId: driverId,
                previousDriverId: updatedOrder.driverId !== driverId ? "unknown" : null,
                orderNumber: updatedOrder.orderNumber,
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error reassigning order:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
