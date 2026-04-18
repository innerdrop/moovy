import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const toggleStatusSchema = z.object({
    isOnline: z.boolean(),
});

// Estados que implican compromiso activo del driver con una entrega en curso.
// Si el driver está en cualquiera de estos estados NO puede desconectarse,
// porque romper el vínculo deja al buyer sin repartidor a mitad del flujo.
// Mismo criterio que /api/driver/active-order (fuente de verdad para el portal switcher).
const ACTIVE_DELIVERY_STATUSES = ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP"] as const;

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores pueden cambiar su estado" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = toggleStatusSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Campo isOnline (boolean) es requerido" },
                { status: 400 }
            );
        }

        const { isOnline } = parsed.data;

        // Verify driver exists and is approved before allowing status toggle
        const existingDriver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { id: true, approvalStatus: true, isActive: true },
        });

        if (!existingDriver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        if (existingDriver.approvalStatus !== "APPROVED") {
            return NextResponse.json(
                { error: "Tu solicitud está pendiente de aprobación. No podés conectarte hasta ser aprobado." },
                { status: 403 }
            );
        }

        if (!existingDriver.isActive) {
            return NextResponse.json(
                { error: "Tu cuenta de repartidor está desactivada. Contactá a soporte." },
                { status: 403 }
            );
        }

        // Guard crítico: bloquear desconexión con pedido activo.
        // Un driver que se desconecta con orden en curso deja al buyer sin
        // repartidor visible, sin tracking y con el pedido congelado en un estado
        // operativo. Debe completar la entrega o cancelar desde el flujo del pedido
        // antes de irse. Solo aplicamos el check cuando isOnline === false; si se
        // está conectando no hay nada que bloquear.
        if (!isOnline) {
            const activeOrder = await prisma.order.findFirst({
                where: {
                    driverId: existingDriver.id,
                    deliveryStatus: { in: [...ACTIVE_DELIVERY_STATUSES] },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    deliveryStatus: true,
                },
                orderBy: { updatedAt: "desc" },
            });

            if (activeOrder) {
                return NextResponse.json(
                    {
                        error: "Tenés una entrega en curso. Completala antes de desconectarte.",
                        errorCode: "ACTIVE_ORDER",
                        activeOrder: {
                            id: activeOrder.id,
                            orderNumber: activeOrder.orderNumber,
                            deliveryStatus: activeOrder.deliveryStatus,
                        },
                    },
                    { status: 409 }
                );
            }

            // Mismo guard para SubOrders (multi-vendor). Cada SubOrder tiene su
            // propio driver/delivery independiente; el driver puede estar
            // comprometido a través de una SubOrder aunque Order.driverId no apunte a él.
            const activeSubOrder = await prisma.subOrder.findFirst({
                where: {
                    driverId: existingDriver.id,
                    deliveryStatus: { in: [...ACTIVE_DELIVERY_STATUSES] },
                },
                select: {
                    id: true,
                    orderId: true,
                    deliveryStatus: true,
                    order: { select: { orderNumber: true } },
                },
                orderBy: { updatedAt: "desc" },
            });

            if (activeSubOrder) {
                return NextResponse.json(
                    {
                        error: "Tenés una entrega en curso. Completala antes de desconectarte.",
                        errorCode: "ACTIVE_ORDER",
                        activeOrder: {
                            id: activeSubOrder.orderId,
                            orderNumber: activeSubOrder.order.orderNumber,
                            deliveryStatus: activeSubOrder.deliveryStatus,
                        },
                    },
                    { status: 409 }
                );
            }
        }

        const driver = await prisma.driver.update({
            where: { id: existingDriver.id },
            data: {
                isOnline,
                availabilityStatus: isOnline ? "DISPONIBLE" : "FUERA_DE_SERVICIO"
            }
        });

        return NextResponse.json({
            success: true,
            isOnline: driver.isOnline,
            status: driver.availabilityStatus
        });
    } catch (error) {
        console.error("Error toggling driver status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
