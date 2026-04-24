import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { buildPayoutCsv } from "@/lib/payouts";
import logger from "@/lib/logger";

// GET /api/admin/payouts/batches/[id]?format=csv|json
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:payout-batch-get", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";

    try {
        const batch = await prisma.payoutBatch.findUnique({
            where: { id },
            include: { items: { orderBy: { amount: "desc" } } },
        });
        if (!batch) return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });

        if (format === "csv") {
            const csv = buildPayoutCsv(batch);
            const filename = `moovy-${batch.batchType.toLowerCase()}-batch-${batch.id.substring(0, 8)}.csv`;
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json({ ok: true, batch });
    } catch (error) {
        logger.error({ error }, "[admin/payouts/batches/[id] GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE /api/admin/payouts/batches/[id] — cancelar un batch DRAFT o GENERATED
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:payout-batch-del", 10, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    try {
        const batch = await prisma.payoutBatch.findUnique({ where: { id } });
        if (!batch) return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });

        if (batch.status === "PAID") {
            return NextResponse.json(
                { error: "No se puede cancelar un batch ya pagado. Hay que iniciar una reversión manual." },
                { status: 409 },
            );
        }
        if (batch.status === "CANCELLED") {
            return NextResponse.json({ error: "El batch ya está cancelado" }, { status: 409 });
        }

        await prisma.payoutBatch.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        await prisma.auditLog.create({
            data: {
                action: "PAYOUT_BATCH_CANCELLED",
                entityType: "PayoutBatch",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({
                    batchType: batch.batchType,
                    priorStatus: batch.status,
                    totalAmount: batch.totalAmount,
                }),
            },
        });

        return NextResponse.json({ ok: true, cancelled: true });
    } catch (error) {
        logger.error({ error }, "[admin/payouts/batches/[id] DELETE] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
