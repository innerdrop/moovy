import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        const where: any = { isActive: true };

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
            where.title = {
                contains: search,
                mode: "insensitive",
            };
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
                },
                orderBy,
                take: limit,
                skip: offset,
            }),
            prisma.listing.count({ where }),
        ]);

        // Flatten seller.user.sellerAvailability into seller.availability
        const flatListings = listings.map((listing: any) => {
            const { user, ...sellerRest } = listing.seller;
            return {
                ...listing,
                seller: {
                    ...sellerRest,
                    availability: user?.sellerAvailability || null,
                },
            };
        });

        return NextResponse.json({ listings: flatListings, total });
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
