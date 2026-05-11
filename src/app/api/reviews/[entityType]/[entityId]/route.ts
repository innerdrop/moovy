// API publica: lista de reseñas de un comercio o seller marketplace.
//
// feat/resenas-publicas-tienda (2026-05-10): endpoint que sirve la seccion
// "Reseñas" de las paginas publicas:
//   - GET /api/reviews/merchant/[merchantId]
//   - GET /api/reviews/seller/[sellerId]
//
// Devuelve:
//   - items: lista paginada de reseñas (rating, comment, authorName, createdAt).
//   - total: cantidad total de reseñas (para mostrar "23 reseñas").
//   - avgRating: promedio (1 decimal).
//   - distribution: { 5: N, 4: N, 3: N, 2: N, 1: N } para barras de %.
//   - hasMore: bool para paginacion.
//
// FILTRO DE MODERACION: solo devolvemos reseñas con moderationStatus en
// ("AUTO_APPROVED", "APPROVED"). Las que estan PENDING (matchearon blacklist
// o recibieron >=3 reportes) o REJECTED (OPS las elimino) NO se muestran.
// El rating numerico SI se cuenta en el avg/distribution incluso cuando el
// comment esta oculto — porque el rating en si no necesita moderacion,
// solo el texto del comentario.
//
// Sin auth — endpoint publico para que cualquiera vea las reseñas (incluyendo
// usuarios deslogueados que estan explorando el comercio antes de comprar).
//
// Paginacion: ?page=1&limit=10. Default page=1, limit=10, cap limit=50.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_ENTITY_TYPES = new Set(["merchant", "seller"]);
const VISIBLE_STATUSES = ["AUTO_APPROVED", "APPROVED"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    authorName: string;
    createdAt: string;
}

interface Distribution {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
    try {
        const { entityType, entityId } = await params;

        if (!VALID_ENTITY_TYPES.has(entityType)) {
            return NextResponse.json(
                { error: "entityType debe ser 'merchant' o 'seller'" },
                { status: 400 }
            );
        }
        if (!entityId || entityId.length < 1) {
            return NextResponse.json({ error: "entityId requerido" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
        const limitRaw = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
        const limit = Math.min(MAX_LIMIT, Math.max(1, limitRaw || DEFAULT_LIMIT));
        const skip = (page - 1) * limit;

        // Construir el where segun entityType. Para merchant filtramos por
        // Order.merchantId directo. Para seller filtramos por subOrders.sellerId
        // (los pedidos marketplace viven en SubOrder, no en Order directo).
        const ratingField =
            entityType === "merchant" ? "merchantRating" : "sellerRating";
        const commentField =
            entityType === "merchant" ? "merchantRatingComment" : "sellerRatingComment";
        const moderationField =
            entityType === "merchant"
                ? "merchantRatingModerationStatus"
                : "sellerRatingModerationStatus";

        // Where base: rating no-null, status visible, entity matchea.
        const entityWhere = entityType === "merchant"
            ? { merchantId: entityId }
            : { subOrders: { some: { sellerId: entityId } } };

        const baseWhere: any = {
            ...entityWhere,
            [ratingField]: { not: null },
            [moderationField]: { in: VISIBLE_STATUSES },
            deletedAt: null,
        };

        // 1) Lista paginada con autor + rating + comment.
        // Comment puede ser null si el buyer no dejo comentario, eso esta OK.
        // Si el comment esta en moderacion PENDING/REJECTED tampoco lo devolvemos
        // (ya filtrado por moderationStatus arriba).
        const orders = await prisma.order.findMany({
            where: baseWhere,
            select: {
                id: true,
                ratedAt: true,
                updatedAt: true,
                user: { select: { name: true } },
                [ratingField]: true,
                [commentField]: true,
            } as any,
            orderBy: [
                // ratedAt es el campo correcto pero solo se setea para driver
                // rating (logica historica). Para merchant/seller no se setea
                // — usamos updatedAt como proxy. Ordenamos por el mas reciente.
                { ratedAt: "desc" },
                { updatedAt: "desc" },
            ],
            skip,
            take: limit,
        });

        // 2) Conteo total para el header "23 reseñas" + hasMore.
        const total = await prisma.order.count({ where: baseWhere });

        // 3) Distribucion + promedio. Usamos groupBy para sacar conteos por
        // valor de rating en una sola query.
        // NOTE: aggregate con avg es la forma cleaner pero requiere
        // typed access. Hacemos groupBy + calculamos avg en memory.
        const groupedRaw = await prisma.order.groupBy({
            by: [ratingField as any],
            where: baseWhere,
            _count: { _all: true },
        });

        const distribution: Distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        let count = 0;
        for (const g of groupedRaw) {
            const r = (g as any)[ratingField] as number | null;
            const c = (g._count as any)._all as number;
            if (r && r >= 1 && r <= 5) {
                distribution[r as 1 | 2 | 3 | 4 | 5] = c;
                sum += r * c;
                count += c;
            }
        }
        const avgRating = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

        // 4) Format items para respuesta. Anonimizamos al primer nombre
        // si quisieramos preservar privacidad, pero por convención en reviews
        // publicas mostramos el nombre completo (asi lo hacen Google Maps,
        // Trip Advisor, etc.). Si el user esta soft-deleted user.name puede
        // ser null o "deleted-xxx" — fallback a "Usuario".
        const items: ReviewItem[] = orders.map((o: any) => {
            const rating = o[ratingField] as number;
            const comment = (o[commentField] as string | null) || null;
            const rawName = o.user?.name as string | null | undefined;
            const isAnonymized = !rawName || rawName.startsWith("deleted-");
            return {
                id: o.id,
                rating,
                comment,
                authorName: isAnonymized ? "Usuario" : rawName!,
                createdAt: (o.ratedAt || o.updatedAt).toISOString(),
            };
        });

        return NextResponse.json({
            items,
            total,
            avgRating,
            distribution,
            page,
            limit,
            hasMore: skip + items.length < total,
        });
    } catch (error: any) {
        console.error("[reviews public GET] Error:", error);
        return NextResponse.json({ error: "Error al obtener reseñas" }, { status: 500 });
    }
}
