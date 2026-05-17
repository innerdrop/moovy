// API: Rate Seller on an Order (marketplace)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkContent, COMMENT_LIMITS } from "@/lib/moderation";
import { logAudit } from "@/lib/audit";
import { sendAdminReviewPendingEmail } from "@/lib/email-admin-ops";

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

        // feat/propinas-y-ratings-post-entrega (2026-05-08): validar limite +
        // moderacion automatica del comentario.
        const trimmedComment = typeof comment === "string" ? comment.trim() : "";
        if (trimmedComment.length > COMMENT_LIMITS.SELLER) {
            return NextResponse.json(
                { error: `El comentario debe tener máximo ${COMMENT_LIMITS.SELLER} caracteres` },
                { status: 400 }
            );
        }
        const moderation = checkContent(trimmedComment);
        const moderationStatus = moderation.isClean ? "AUTO_APPROVED" : "PENDING";

        // Find the order and its sub-orders with sellers
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                subOrders: {
                    where: { sellerId: { not: null } },
                    include: { seller: true }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (order.status !== "DELIVERED" && order.status !== "COMPLETED") {
            return NextResponse.json({ error: "El pedido debe estar entregado para calificar" }, { status: 400 });
        }

        if (order.sellerRating) {
            return NextResponse.json({ error: "Ya calificaste al vendedor" }, { status: 400 });
        }

        // Find the seller from sub-orders
        const sellerSubOrder = order.subOrders.find(so => so.sellerId);
        if (!sellerSubOrder || !sellerSubOrder.sellerId) {
            return NextResponse.json({ error: "Este pedido no tiene vendedor del marketplace" }, { status: 400 });
        }

        const sellerId = sellerSubOrder.sellerId;

        // V-019 FIX: Atomic transaction to prevent race condition
        const result = await prisma.$transaction(async (tx) => {
            // Re-check inside transaction to prevent TOCTOU race condition
            const freshOrder = await tx.order.findUnique({
                where: { id: orderId },
                select: { sellerRating: true }
            });

            if (freshOrder?.sellerRating) {
                throw new Error("ALREADY_RATED");
            }

            // Update order with seller rating + moderation status del comment.
            await tx.order.update({
                where: { id: orderId },
                data: {
                    sellerRating: rating,
                    ...(trimmedComment ? { sellerRatingComment: trimmedComment } : {}),
                    sellerRatingModerationStatus: moderationStatus,
                }
            });

            // Update seller's average rating
            const sellerOrders = await tx.order.findMany({
                where: {
                    sellerRating: { not: null },
                    subOrders: {
                        some: { sellerId }
                    }
                },
                select: { sellerRating: true }
            });

            // Fix division by zero: if no previous ratings, just use the new rating
            const avgRating = sellerOrders.length > 0
                ? sellerOrders.reduce((sum, o) => sum + (o.sellerRating || 0), 0) / sellerOrders.length
                : rating;

            await tx.sellerProfile.update({
                where: { id: sellerId },
                data: { rating: avgRating }
            });

            return avgRating;
        }, { isolationLevel: "Serializable" });

        if (!moderation.isClean) {
            await logAudit({
                action: "REVIEW_COMMENT_FLAGGED",
                entityType: "Order",
                entityId: orderId,
                userId,
                details: {
                    target: "SELLER",
                    matchedPatterns: moderation.matchedPatterns,
                    commentLength: trimmedComment.length,
                },
            }).catch(() => {});

            // feat/email-ops-comment-pending (2026-05-13): notificacion a OPS.
            (async () => {
                try {
                    const ctx = await prisma.order.findUnique({
                        where: { id: orderId },
                        select: {
                            orderNumber: true,
                            user: { select: { name: true, email: true } },
                            subOrders: {
                                where: { sellerId: { not: null } },
                                select: { seller: { select: { displayName: true } } },
                                take: 1,
                            },
                        },
                    });
                    await sendAdminReviewPendingEmail({
                        orderId,
                        orderNumber: ctx?.orderNumber || orderId,
                        target: "SELLER",
                        entityName: ctx?.subOrders?.[0]?.seller?.displayName || null,
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
                    console.error("[rate-seller] failed to notify OPS:", err);
                }
            })();
        }

        return NextResponse.json({
            success: true,
            message: "¡Gracias por tu calificación!",
            newSellerRating: result.toFixed(1),
            moderationStatus,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "ALREADY_RATED") {
            return NextResponse.json({ error: "Ya calificaste al vendedor" }, { status: 400 });
        }
        console.error("Error rating seller:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
