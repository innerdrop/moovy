// API: Lightweight autocomplete — products + listings combined
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "autocomplete", 60, 60_000);
    if (limited) return limited;

    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim();

        if (!q || q.length < 1) {
            return NextResponse.json({ suggestions: [] });
        }

        // Parallel: products (tienda) + listings (marketplace) + merchants
        const [products, listings, merchants] = await Promise.all([
            prisma.product.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    images: { take: 1, select: { url: true } },
                    merchant: { select: { name: true, slug: true } },
                },
                orderBy: { name: "asc" },
                take: 4,
            }),
            prisma.listing.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    price: true,
                    images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
                    seller: { select: { displayName: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 4,
            }),
            prisma.merchant.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    image: true,
                    isOpen: true,
                },
                orderBy: [{ isOpen: "desc" }, { name: "asc" }],
                take: 3,
            }),
        ]);

        const suggestions = [
            ...merchants.map((m) => ({
                type: "comercio" as const,
                id: m.id,
                label: m.name,
                image: m.image,
                href: `/tienda/${m.slug}`,
                extra: m.isOpen ? "Abierto" : "Cerrado",
            })),
            ...products.map((p) => ({
                type: "tienda" as const,
                id: p.id,
                label: p.name,
                image: p.images[0]?.url || null,
                href: `/productos/${encodeURIComponent(p.slug)}`,
                extra: p.merchant?.name || null,
                price: Number(p.price),
            })),
            ...listings.map((l) => ({
                type: "marketplace" as const,
                id: l.id,
                label: l.title,
                image: l.images[0]?.url || null,
                href: `/marketplace/${l.id}`,
                extra: l.seller?.displayName || null,
                price: Number(l.price),
            })),
        ];

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("Autocomplete error:", error);
        return NextResponse.json({ suggestions: [] });
    }
}
