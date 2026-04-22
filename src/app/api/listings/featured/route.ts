import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSoldCountsExcludingAutoPurchases } from "@/lib/listing-counts";

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
                // ISSUE-029: `orderItems` NO va acá — se cuenta aparte excluyendo auto-compras.
            },
            orderBy: [
                { seller: { isVerified: "desc" } },
                { seller: { rating: "desc" } },
                { seller: { totalSales: "desc" } },
            ],
            take: 8,
        });

        // ISSUE-029: soldCount real excluye auto-compras (buyer userId != seller userId).
        const soldCountMap = await getSoldCountsExcludingAutoPurchases(
            listings.map((l: any) => l.id)
        );

        // Flatten
        const result = listings.map((listing: any) => {
            const { user, ...sellerRest } = listing.seller;
            return {
                ...listing,
                seller: {
                    ...sellerRest,
                    availability: user?.sellerAvailability || null,
                },
                soldCount: soldCountMap.get(listing.id) || 0,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching featured listings:", error);
        return NextResponse.json([], { status: 500 });
    }
}
