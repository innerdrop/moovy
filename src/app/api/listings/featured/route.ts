import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Featured listings: verified sellers first, then by seller rating + total sales
// This provides REAL "featured" items instead of just newest
export async function GET() {
    try {
        const listings = await prisma.listing.findMany({
            where: { isActive: true },
            include: {
                seller: {
                    select: {
                        id: true,
                        displayName: true,
                        rating: true,
                        avatar: true,
                        isVerified: true,
                        totalSales: true,
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
                images: { orderBy: { order: "asc" }, take: 1 },
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { orderItems: true } },
            },
            orderBy: [
                { seller: { isVerified: "desc" } },
                { seller: { rating: "desc" } },
                { seller: { totalSales: "desc" } },
            ],
            take: 8,
        });

        // Flatten
        const result = listings.map((listing: any) => {
            const { user, ...sellerRest } = listing.seller;
            const { _count, ...listingRest } = listing;
            return {
                ...listingRest,
                seller: {
                    ...sellerRest,
                    availability: user?.sellerAvailability || null,
                },
                soldCount: _count.orderItems,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching featured listings:", error);
        return NextResponse.json([], { status: 500 });
    }
}
