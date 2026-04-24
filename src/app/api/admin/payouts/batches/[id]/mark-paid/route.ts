import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

/**
 * POST /api/admin/payouts/batches/[id]/mark-paid
 *
 * CRÍTICO: marca el batch como PAID. Requiere confirmación explícita doble
 * via body `{ confirmText: "CONFIRMAR PAGO" }` (string exacto, case-sensitive).
 * Una vez marcado como PAID, los orderIds quedan "consumidos" y no se pueden
 * incluir en un batch nuevo.
 *
 * MOOVY NUNCA dispara plata sola. Este endpoint solo REGISTRA que el admin ya
 * hizo la transferencia por fuera (MP Bulk Transfer / banco) — no ejecuta
 * ningún pago por sí mismo.
 */
const MarkPaidSchema = z.object({
    confirmText: z.literal("CONFIRMAR PAGO"),
    notes: z.string().max(1000).optional(),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:payout-mark-paid", 5, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = MarkPaidSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Para confirmar debés enviar confirmText='CONFIRMAR PAGO'" },
            { status: 400 },
        );
    }

    try {
        const batch = await prisma.payoutBatch.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!batch) return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });

        if (batch.status === "PAID") {
            return NextResponse.json({ error: "El batch ya está pagado" }, { status: 409 });
        }
        if (batch.status === "CANCELLED") {
            return NextResponse.json({ error: "No se puede marcar como pagado un batch cancelado" }, { status: 409 });
        }

        // Actualizamos atómicamente + audit + marca commissionPaid en orders (solo MERCHANT)
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.payoutBatch.update({
                where: { id },
                data: {
                    status: "PAID",
                    paidBy: adminId,
                    paidAt: new Date(),
                    notes: parsed.data.notes || batch.notes,
                },
            });

            // Para batches MERCHANT, marcar Order.commissionPaid = true en todos los orders consumidos
            if (batch.batchType === "MERCHANT") {
                const allOrderIds: string[] = [];
                for (const item of batch.items) {
                    try {
                        const arr = JSON.parse(item.ordersIncluded);
                        if (Array.isArray(arr)) for (const oid of arr) if (typeof oid === "string") allOrderIds.push(oid);
                    } catch { /* ignored */ }
                }
                if (allOrderIds.length > 0) {
                    await tx.order.updateMany({
                        where: { id: { in: allOrderIds } },
                        data: { commissionPaid: true },
                    });
                }
            }

            return updated;
        }, { isolationLevel: "Serializable" });

        await prisma.auditLog.create({
            data: {
                action: "PAYOUT_BATCH_PAID",
                entityType: "PayoutBatch",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({
                    batchType: batch.batchType,
                    totalAmount: batch.totalAmount,
                    itemCount: batch.itemCount,
                    notes: parsed.data.notes,
                }),
            },
        });

        logger.info(
            { batchId: id, batchType: batch.batchType, totalAmount: batch.totalAmount, itemCount: batch.itemCount, adminId },
            "[admin/payouts/mark-paid] batch marked as PAID",
        );

        return NextResponse.json({ ok: true, batch: result });
    } catch (error) {
        logger.error({ error, batchId: id }, "[admin/payouts/batches/[id]/mark-paid] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
