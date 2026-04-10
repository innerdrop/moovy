import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/env-validation";

/**
 * POST /api/cron/close-auctions
 * Cierra subastas expiradas. Debe ejecutarse cada 1 minuto.
 *
 * - Busca listings con listingType=AUCTION, auctionStatus=ACTIVE, auctionEndsAt <= now
 * - Si tiene bids: marca como ENDED, asigna ganador, establece deadline de pago (24h)
 * - Si no tiene bids: marca como NO_BIDS
 *
 * Protegido con CRON_SECRET.
 */
export async function POST(req: NextRequest) {
    // Auth: CRON_SECRET
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const now = new Date();

        // Buscar subastas activas que ya expiraron
        const expiredAuctions = await prisma.listing.findMany({
            where: {
                listingType: "AUCTION",
                auctionStatus: "ACTIVE",
                auctionEndsAt: { lte: now },
            },
            select: {
                id: true,
                title: true,
                currentBid: true,
                currentBidderId: true,
                totalBids: true,
                sellerId: true,
            },
        });

        if (expiredAuctions.length === 0) {
            return NextResponse.json({ closed: 0, message: "No hay subastas expiradas" });
        }

        const results = {
            withBids: 0,
            noBids: 0,
            errors: 0,
        };

        for (const auction of expiredAuctions) {
            try {
                if (auction.totalBids > 0 && auction.currentBidderId && auction.currentBid) {
                    // Subasta con ofertas — marcar como ENDED, asignar ganador
                    const paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                    await prisma.listing.update({
                        where: { id: auction.id },
                        data: {
                            auctionStatus: "ENDED",
                            auctionWinnerId: auction.currentBidderId,
                            winnerPaymentDeadline: paymentDeadline,
                        },
                    });

                    // TODO: Notificar al ganador (push + email)
                    // TODO: Notificar al vendedor que la subasta terminó con venta
                    // TODO: Notificar a los perdedores

                    results.withBids++;
                } else {
                    // Subasta sin ofertas
                    await prisma.listing.update({
                        where: { id: auction.id },
                        data: {
                            auctionStatus: "NO_BIDS",
                        },
                    });

                    // TODO: Notificar al vendedor que no hubo ofertas

                    results.noBids++;
                }
            } catch (err) {
                console.error(`[close-auctions] Error cerrando subasta ${auction.id}:`, err);
                results.errors++;
            }
        }

        console.log(
            `[close-auctions] Cerradas: ${results.withBids} con ofertas, ${results.noBids} sin ofertas, ${results.errors} errores`
        );

        return NextResponse.json({
            closed: results.withBids + results.noBids,
            withBids: results.withBids,
            noBids: results.noBids,
            errors: results.errors,
        });
    } catch (error) {
        console.error("[close-auctions] Error general:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
