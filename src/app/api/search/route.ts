// API: Unified Search — products (from merchants) + listings (from sellers)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
    // Rate limit: max 30 searches per minute per IP
    const limited = await applyRateLimit(request, "search", 30, 60_000);
    if (limited) return limited;

    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim();
        const tab = searchParams.get("tab") || "comercios"; // "comercios" | "marketplace"
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const offset = parseInt(searchParams.get("offset") || "0");

        if (!q || q.length < 2) {
            return NextResponse.json({ results: [], total: 0 });
        }

        if (tab === "marketplace") {
            // Search marketplace listings
            const where: any = {
                isActive: true,
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                ],
            };

            const [listings, total] = await Promise.all([
                prisma.listing.findMany({
                    where,
                    include: {
                        seller: {
                            select: {
                                id: true,
                                displayName: true,
                                rating: true,
                                avatar: true,
                            },
                        },
                        images: { orderBy: { order: "asc" }, take: 1 },
                        category: { select: { id: true, name: true, slug: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: limit,
                    skip: offset,
                }),
                prisma.listing.count({ where }),
            ]);

            return NextResponse.json({ results: listings, total });
        }

        // Default: search store products + merchants
        const productWhere: any = {
            isActive: true,
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ],
        };

        const merchantWhere: any = {
            isActive: true,
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
            ],
        };

        const [products, productTotal, merchants, merchantTotal] = await Promise.all([
            prisma.product.findMany({
                where: productWhere,
                include: {
                    images: { take: 1 },
                    merchant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isOpen: true,
                            image: true,
                            rating: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
                take: limit,
                skip: offset,
            }),
            prisma.product.count({ where: productWhere }),
            prisma.merchant.findMany({
                where: merchantWhere,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    image: true,
                    isOpen: true,
                    isVerified: true,
                    isPremium: true,
                    premiumTier: true,
                    rating: true,
                    deliveryTimeMin: true,
                    deliveryTimeMax: true,
                    deliveryFee: true,
                    address: true,
                },
                orderBy: [{ isOpen: "desc" }, { isPremium: "desc" }, { name: "asc" }],
                take: 6,
            }),
            prisma.merchant.count({ where: merchantWhere }),
        ]);

        return NextResponse.json({
            results: products,
            total: productTotal,
            merchants,
            merchantTotal,
        });
    } catch (error) {
        console.error("Error in unified search:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
