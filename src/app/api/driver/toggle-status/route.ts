import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireDriverApi } from "@/lib/driver-auth";
import {
    DRIVER_DOCUMENT_COLUMNS,
    getRequiredDriverDocumentFields,
} from "@/lib/driver-document-approval";

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
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver: existingDriver } = authResult;

        const body = await request.json();
        const parsed = toggleStatusSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Campo isOnline (boolean) es requerido" },
                { status: 400 }
            );
        }

        const { isOnline } = parsed.data;

        // Driver is guaranteed non-null by requireDriverApi()
        if (!existingDriver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        if (existingDriver.approvalStatus !== "APPROVED") {
            // s2-2c-04: mensaje accionable en vez del genérico "no podés
            // conectarte". Distinguimos DOS casos: (a) le faltan documentos
            // (o tiene rechazados que debe re-subir) → le decimos CUÁLES y que
            // los cargue desde su perfil; (b) docs completos esperando revisión
            // → le decimos que el equipo de Moovy lo está validando.
            const driverRow = existingDriver as unknown as Record<string, unknown>;
            const required = getRequiredDriverDocumentFields(existingDriver.vehicleType);

            const actionable = required.filter((field) => {
                const cfg = DRIVER_DOCUMENT_COLUMNS[field];
                const missing = !driverRow[cfg.valueColumn];
                const rejected = driverRow[cfg.statusColumn] === "REJECTED";
                return missing || rejected;
            });

            if (actionable.length > 0) {
                const labels = actionable.map((f) => DRIVER_DOCUMENT_COLUMNS[f].label);
                // Mensaje CORTO a propósito: la lista completa de docs no entra en
                // un toast (QA 2026-06-11: quedaba ilegible). El detalle de qué
                // falta vive en el perfil, que muestra cada doc con su estado.
                // missingDocs queda en la response por si algún cliente lo quiere.
                return NextResponse.json(
                    {
                        error: "Te falta cargar documentación para poder conectarte.",
                        errorCode: "MISSING_DOCS",
                        missingDocs: labels,
                    },
                    { status: 403 }
                );
            }

            return NextResponse.json(
                {
                    error: "Tu documentación está completa y en revisión. El equipo de Moovy te avisa por email apenas estés aprobado (generalmente dentro de las 24-48 hs).",
                    errorCode: "PENDING_REVIEW",
                },
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
