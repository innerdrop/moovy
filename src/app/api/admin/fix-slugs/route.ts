// One-time endpoint to normalize all product slugs (strip accents)
// Usage: GET /api/admin/fix-slugs (requires ADMIN role)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slugify";

export async function GET() {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Get all products
        const products = await prisma.product.findMany({
            select: { id: true, slug: true },
        });

        const updates: { id: string; oldSlug: string; newSlug: string }[] = [];

        for (const p of products) {
            const normalized = normalizeSlug(p.slug);
            if (normalized !== p.slug) {
                // Check for collisions
                const existing = await prisma.product.findFirst({
                    where: { slug: normalized, id: { not: p.id } },
                });
                const finalSlug = existing
                    ? `${normalized}-${p.id.slice(0, 6)}`
                    : normalized;

                await prisma.product.update({
                    where: { id: p.id },
                    data: { slug: finalSlug },
                });

                updates.push({
                    id: p.id,
                    oldSlug: p.slug,
                    newSlug: finalSlug,
                });
            }
        }

        // Also fix merchant slugs
        const merchants = await prisma.merchant.findMany({
            select: { id: true, slug: true },
        });

        const merchantUpdates: { id: string; oldSlug: string; newSlug: string }[] = [];

        for (const m of merchants) {
            const normalized = normalizeSlug(m.slug);
            if (normalized !== m.slug) {
                const existing = await prisma.merchant.findFirst({
                    where: { slug: normalized, id: { not: m.id } },
                });
                const finalSlug = existing
                    ? `${normalized}-${m.id.slice(0, 6)}`
                    : normalized;

                await prisma.merchant.update({
                    where: { id: m.id },
                    data: { slug: finalSlug },
                });

                merchantUpdates.push({
                    id: m.id,
                    oldSlug: m.slug,
                    newSlug: finalSlug,
                });
            }
        }

        return NextResponse.json({
            success: true,
            products: {
                total: products.length,
                fixed: updates.length,
                details: updates,
            },
            merchants: {
                total: merchants.length,
                fixed: merchantUpdates.length,
                details: merchantUpdates,
            },
        });
    } catch (error) {
        console.error("Error fixing slugs:", error);
        return NextResponse.json(
            { error: "Error al normalizar slugs" },
            { status: 500 }
        );
    }
}
