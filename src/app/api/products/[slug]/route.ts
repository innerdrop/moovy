// API Route: Get Single Product by Slug
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slugify";

const includeOpts = {
    images: { orderBy: { order: "asc" as const } },
    categories: { include: { category: true } },
    variants: { where: { isActive: true } },
};

async function findProduct(slug: string) {
    return prisma.product.findFirst({
        where: { slug, merchantId: { not: null } },
        include: includeOpts,
    });
}

export async function GET(
    request: Request,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug: rawSlug } = await context.params;
        const decoded = decodeURIComponent(rawSlug);

        // 1. Try exact match
        let product = await findProduct(decoded);

        // 2. Fallback: normalized (accent-stripped) slug
        if (!product) {
            const normalized = normalizeSlug(decoded);
            product = await findProduct(normalized);
        }

        // 3. Fallback: reconstruct slug from URL if query string was
        //    actually part of the slug (e.g. "á" → "??" split by browser)
        if (!product) {
            const url = new URL(request.url);
            const qs = url.search; // e.g. "?sica" or "??sica"
            if (qs && !qs.includes("=")) {
                // Query string has no key=value pairs, likely a broken slug
                const reconstructed = decoded + qs;
                product = await findProduct(reconstructed);

                // Also try normalized version of reconstructed slug
                if (!product) {
                    product = await findProduct(normalizeSlug(reconstructed));
                }
            }
        }

        // 4. Last resort: startsWith match for truncated slugs
        if (!product) {
            product = await prisma.product.findFirst({
                where: {
                    slug: { startsWith: decoded },
                    merchantId: { not: null },
                },
                include: includeOpts,
            });
        }

        if (!product) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Error al obtener el producto" },
            { status: 500 }
        );
    }
}
