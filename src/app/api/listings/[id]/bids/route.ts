import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/listings/[id]/bids
 * Historial de ofertas de una subasta (público).
 * Retorna las últimas 50 ofertas ordenadas por monto descendente.
 * No expone el email/datos sensibles del usuario, solo nombre e inicial.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: listingId } = await params;

        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: {
                id: true,
                listingType: true,
                auctionStatus: true,
                currentBid: true,
                totalBids: true,
                startingPrice: true,
                bidIncrement: true,
                auctionEndsAt: true,
            },
        });

        if (!listing || listing.listingType !== "AUCTION") {
            return NextResponse.json({ error: "Subasta no encontrada" }, { status: 404 });
        }

        const bids = await prisma.bid.findMany({
            where: { listingId },
            orderBy: { amount: "desc" },
            take: 50,
            select: {
                id: true,
                amount: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        // Anonimizar parcialmente: mostrar solo primer nombre + inicial
        const anonymizedBids = bids.map((bid) => {
            const fullName = bid.user.name || "Usuario";
            const parts = fullName.split(" ");
            const display = parts.length > 1
                ? `${parts[0]} ${parts[1].charAt(0)}.`
                : parts[0];

            return {
                id: bid.id,
                amount: bid.amount,
                createdAt: bid.createdAt,
                bidder: {
                    id: bid.user.id,
                    displayName: display,
                    avatar: bid.user.image,
                },
            };
        });

        return NextResponse.json({
            listingId: listing.id,
            auctionStatus: listing.auctionStatus,
            currentBid: listing.currentBid,
            totalBids: listing.totalBids,
            startingPrice: listing.startingPrice,
            bidIncrement: listing.bidIncrement,
            auctionEndsAt: listing.auctionEndsAt,
            bids: anonymizedBids,
        });
    } catch (error) {
        console.error("[listings/bids] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
