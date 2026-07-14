// API: Rate Merchant on an Order
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkContent, COMMENT_LIMITS } from "@/lib/moderation";
import { logAudit } from "@/lib/audit";
import { sendAdminReviewPendingEmail } from "@/lib/email-admin-ops";
import { awardReviewBonus } from "@/lib/points";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id: orderId } = await params;
        const userId = (session.user as any).id;
        const body = await request.json();
        const { rating, comment } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "La calificación debe ser entre 1 y 5" }, { status: 400 });
        }

        // feat/propinas-y-ratings-post-entrega (2026-05-08): validar limite de
        // chars del comentario y correr moderacion automatica via blacklist.
        const trimmedComment = typeof comment === "string" ? comment.trim() : "";
        if (trimmedComment.length > COMMENT_LIMITS.MERCHANT) {
            return NextResponse.json(
                { error: `El comentario debe tener máximo ${COMMENT_LIMITS.MERCHANT} caracteres` },
                { status: 400 }
            );
        }
        const moderation = checkContent(trimmedComment);
        const moderationStatus = moderation.isClean ? "AUTO_APPROVED" : "PENDING";

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { merchant: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // chore/limpiar-completed: "COMPLETED" no existe como estado de pedido
        // (bug de abril, eliminado y data migrada). Solo DELIVERED (regla #20).
        if (order.status !== "DELIVERED") {
            return NextResponse.json({ error: "El pedido debe estar entregado para calificar" }, { status: 400 });
        }

        if (order.merchantRating) {
            return NextResponse.json({ error: "Ya calificaste este comercio" }, { status: 400 });
        }

        if (!order.merchantId) {
            return NextResponse.json({ error: "Este pedido no tiene comercio" }, { status: 400 });
        }

        // V-019 FIX: Atomic transaction to prevent race condition
        const result = await prisma.$transaction(async (tx) => {
            // Re-check inside transaction to prevent TOCTOU race condition
            const freshOrder = await tx.order.findUnique({
                where: { id: orderId },
                select: { merchantRating: true }
            });

            if (freshOrder?.merchantRating) {
                throw new Error("ALREADY_RATED");
            }

            // Update order with merchant rating + moderation status del comment.
            // El rating numerico siempre se persiste y cuenta para el avg.
            // El comment se persiste igual aunque tenga match en la blacklist,
            // pero con moderationStatus = PENDING (invisible en publico hasta
            // que OPS revise desde /ops/moderacion).
            await tx.order.update({
                where: { id: orderId },
                data: {
                    merchantRating: rating,
                    ...(trimmedComment ? { merchantRatingComment: trimmedComment } : {}),
                    merchantRatingModerationStatus: moderationStatus,
                }
            });

            // Update merchant's average rating
            const merchantOrders = await tx.order.findMany({
                where: {
                    merchantId: order.merchantId!,
                    merchantRating: { not: null }
                },
                select: { merchantRating: true }
            });

            // Fix division by zero: if no previous ratings, just use the new rating
            const avgRating = merchantOrders.length > 0
                ? merchantOrders.reduce((sum, o) => sum + (o.merchantRating || 0), 0) / merchantOrders.length
                : rating;

            await tx.merchant.update({
                where: { id: order.merchantId! },
                data: { rating: avgRating }
            });

            return avgRating;
        }, { isolationLevel: "Serializable" });

        // Audit log si el comment fue marcado para moderacion. Util para que
        // OPS pueda investigar patrones (ej: usuario que repetidamente dispara
        // moderacion = posible abuso).
        if (!moderation.isClean) {
            await logAudit({
                action: "REVIEW_COMMENT_FLAGGED",
                entityType: "Order",
                entityId: orderId,
                userId,
                details: {
                    target: "MERCHANT",
                    matchedPatterns: moderation.matchedPatterns,
                    commentLength: trimmedComment.length,
                },
            }).catch(() => {});

            // feat/email-ops-comment-pending (2026-05-13): notificacion proactiva
            // a OPS. Fire-and-forget. Trae datos del autor y de la entidad para
            // que el admin tenga contexto sin abrir el panel.
            (async () => {
                try {
                    const ctx = await prisma.order.findUnique({
                        where: { id: orderId },
                        select: {
                            orderNumber: true,
                            user: { select: { name: true, email: true } },
                        },
                    });
                    await sendAdminReviewPendingEmail({
                        orderId,
                        orderNumber: ctx?.orderNumber || orderId,
                        target: "MERCHANT",
                        entityName: order.merchant?.name || null,
                        rating,
                        comment: trimmedComment,
                        authorName: ctx?.user?.name || null,
                        authorEmail: ctx?.user?.email || null,
                        reason: {
                            source: "BLACKLIST",
                            matchedPatterns: moderation.matchedPatterns,
                        },
                    });
                } catch (err) {
                    console.error("[rate-merchant] failed to notify OPS:", err);
                }
            })();
        }

        // feat/moover-bono-resena: bono por reseña, una sola vez por pedido
        // (idempotente aunque el user califique comercio + repartidor + vendedor).
        const reviewPoints = await awardReviewBonus(userId, orderId);

        return NextResponse.json({
            success: true,
            message: reviewPoints > 0
                ? `¡Gracias por tu calificación! Ganaste ${reviewPoints.toLocaleString("es-AR")} puntos.`
                : "¡Gracias por tu calificación!",
            newMerchantRating: result.toFixed(1),
            moderationStatus,
            pointsEarned: reviewPoints,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "ALREADY_RATED") {
            return NextResponse.json({ error: "Ya calificaste este comercio" }, { status: 400 });
        }
        console.error("Error rating merchant:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
