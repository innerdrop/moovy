/**
 * Segmentador de usuarios para CRM / broadcast.
 *
 * Traduce un JSON de filtros a una query Prisma. Los filtros se guardan en
 * UserSegment.filters como string; este helper los parsea y devuelve tanto el
 * `where` de Prisma como utilidades para preview y ejecución en broadcast.
 *
 * Filtros soportados en v1 (todos opcionales, AND entre sí):
 *   role             — USER | COMERCIO | DRIVER | SELLER | ADMIN
 *   isSuspended      — boolean (si false, excluye suspendidos y eliminados)
 *   hasMarketingConsent — boolean (true = solo opt-in, false = solo opt-out)
 *   minPoints        — Int (pointsBalance >=)
 *   maxPoints        — Int (pointsBalance <=)
 *   createdAfter     — ISO date (User.createdAt >= date)
 *   createdBefore    — ISO date (User.createdAt <= date)
 *   hasOrdered       — boolean (true = tiene al menos 1 orden DELIVERED)
 *   noOrdersInDays   — Int (hace N días que no hace un pedido; requiere hasOrdered implícito)
 *   city             — string parcial (matchea en Address.city de su primera dirección activa)
 *
 * Nota importante para Ley 26.951 (No Llame): cualquier broadcast de marketing
 * DEBE filtrar `hasMarketingConsent: true`. El UI del form lo fuerza.
 */

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const SegmentFiltersSchema = z.object({
    role: z.enum(["USER", "COMERCIO", "DRIVER", "SELLER", "ADMIN"]).optional(),
    isSuspended: z.boolean().optional(),
    hasMarketingConsent: z.boolean().optional(),
    minPoints: z.number().int().nonnegative().optional(),
    maxPoints: z.number().int().nonnegative().optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    hasOrdered: z.boolean().optional(),
    noOrdersInDays: z.number().int().positive().max(3650).optional(),
    city: z.string().trim().min(1).max(80).optional(),
}).strict();

export type SegmentFilters = z.infer<typeof SegmentFiltersSchema>;

/**
 * Construye el `where` de Prisma para un User.findMany a partir de los filtros.
 * No ejecuta la query — solo arma el objeto. `noOrdersInDays` y `hasOrdered` se
 * resuelven con sub-queries `some`/`none`.
 */
export function buildSegmentWhere(filters: SegmentFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
        deletedAt: null, // siempre excluir eliminados
    };

    if (filters.role) {
        if (filters.role === "ADMIN") {
            where.role = "ADMIN";
        } else if (filters.role === "USER") {
            // "USER" significa "buyer puro": tiene rol base pero no merchant/driver/seller activos
            where.role = "USER";
            where.ownedMerchants = { none: {} };
            where.driver = null;
            where.sellerProfile = null;
        } else if (filters.role === "COMERCIO") {
            where.ownedMerchants = { some: {} };
        } else if (filters.role === "DRIVER") {
            where.driver = { isNot: null };
        } else if (filters.role === "SELLER") {
            where.sellerProfile = { isNot: null };
        }
    }

    if (filters.isSuspended !== undefined) {
        where.isSuspended = filters.isSuspended;
    }

    if (filters.hasMarketingConsent !== undefined) {
        where.marketingConsent = filters.hasMarketingConsent;
    }

    if (filters.minPoints !== undefined || filters.maxPoints !== undefined) {
        where.pointsBalance = {};
        if (filters.minPoints !== undefined) where.pointsBalance.gte = filters.minPoints;
        if (filters.maxPoints !== undefined) where.pointsBalance.lte = filters.maxPoints;
    }

    if (filters.createdAfter || filters.createdBefore) {
        where.createdAt = {};
        if (filters.createdAfter) where.createdAt.gte = new Date(filters.createdAfter);
        if (filters.createdBefore) where.createdAt.lte = new Date(filters.createdBefore);
    }

    if (filters.hasOrdered === true) {
        where.orders = { some: { status: "DELIVERED" } };
    } else if (filters.hasOrdered === false) {
        where.orders = { none: { status: "DELIVERED" } };
    }

    if (filters.noOrdersInDays !== undefined) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filters.noOrdersInDays);
        // "No ha hecho pedido en los últimos N días" =
        // ningún Order con createdAt > cutoff
        where.orders = {
            ...(where.orders as object),
            none: { createdAt: { gt: cutoff } },
        };
    }

    if (filters.city) {
        where.addresses = {
            some: {
                city: { contains: filters.city, mode: "insensitive" },
            },
        };
    }

    return where;
}

/**
 * Cuenta usuarios que matchean el segmento.
 */
export async function countSegment(filters: SegmentFilters): Promise<number> {
    const where = buildSegmentWhere(filters);
    return prisma.user.count({ where });
}

/**
 * Devuelve una muestra pequeña para preview en el UI (sin paginación).
 * Campos mínimos para no filtrar PII más de lo necesario.
 */
export async function previewSegment(
    filters: SegmentFilters,
    sampleSize = 10,
): Promise<{ count: number; sample: Array<{ id: string; name: string | null; email: string; createdAt: Date }> }> {
    const where = buildSegmentWhere(filters);
    const [count, sample] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            select: { id: true, name: true, email: true, createdAt: true },
            take: sampleSize,
            orderBy: { createdAt: "desc" },
        }),
    ]);
    return { count, sample };
}

/**
 * Itera todos los userIds del segmento en páginas de `pageSize`. Para el cron
 * de broadcast que procesa en batches. Usa cursor-based pagination para ser
 * estable ante creaciones concurrentes.
 */
export async function* iterateSegmentUserIds(
    filters: SegmentFilters,
    pageSize = 100,
): AsyncGenerator<string[], void, void> {
    const where = buildSegmentWhere(filters);
    let cursor: string | undefined;
    while (true) {
        const rows = await prisma.user.findMany({
            where,
            select: { id: true },
            take: pageSize,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            orderBy: { id: "asc" },
        });
        if (rows.length === 0) return;
        yield rows.map((r) => r.id);
        if (rows.length < pageSize) return;
        cursor = rows[rows.length - 1].id;
    }
}

/**
 * Parsea el JSON string de UserSegment.filters de forma defensiva.
 * Retorna null si el JSON es inválido (lo cual degrada a segmento vacío en vez
 * de crashear el broadcast).
 */
export function parseSegmentFilters(raw: string | null | undefined): SegmentFilters | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        const validated = SegmentFiltersSchema.safeParse(parsed);
        if (!validated.success) return null;
        return validated.data;
    } catch {
        return null;
    }
}
