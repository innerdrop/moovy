import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

/**
 * GET /api/admin/pipeline-comercios
 *
 * Devuelve los comercios agrupados en columnas del kanban de onboarding:
 *   - pendiente_docs : PENDING sin todos los docs cargados (registro incompleto)
 *   - en_revision    : PENDING con docs cargados esperando aprobación
 *   - aprobados      : APPROVED últimos 30 días
 *   - rechazados     : REJECTED últimos 30 días
 *
 * La fecha "hace X" se calcula sobre `createdAt` (registro) o `approvedAt` /
 * `rejectedAt` según corresponda. No requiere schema nuevo — todo se deriva.
 */
export async function GET(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:pipeline", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [pending, approved, rejected] = await Promise.all([
            prisma.merchant.findMany({
                where: {
                    approvalStatus: "PENDING",
                    },
                select: {
                    id: true,
                    name: true,
                    businessName: true,
                    category: true,
                    createdAt: true,
                    updatedAt: true,
                    owner: { select: { id: true, email: true, name: true, phone: true } },
                    constanciaAfipUrl: true,
                    habilitacionMunicipalUrl: true,
                    registroSanitarioUrl: true,
                    cuit: true,
                    bankAccount: true,
                },
                orderBy: { createdAt: "desc" },
                take: 200,
            }),
            prisma.merchant.findMany({
                where: {
                    approvalStatus: "APPROVED",
                    approvedAt: { gte: thirtyDaysAgo },
                    },
                select: {
                    id: true,
                    name: true,
                    businessName: true,
                    category: true,
                    createdAt: true,
                    approvedAt: true,
                    owner: { select: { id: true, email: true, name: true, phone: true } },
                },
                orderBy: { approvedAt: "desc" },
                take: 100,
            }),
            prisma.merchant.findMany({
                where: {
                    approvalStatus: "REJECTED",
                    updatedAt: { gte: thirtyDaysAgo },
                    },
                select: {
                    id: true,
                    name: true,
                    businessName: true,
                    category: true,
                    createdAt: true,
                    updatedAt: true,
                    rejectionReason: true,
                    owner: { select: { id: true, email: true, name: true, phone: true } },
                },
                orderBy: { updatedAt: "desc" },
                take: 100,
            }),
        ]);

        // Separar pendientes: sin docs (incompleto) vs con docs (en revisión)
        const pendingIncomplete: any[] = [];
        const pendingReady: any[] = [];
        for (const m of pending) {
            const hasAllDocs =
                !!m.constanciaAfipUrl &&
                !!m.habilitacionMunicipalUrl &&
                !!m.cuit &&
                !!m.bankAccount;
            if (hasAllDocs) pendingReady.push(m);
            else pendingIncomplete.push(m);
        }

        return NextResponse.json({
            ok: true,
            columns: {
                pendiente_docs: pendingIncomplete,
                en_revision: pendingReady,
                aprobados: approved,
                rechazados: rejected,
            },
            counts: {
                pendiente_docs: pendingIncomplete.length,
                en_revision: pendingReady.length,
                aprobados: approved.length,
                rechazados: rejected.length,
            },
        });
    } catch (error) {
        logger.error({ error }, "[admin/pipeline-comercios GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
