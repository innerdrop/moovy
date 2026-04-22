import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSoldCountsExcludingAutoPurchases } from "@/lib/listing-counts";

// GET - Public listing of active listings with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const sellerId = searchParams.get("sellerId");
        const condition = searchParams.get("condition");
        const search = searchParams.get("search");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const sortBy = searchParams.get("sortBy"); // price_asc, price_desc, newest
        const listingType = searchParams.get("listingType"); // DIRECT | AUCTION
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: any = { isActive: true };

        // ISSUE-002: Subastas ocultas para lanzamiento — solo mostrar DIRECT
        // Reactivar en Fase 2 removiendo el filtro forzado y descomentando el bloque original
        where.listingType = "DIRECT";
        /*
        // Filtro por tipo de listing (original — reactivar en Fase 2)
        if (listingType === "AUCTION") {
            where.listingType = "AUCTION";
            where.auctionStatus = "ACTIVE";
        } else if (listingType === "DIRECT") {
            where.listingType = "DIRECT";
        }
        // Si no se especifica, devuelve ambos tipos
        */

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (sellerId) {
            where.sellerId = sellerId;
        }

        if (condition) {
            where.condition = condition;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        let orderBy: any = { createdAt: "desc" };
        if (sortBy === "price_asc") orderBy = { price: "asc" };
        else if (sortBy === "price_desc") orderBy = { price: "desc" };

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
                            isVerified: true,
                            user: {
                                select: {
                                    sellerAvailability: {
                                        select: {
                                            isOnline: true,
                                            isPaused: true,
                                            pauseEndsAt: true,
                                            preparationMinutes: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    images: { orderBy: { order: "asc" } },
                    category: { select: { id: true, name: true, slug: true } },
                    // ISSUE-029: `orderItems` NO va acá — se cuenta aparte excluyendo auto-compras.
                    _count: { select: { favorites: true } },
                },
                orderBy,
                take: limit,
                skip: offset,
            }),
            prisma.listing.count({ where }),
        ]);

        // ISSUE-029: soldCount real = OrderItems cuyo Order.userId != SellerProfile.userId.
        // Se calcula con un solo $queryRaw batch (join OrderItem→Order→Listing→SellerProfile).
        const soldCountMap = await getSoldCountsExcludingAutoPurchases(
            listings.map((l: any) => l.id)
        );

        // Flatten seller.user.sellerAvailability into seller.availability + _count into soldCount/favCount
        const flatListings = listings.map((listing: any) => {
            const { user, ...sellerRest } = listing.seller;
            const { _count, ...listingRest } = listing;
            return {
                ...listingRest,
                seller: {
                    ...sellerRest,
                    availability: user?.sellerAvailability || null,
                },
                soldCount: soldCountMap.get(listing.id) || 0,
                favCount: _count?.favorites || 0,
            };
        });

        return NextResponse.json({ listings: flatListings, total });
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
