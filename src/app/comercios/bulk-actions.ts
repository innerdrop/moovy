"use server";

// Acciones en lote sobre los productos del comercio.
// Rama: feat/recargo-moovy-y-tamano-toggle
//
// Todas verifican propiedad contra la DB (requireMerchantApi) y scopean SIEMPRE por
// merchantId (sin IDOR): un comercio solo puede tocar SUS productos. Zod valida el
// array de ids y lo capea. Espejo de las acciones de a uno (deleteProduct /
// toggleProductActive) pero en masa.

import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_IDS = 5000;
const idsSchema = z.array(z.string().min(1)).min(1).max(MAX_IDS);

type BulkResult = { error: string } | { ok: true; [k: string]: unknown };

async function authMerchant() {
    const authResult = await requireMerchantApi({ allowAdmin: true });
    if (authResult instanceof NextResponse) return null;
    const merchant = await prisma.merchant.findFirst({
        where: { ownerId: authResult.userId },
        select: { id: true },
    });
    return merchant;
}

/** Solo los ids que REALMENTE son de este comercio (defensa IDOR). */
async function ownedIds(ids: string[], merchantId: string): Promise<string[]> {
    const rows = await prisma.product.findMany({
        where: { id: { in: ids }, merchantId },
        select: { id: true },
    });
    return rows.map((r) => r.id);
}

/**
 * Ocultar (isActive:false) o Mostrar (isActive:true) en lote. Al mostrar, solo se
 * publican los COMPLETOS (foto + descripción ≥10 + precio); los incompletos se saltan
 * y se informan (espejo autoritativo de toggleProductActive).
 */
export async function bulkSetProductsActive(rawIds: string[], isActive: boolean): Promise<BulkResult> {
    const parsed = idsSchema.safeParse(rawIds);
    if (!parsed.success) return { error: "Selección inválida" };
    const merchant = await authMerchant();
    if (!merchant) return { error: "No autorizado" };

    const owned = await ownedIds(parsed.data, merchant.id);
    if (owned.length === 0) return { error: "No hay productos válidos en la selección" };

    if (!isActive) {
        const res = await prisma.product.updateMany({
            where: { id: { in: owned }, merchantId: merchant.id },
            data: { isActive: false },
        });
        revalidatePath("/comercios/productos");
        return { ok: true, updated: res.count, skipped: 0 };
    }

    // Mostrar: filtrar los completos.
    const products = await prisma.product.findMany({
        where: { id: { in: owned }, merchantId: merchant.id },
        select: { id: true, description: true, price: true, _count: { select: { images: true } } },
    });
    const completeIds = products
        .filter((p) => (p._count?.images ?? 0) > 0 && (p.description?.trim().length ?? 0) >= 10 && p.price > 0)
        .map((p) => p.id);
    const skipped = owned.length - completeIds.length;
    if (completeIds.length === 0) {
        return { ok: true, updated: 0, skipped };
    }
    const res = await prisma.product.updateMany({
        where: { id: { in: completeIds }, merchantId: merchant.id },
        data: { isActive: true },
    });
    revalidatePath("/comercios/productos");
    return { ok: true, updated: res.count, skipped };
}

/**
 * Eliminar en lote. Preserva el historial de ventas: los productos SIN OrderItems se
 * borran definitivamente (cascade limpia imágenes/categorías/carritos/favoritos); los
 * que tienen ventas se OCULTAN (isActive:false) en vez de borrarse, para no dejar
 * pedidos históricos sin referencia. Espejo del fallback de deleteProduct.
 */
export async function bulkDeleteProducts(rawIds: string[]): Promise<BulkResult> {
    const parsed = idsSchema.safeParse(rawIds);
    if (!parsed.success) return { error: "Selección inválida" };
    const merchant = await authMerchant();
    if (!merchant) return { error: "No autorizado" };

    const owned = await ownedIds(parsed.data, merchant.id);
    if (owned.length === 0) return { error: "No hay productos válidos en la selección" };

    // ¿Cuáles tienen historial de ventas? Esos se ocultan, no se borran.
    const withHistory = await prisma.orderItem.findMany({
        where: { productId: { in: owned } },
        select: { productId: true },
        distinct: ["productId"],
    });
    const blocked = new Set(withHistory.map((o) => o.productId).filter((x): x is string => !!x));
    const deletable = owned.filter((id) => !blocked.has(id));
    const toHide = owned.filter((id) => blocked.has(id));

    let deleted = 0;
    let hidden = 0;
    if (deletable.length > 0) {
        const res = await prisma.product.deleteMany({
            where: { id: { in: deletable }, merchantId: merchant.id },
        });
        deleted = res.count;
    }
    if (toHide.length > 0) {
        const res = await prisma.product.updateMany({
            where: { id: { in: toHide }, merchantId: merchant.id },
            data: { isActive: false },
        });
        hidden = res.count;
    }
    revalidatePath("/comercios/productos");
    return { ok: true, deleted, hidden };
}

/**
 * Asignar (o limpiar, con categoryId null) una categoría a varios productos de una.
 * Reemplaza las categorías existentes de esos productos por la nueva.
 */
export async function bulkSetProductsCategory(rawIds: string[], categoryId: string | null): Promise<BulkResult> {
    const parsed = idsSchema.safeParse(rawIds);
    if (!parsed.success) return { error: "Selección inválida" };
    const merchant = await authMerchant();
    if (!merchant) return { error: "No autorizado" };

    if (categoryId) {
        const cat = await prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } });
        if (!cat) return { error: "Categoría inválida" };
    }

    const owned = await ownedIds(parsed.data, merchant.id);
    if (owned.length === 0) return { error: "No hay productos válidos en la selección" };

    await prisma.$transaction([
        prisma.productCategory.deleteMany({ where: { productId: { in: owned } } }),
        ...(categoryId
            ? [prisma.productCategory.createMany({
                data: owned.map((productId) => ({ productId, categoryId })),
                skipDuplicates: true,
            })]
            : []),
    ]);
    revalidatePath("/comercios/productos");
    return { ok: true, updated: owned.length, cleared: !categoryId };
}

/**
 * Ajustar el precio en lote un ±%. price = round(price × (1 + pct/100)), nunca < 0.
 * Al ser un cambio manual del precio final, se limpia la metadata de recargo
 * (`basePrice`/`markupPercent`) para no dejar el desglose inconsistente. costPrice se
 * mantiene en 70% del nuevo precio. La comisión sigue cayendo sobre el precio final.
 */
export async function bulkAdjustProductsPrice(rawIds: string[], percent: number): Promise<BulkResult> {
    const parsed = idsSchema.safeParse(rawIds);
    if (!parsed.success) return { error: "Selección inválida" };
    const pct = Number(percent);
    if (!Number.isFinite(pct) || pct < -90 || pct > 1000) return { error: "Porcentaje fuera de rango (-90 a 1000)" };
    if (pct === 0) return { error: "El ajuste es 0% — no hay cambios" };
    const merchant = await authMerchant();
    if (!merchant) return { error: "No autorizado" };

    const owned = await ownedIds(parsed.data, merchant.id);
    if (owned.length === 0) return { error: "No hay productos válidos en la selección" };

    // Update aritmético en una sola sentencia, scopeado por merchant. Las dos
    // expresiones usan el price VIEJO (semántica de UPDATE SQL).
    const count = await prisma.$executeRaw`
        UPDATE "Product"
        SET "price" = GREATEST(0, ROUND(("price" * (1 + ${pct}::float / 100))::numeric))::float8,
            "costPrice" = (GREATEST(0, ROUND(("price" * (1 + ${pct}::float / 100))::numeric)) * 0.7)::float8,
            "basePrice" = NULL,
            "markupPercent" = NULL,
            "updatedAt" = NOW()
        WHERE "id" IN (${Prisma.join(owned)}) AND "merchantId" = ${merchant.id}
    `;
    revalidatePath("/comercios/productos");
    return { ok: true, updated: count };
}
