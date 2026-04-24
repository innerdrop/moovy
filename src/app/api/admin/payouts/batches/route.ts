import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import {
    getPendingDriverPayouts,
    getPendingMerchantPayouts,
} from "@/lib/payouts";
import { logger } from "@/lib/logger";

// GET /api/admin/payouts/batches?type=DRIVER|MERCHANT&status=PAID
export async function GET(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:payout-batches", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");

    try {
        const batches = await prisma.payoutBatch.findMany({
            where: {
                ...(type ? { batchType: type } : {}),
                ...(status ? { status } : {}),
            },
            include: { _count: { select: { items: true } } },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        return NextResponse.json({ ok: true, batches });
    } catch (error) {
        logger.error({ error }, "[admin/payouts/batches GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST /api/admin/payouts/batches — crear un batch a partir de todos los
// saldos pendientes del type indicado (o de una lista de recipientIds).
const CreateBatchSchema = z.object({
    batchType: z.enum(["DRIVER", "MERCHANT"]),
    // Opcional: restringir a recipientIds específicos. Si viene vacío, incluye todos los pendientes.
    recipientIds: z.array(z.string()).optional(),
    notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:payout-batch-create", 10, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = CreateBatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    try {
        // Obtener pendientes
        const pending = parsed.data.batchType === "DRIVER"
            ? await getPendingDriverPayouts()
            : await getPendingMerchantPayouts();

        const filtered = parsed.data.recipientIds && parsed.data.recipientIds.length > 0
            ? pending.filter((p) => parsed.data.recipientIds!.includes(p.recipientId))
            : pending;

        if (filtered.length === 0) {
            return NextResponse.json({ error: "No hay pagos pendientes para los recipients indicados" }, { status: 400 });
        }

        // Validar que cada recipient tenga bankAccount (CBU/alias)
        const missingBank = filtered.filter((p) => !p.bankAccount);
        if (missingBank.length > 0) {
            return NextResponse.json({
                error: `Hay ${missingBank.length} recipient(s) sin CBU/alias cargado: ${missingBank.slice(0, 3).map((m) => m.recipientName).join(", ")}${missingBank.length > 3 ? "..." : ""}. No se puede generar el batch hasta que carguen su banco.`,
                missingBank: missingBank.map((m) => ({ id: m.recipientId, name: m.recipientName })),
            }, { status: 400 });
        }

        // Calcular periodo: desde la orden más vieja hasta ahora
        const oldestOrder = await prisma.order.findFirst({
            where: { id: { in: filtered.flatMap((f) => f.orderIds) } },
            orderBy: { deliveredAt: "asc" },
            select: { deliveredAt: true, createdAt: true },
        });

        const periodStart = oldestOrder?.deliveredAt || oldestOrder?.createdAt || new Date();
        const periodEnd = new Date();

        const totalAmount = filtered.reduce((s, i) => s + i.totalAmount, 0);
        const itemCount = filtered.length;

        // Crear batch + items en una transacción
        const batch = await prisma.$transaction(async (tx) => {
            const b = await tx.payoutBatch.create({
                data: {
                    batchType: parsed.data.batchType,
                    status: "DRAFT",
                    periodStart,
                    periodEnd,
                    totalAmount: Math.round(totalAmount * 100) / 100,
                    itemCount,
                    generatedBy: adminId,
                    notes: parsed.data.notes || null,
                },
            });

            for (const p of filtered) {
                await tx.payoutItem.create({
                    data: {
                        batchId: b.id,
                        recipientType: p.recipientType,
                        recipientId: p.recipientId,
                        recipientName: p.recipientName,
                        bankAccount: p.bankAccount,
                        cuit: p.cuit,
                        amount: Math.round(p.totalAmount * 100) / 100,
                        ordersIncluded: JSON.stringify(p.orderIds),
                    },
                });
            }

            return b;
        });

        await prisma.auditLog.create({
            data: {
                action: "PAYOUT_BATCH_CREATED",
                entityType: "PayoutBatch",
                entityId: batch.id,
                userId: adminId,
                details: JSON.stringify({
                    batchType: parsed.data.batchType,
                    itemCount,
                    totalAmount,
                }),
            },
        });

        return NextResponse.json({ ok: true, batch });
    } catch (error) {
        logger.error({ error }, "[admin/payouts/batches POST] error");
        return NextResponse.json({ error: "Error creando batch" }, { status: 500 });
    }
}
