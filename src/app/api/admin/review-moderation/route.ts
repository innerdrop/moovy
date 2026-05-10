// API: gestion OPS de reviews bajo moderacion.
//
// feat/propinas-y-ratings-post-entrega (2026-05-08): endpoint que sirve la
// pagina /ops/(protected)/reviews-pendientes:
//
//   GET  → lista todos los Order con al menos un rating en moderationStatus
//          = "PENDING" (gatillado por blacklist o por >= 3 reportes de la
//          comunidad). Devuelve para cada uno: el comentario afectado, el
//          autor, target (driver/merchant/seller), reportCount, y los
//          ultimos reportes con sus razones.
//
//   PATCH → resuelve una review pendiente. Body { orderId, target,
//           resolution: "APPROVED" | "REJECTED" }. APPROVED = el comentario
//           era OK, lo dejamos publico (status -> APPROVED). REJECTED = el
//           comentario es inapropiado, lo borramos del campo y dejamos
//           moderationStatus = REJECTED para audit. Cierra todos los
//           RatingReport pendientes asociados con resolvedAt + resolution.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// ──────────────── GET ────────────────

export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Buscar Orders con cualquiera de los 3 ratings en PENDING.
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { driverRatingModerationStatus: "PENDING" },
                    { merchantRatingModerationStatus: "PENDING" },
                    { sellerRatingModerationStatus: "PENDING" },
                ],
            },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                user: { select: { id: true, name: true, email: true } },
                driverRating: true,
                ratingComment: true,
                driverRatingModerationStatus: true,
                driverRatingReportCount: true,
                merchantRating: true,
                merchantRatingComment: true,
                merchantRatingModerationStatus: true,
                merchantRatingReportCount: true,
                sellerRating: true,
                sellerRatingComment: true,
                sellerRatingModerationStatus: true,
                sellerRatingReportCount: true,
                merchant: { select: { id: true, name: true } },
                driver: { select: { id: true, user: { select: { name: true } } } },
                ratingReports: {
                    where: { resolvedAt: null },
                    select: {
                        id: true,
                        target: true,
                        reason: true,
                        createdAt: true,
                        reporter: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
            orderBy: { createdAt: "desc" },
            take: 200, // safeguard de paginacion para queues grandes
        });

        // Aplanar a una lista de "items pendientes" — uno por target en moderacion
        // dentro de cada Order. Mas comodo de renderizar en la pagina OPS.
        const items: Array<{
            orderId: string;
            orderNumber: string;
            target: "DRIVER" | "MERCHANT" | "SELLER";
            rating: number | null;
            comment: string | null;
            moderationStatus: string;
            reportCount: number;
            authorName: string | null;
            authorEmail: string | null;
            entityName: string | null;
            reports: Array<{
                id: string;
                reason: string | null;
                reporterName: string | null;
                createdAt: string;
            }>;
        }> = [];

        for (const o of orders) {
            const buildItem = (
                target: "DRIVER" | "MERCHANT" | "SELLER",
                rating: number | null,
                comment: string | null,
                moderationStatus: string,
                reportCount: number,
                entityName: string | null,
            ) => ({
                orderId: o.id,
                orderNumber: o.orderNumber,
                target,
                rating,
                comment,
                moderationStatus,
                reportCount,
                authorName: o.user?.name ?? null,
                authorEmail: o.user?.email ?? null,
                entityName,
                reports: o.ratingReports
                    .filter((r) => r.target === target)
                    .map((r) => ({
                        id: r.id,
                        reason: r.reason,
                        reporterName: r.reporter?.name ?? null,
                        createdAt: r.createdAt.toISOString(),
                    })),
            });

            if (o.driverRatingModerationStatus === "PENDING") {
                items.push(buildItem(
                    "DRIVER",
                    o.driverRating,
                    o.ratingComment,
                    o.driverRatingModerationStatus,
                    o.driverRatingReportCount,
                    o.driver?.user?.name ?? null,
                ));
            }
            if (o.merchantRatingModerationStatus === "PENDING") {
                items.push(buildItem(
                    "MERCHANT",
                    o.merchantRating,
                    o.merchantRatingComment,
                    o.merchantRatingModerationStatus,
                    o.merchantRatingReportCount,
                    o.merchant?.name ?? null,
                ));
            }
            if (o.sellerRatingModerationStatus === "PENDING") {
                items.push(buildItem(
                    "SELLER",
                    o.sellerRating,
                    o.sellerRatingComment,
                    o.sellerRatingModerationStatus,
                    o.sellerRatingReportCount,
                    null, // seller name viene del subOrder, no lo incluimos en el list view
                ));
            }
        }

        return NextResponse.json({ items, total: items.length });
    } catch (error: any) {
        console.error("[admin/review-moderation GET] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// ──────────────── PATCH ────────────────

const resolveSchema = z.object({
    orderId: z.string().min(1),
    target: z.enum(["DRIVER", "MERCHANT", "SELLER"]),
    resolution: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const adminId = (session?.user as any)?.id as string;
        const adminEmail = (session?.user as any)?.email as string;

        const body = await request.json().catch(() => ({}));
        const parsed = resolveSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Body inválido" },
                { status: 400 }
            );
        }

        const { orderId, target, resolution } = parsed.data;

        const moderationCol =
            target === "DRIVER" ? "driverRatingModerationStatus" :
            target === "MERCHANT" ? "merchantRatingModerationStatus" :
            "sellerRatingModerationStatus";
        const commentCol =
            target === "DRIVER" ? "ratingComment" :
            target === "MERCHANT" ? "merchantRatingComment" :
            "sellerRatingComment";

        await prisma.$transaction(async (tx) => {
            // Verificar que efectivamente esta PENDING (anti-races con otro admin).
            const order = await tx.order.findUnique({
                where: { id: orderId },
                select: { [moderationCol]: true } as any,
            });
            if (!order) throw new Error("ORDER_NOT_FOUND");
            if ((order as any)[moderationCol] !== "PENDING") {
                throw new Error("NOT_PENDING");
            }

            // APPROVED -> dejamos visible (status APPROVED, comentario intacto).
            // REJECTED -> borramos comentario + status REJECTED. El rating numerico
            //             siempre se preserva porque cuenta en el avg.
            const updateData: any = { [moderationCol]: resolution };
            if (resolution === "REJECTED") {
                updateData[commentCol] = null;
            }
            await tx.order.update({ where: { id: orderId }, data: updateData });

            // Cerrar todos los RatingReport pendientes de este target en este order.
            await tx.ratingReport.updateMany({
                where: {
                    orderId,
                    target,
                    resolvedAt: null,
                },
                data: {
                    resolvedAt: new Date(),
                    resolvedBy: adminId,
                    resolution,
                },
            });
        }, { isolationLevel: "Serializable" });

        await logAudit({
            action: "REVIEW_MODERATION_RESOLVED",
            entityType: "Order",
            entityId: orderId,
            userId: adminId,
            details: {
                target,
                resolution,
                resolvedBy: adminEmail,
            },
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            message: resolution === "APPROVED"
                ? "Reseña aprobada y publicada."
                : "Comentario rechazado. La calificación numérica se mantiene.",
        });
    } catch (error: any) {
        if (error?.message === "ORDER_NOT_FOUND") {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }
        if (error?.message === "NOT_PENDING") {
            return NextResponse.json({ error: "Esta reseña ya fue resuelta" }, { status: 409 });
        }
        console.error("[admin/review-moderation PATCH] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
