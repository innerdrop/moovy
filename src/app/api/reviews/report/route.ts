// API: Reporte de review por la comunidad.
//
// feat/propinas-y-ratings-post-entrega (2026-05-08): cualquier user logueado
// puede reportar un comentario publico (driver / comercio / seller) que
// considere inapropiado. Si la review acumula >= REPORT_THRESHOLD (3), el
// sistema la baja automaticamente a moderationStatus = PENDING y queda
// invisible hasta que OPS apruebe o rechace desde /ops/moderacion.
//
// Append-only: cada reporte deja registro en RatingReport. Esto permite
// detectar patrones de abuso (usuarios que reportan masivamente para
// silenciar a competidores) y construir reputacion del reporter en el futuro.
//
// Reglas:
// - Auth obligatoria. Anonimos no reportan (anti-spam).
// - El reporter no puede reportar su propio comentario.
// - El mismo reporter no puede reportar el mismo target dos veces.
// - El comentario debe estar visible (AUTO_APPROVED o APPROVED) para reportarse;
//   si ya esta PENDING/REJECTED, no tiene sentido.
// - El target debe tener un comment realmente cargado (no se reporta un
//   rating sin comentario, no hay nada que moderar).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMENT_LIMITS, REPORT_THRESHOLD } from "@/lib/moderation";
import { logAudit } from "@/lib/audit";
import { sendAdminReviewPendingEmail } from "@/lib/email-admin-ops";

const reportSchema = z.object({
    orderId: z.string().min(1, "orderId requerido"),
    target: z.enum(["DRIVER", "MERCHANT", "SELLER"]),
    reason: z.string().max(COMMENT_LIMITS.REPORT_REASON).optional().nullable(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Tenés que iniciar sesión para reportar" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json().catch(() => ({}));
        const parsed = reportSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Body inválido" },
                { status: 400 }
            );
        }

        const { orderId, target, reason } = parsed.data;

        // Buscar el order y los campos relevantes segun el target.
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true, // el dueno del pedido (autor del comment)
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
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // El autor del comentario no puede reportar su propio comentario.
        if (order.userId === userId) {
            return NextResponse.json(
                { error: "No podés reportar tu propio comentario" },
                { status: 403 }
            );
        }

        // Validar segun target: que haya comentario y que este en estado reportable.
        let comment: string | null = null;
        let moderationStatus: string = "AUTO_APPROVED";
        if (target === "DRIVER") {
            comment = order.ratingComment;
            moderationStatus = order.driverRatingModerationStatus;
        } else if (target === "MERCHANT") {
            comment = order.merchantRatingComment;
            moderationStatus = order.merchantRatingModerationStatus;
        } else if (target === "SELLER") {
            comment = order.sellerRatingComment;
            moderationStatus = order.sellerRatingModerationStatus;
        }

        if (!comment || !comment.trim()) {
            return NextResponse.json(
                { error: "Esa reseña no tiene comentario para moderar" },
                { status: 400 }
            );
        }

        if (moderationStatus !== "AUTO_APPROVED" && moderationStatus !== "APPROVED") {
            // Ya esta en moderacion o fue rechazada — no aceptamos mas reportes.
            return NextResponse.json(
                { error: "Esa reseña ya está siendo revisada por el equipo de Moovy" },
                { status: 409 }
            );
        }

        // Anti-duplicado: mismo reporter no puede reportar el mismo target dos veces.
        const existing = await prisma.ratingReport.findFirst({
            where: { orderId, target, reporterUserId: userId },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json(
                { error: "Ya reportaste esta reseña" },
                { status: 409 }
            );
        }

        // Tx atomica: insertar reporte + bumpear count + (si pasa threshold) bajar a PENDING.
        const result = await prisma.$transaction(async (tx) => {
            await tx.ratingReport.create({
                data: {
                    orderId,
                    reporterUserId: userId,
                    target,
                    reason: reason?.trim() || null,
                },
            });

            // Incrementar reportCount del campo correspondiente y, si llega a
            // REPORT_THRESHOLD, bajar a PENDING.
            const reportCountColumn =
                target === "DRIVER" ? "driverRatingReportCount" :
                target === "MERCHANT" ? "merchantRatingReportCount" :
                "sellerRatingReportCount";
            const moderationColumn =
                target === "DRIVER" ? "driverRatingModerationStatus" :
                target === "MERCHANT" ? "merchantRatingModerationStatus" :
                "sellerRatingModerationStatus";

            const currentCount =
                target === "DRIVER" ? order.driverRatingReportCount :
                target === "MERCHANT" ? order.merchantRatingReportCount :
                order.sellerRatingReportCount;
            const newCount = currentCount + 1;
            const reachedThreshold = newCount >= REPORT_THRESHOLD;

            const updateData: any = { [reportCountColumn]: newCount };
            if (reachedThreshold) {
                updateData[moderationColumn] = "PENDING";
            }
            await tx.order.update({
                where: { id: orderId },
                data: updateData,
            });

            return { newCount, reachedThreshold };
        }, { isolationLevel: "Serializable" });

        await logAudit({
            action: "REVIEW_COMMENT_REPORTED",
            entityType: "Order",
            entityId: orderId,
            userId,
            details: {
                target,
                reason: reason?.trim() || null,
                newReportCount: result.newCount,
                triggeredAutoHide: result.reachedThreshold,
            },
        }).catch(() => {});

        // feat/email-ops-comment-pending (2026-05-13): si este reporte fue el
        // que gatillo el threshold (3+), avisamos a OPS para que revise. Solo
        // se manda UNA vez por review (cuando pasa de < threshold a >=
        // threshold) — los reportes adicionales post-threshold no re-disparan
        // el email para evitar spam.
        if (result.reachedThreshold) {
            (async () => {
                try {
                    const ctx = await prisma.order.findUnique({
                        where: { id: orderId },
                        select: {
                            orderNumber: true,
                            user: { select: { name: true, email: true } },
                            merchant: { select: { name: true } },
                            driver: { select: { user: { select: { name: true } } } },
                            subOrders: {
                                where: { sellerId: { not: null } },
                                select: { seller: { select: { displayName: true } } },
                                take: 1,
                            },
                            ratingReports: {
                                where: { orderId, target, resolvedAt: null },
                                select: {
                                    reason: true,
                                    reporter: { select: { name: true } },
                                },
                                orderBy: { createdAt: "desc" },
                                take: 5,
                            },
                        },
                    });

                    // Construir entityName + comment + rating segun target
                    const orderForFields = await prisma.order.findUnique({
                        where: { id: orderId },
                        select: {
                            ratingComment: true,
                            driverRating: true,
                            merchantRatingComment: true,
                            merchantRating: true,
                            sellerRatingComment: true,
                            sellerRating: true,
                        },
                    });
                    const commentText =
                        target === "DRIVER" ? orderForFields?.ratingComment :
                        target === "MERCHANT" ? orderForFields?.merchantRatingComment :
                        orderForFields?.sellerRatingComment;
                    const ratingValue =
                        target === "DRIVER" ? orderForFields?.driverRating :
                        target === "MERCHANT" ? orderForFields?.merchantRating :
                        orderForFields?.sellerRating;
                    const entityName =
                        target === "DRIVER" ? ctx?.driver?.user?.name || null :
                        target === "MERCHANT" ? ctx?.merchant?.name || null :
                        ctx?.subOrders?.[0]?.seller?.displayName || null;

                    if (commentText && typeof ratingValue === "number") {
                        await sendAdminReviewPendingEmail({
                            orderId,
                            orderNumber: ctx?.orderNumber || orderId,
                            target,
                            entityName,
                            rating: ratingValue,
                            comment: commentText,
                            authorName: ctx?.user?.name || null,
                            authorEmail: ctx?.user?.email || null,
                            reason: {
                                source: "REPORTS",
                                reportCount: result.newCount,
                                recentReports: (ctx?.ratingReports || []).map((r) => ({
                                    reason: r.reason,
                                    reporterName: r.reporter?.name || null,
                                })),
                            },
                        });
                    }
                } catch (err) {
                    console.error("[reviews/report] failed to notify OPS:", err);
                }
            })();
        }

        return NextResponse.json({
            success: true,
            message: result.reachedThreshold
                ? "Gracias. Pasamos la reseña al equipo de Moovy para revisar."
                : "Gracias por reportar. Si más usuarios reportan esta reseña, el equipo de Moovy va a revisarla.",
            reportCount: result.newCount,
            wasHidden: result.reachedThreshold,
        });
    } catch (error: any) {
        console.error("[reviews/report] Error:", error);
        return NextResponse.json(
            { error: "Error al procesar el reporte" },
            { status: 500 }
        );
    }
}
