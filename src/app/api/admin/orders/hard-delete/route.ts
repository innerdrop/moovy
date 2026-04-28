// Endpoint: DELETE permanente de pedidos.
//
// fix/aprobacion-sin-foto-driver (2026-04-28): el endpoint regular
// `DELETE /api/admin/orders` solo hace soft delete (setea deletedAt). Para casos
// excepcionales —pedidos colgados de testing, errores de drift o duplicados—
// el admin necesita poder eliminar permanentemente desde la base. Este endpoint
// requiere confirmación textual explícita (literal "ELIMINAR DEFINITIVAMENTE")
// en el body para evitar accidentes y deja audit log antes del delete.
//
// Relaciones de Order: las que tienen onDelete: Cascade en el schema
// (OrderItem, OrderChat, OrderChatMessage, AssignmentLog, PendingAssignment,
// DeliveryAttempt, OrderRating, etc.) se borran automáticamente al borrar el
// Order. Las que NO tienen Cascade (SubOrder, Payment) se borran manualmente
// dentro de la transacción para evitar foreign-key violations.
//
// PointsTransaction.orderId y CouponUsage.orderId son nullable y NO tienen
// relation FK declarada al Order, así que no requieren cleanup manual — los
// registros quedan con orderId apuntando a un Order que ya no existe, lo cual
// es aceptable porque son tablas de auditoría histórica del USER (no del Order).

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const REQUIRED_CONFIRM = "ELIMINAR DEFINITIVAMENTE";

const BodySchema = z.object({
    orderIds: z.array(z.string().min(1)).min(1).max(100),
    confirmText: z.literal(REQUIRED_CONFIRM, {
        errorMap: () => ({
            message: `Debés escribir exactamente "${REQUIRED_CONFIRM}" para confirmar`,
        }),
    }),
});

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            return NextResponse.json(
                { error: firstIssue?.message || "Datos inválidos" },
                { status: 400 }
            );
        }

        const { orderIds } = parsed.data;

        // Snapshot mínimo para audit antes de borrar.
        const ordersToDelete = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: {
                id: true,
                orderNumber: true,
                total: true,
                status: true,
                userId: true,
                deletedAt: true,
            },
        });

        if (ordersToDelete.length === 0) {
            return NextResponse.json(
                { error: "Ningún pedido encontrado con los IDs provistos" },
                { status: 404 }
            );
        }

        // Audit log ANTES del delete: si la transacción explota, queda registro de
        // qué intentó borrar. logAudit usa una row independiente, no transaccional.
        await logAudit({
            action: "ORDERS_HARD_DELETED",
            entityType: "Order",
            entityId: orderIds.join(","),
            userId: session.user.id,
            details: {
                adminEmail: session.user.email ?? "unknown",
                count: ordersToDelete.length,
                requestedIds: orderIds,
                snapshot: ordersToDelete.map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    total: o.total,
                    status: o.status,
                    userId: o.userId,
                    wasSoftDeleted: o.deletedAt !== null,
                })),
            },
        });

        // Transacción: borrar primero las tablas sin Cascade, después la Order.
        // Las tablas con Cascade (OrderItem, OrderChat, AssignmentLog, etc.) se
        // borran automáticamente al borrar la Order.
        const result = await prisma.$transaction(async (tx) => {
            // 1. Payment (sin Cascade, ver schema línea 1379).
            const paymentsDeleted = await tx.payment.deleteMany({
                where: { orderId: { in: orderIds } },
            });

            // 2. SubOrder (sin Cascade, ver schema línea 433). Sus relaciones
            // hijas (OrderItem.subOrderId, DeliveryAttempt.subOrderId) tienen
            // SetNull/Cascade configurados en sus modelos respectivos.
            const subOrdersDeleted = await tx.subOrder.deleteMany({
                where: { orderId: { in: orderIds } },
            });

            // 3. Order — el resto se borra por Cascade.
            const ordersDeleted = await tx.order.deleteMany({
                where: { id: { in: orderIds } },
            });

            return {
                paymentsDeleted: paymentsDeleted.count,
                subOrdersDeleted: subOrdersDeleted.count,
                ordersDeleted: ordersDeleted.count,
            };
        });

        return NextResponse.json({
            success: true,
            message: `${result.ordersDeleted} pedido(s) eliminado(s) permanentemente`,
            ...result,
        });
    } catch (error) {
        console.error("Error en hard delete de orders:", error);
        return NextResponse.json(
            { error: "Error interno al eliminar pedidos" },
            { status: 500 }
        );
    }
}
