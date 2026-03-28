import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { socketEmit } from "@/lib/socket-emit";

const bidSchema = z.object({
    amount: z.number().positive("El monto debe ser positivo"),
});

/**
 * POST /api/listings/[id]/bid
 * Crear una nueva oferta en una subasta activa.
 *
 * Validaciones:
 * - Auth requerido
 * - Listing debe ser tipo AUCTION con auctionStatus ACTIVE
 * - auctionEndsAt > now (subasta no expirada)
 * - Vendedor no puede ofertar en su propia subasta
 * - No puede ofertar si ya es el máximo postor
 * - amount >= currentBid + bidIncrement (o >= startingPrice si es primera oferta)
 * - Anti-sniping: si la oferta llega en los últimos 60s, extiende 2 min
 *
 * Transacción serializable para evitar race conditions.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Debés iniciar sesión para ofertar" }, { status: 401 });
        }

        const { id: listingId } = await params;
        const body = await req.json();
        const parsed = bidSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || "Datos inválidos" },
                { status: 400 }
            );
        }

        const { amount } = parsed.data;
        const userId = session.user.id as string;

        // Transacción serializable para evitar race conditions de bids simultáneos
        const result = await prisma.$transaction(async (tx) => {
            const listing = await tx.listing.findUnique({
                where: { id: listingId },
                include: {
                    seller: { select: { userId: true } },
                },
            });

            if (!listing) {
                throw new Error("LISTING_NOT_FOUND");
            }

            if (listing.listingType !== "AUCTION") {
                throw new Error("NOT_AUCTION");
            }

            if (listing.auctionStatus !== "ACTIVE") {
                throw new Error("AUCTION_NOT_ACTIVE");
            }

            if (!listing.auctionEndsAt || listing.auctionEndsAt <= new Date()) {
                throw new Error("AUCTION_EXPIRED");
            }

            // El vendedor no puede ofertar en su propia subasta
            if (listing.seller.userId === userId) {
                throw new Error("CANNOT_BID_OWN");
            }

            // No puede ofertar si ya es el máximo postor
            if (listing.currentBidderId === userId) {
                throw new Error("ALREADY_HIGHEST");
            }

            // Calcular monto mínimo requerido
            const increment = listing.bidIncrement || 100;
            const minBid = listing.currentBid
                ? listing.currentBid + increment
                : (listing.startingPrice || listing.price);

            if (amount < minBid) {
                throw new Error(`MIN_BID:${minBid}`);
            }

            // Crear el bid
            const bid = await tx.bid.create({
                data: {
                    listingId,
                    userId,
                    amount,
                },
            });

            // Anti-sniping: si la oferta llega en los últimos 60 segundos, extender 2 minutos
            const now = new Date();
            const timeLeft = listing.auctionEndsAt.getTime() - now.getTime();
            const SNIPE_THRESHOLD = 60 * 1000; // 60 segundos
            const EXTENSION = 2 * 60 * 1000; // 2 minutos

            let newEndsAt = listing.auctionEndsAt;
            if (timeLeft <= SNIPE_THRESHOLD && timeLeft > 0) {
                newEndsAt = new Date(now.getTime() + EXTENSION);
            }

            // Actualizar el listing con el nuevo bid (cache desnormalizado)
            await tx.listing.update({
                where: { id: listingId },
                data: {
                    currentBid: amount,
                    currentBidderId: userId,
                    totalBids: { increment: 1 },
                    auctionEndsAt: newEndsAt,
                },
            });

            return {
                bid,
                previousBidderId: listing.currentBidderId,
                extended: newEndsAt.getTime() !== listing.auctionEndsAt.getTime(),
                newEndsAt,
            };
        }, {
            isolationLevel: "Serializable",
        });

        // Emit real-time bid update to auction room
        socketEmit({
            event: "auction_bid",
            room: `auction:${listingId}`,
            data: {
                listingId,
                currentBid: result.bid.amount,
                totalBids: (result.bid.amount ? 1 : 0), // client adds to existing count
                bidderId: userId,
                extended: result.extended,
                newEndsAt: result.newEndsAt.toISOString(),
            },
        }).catch(console.error);

        // Notify previous highest bidder they were outbid
        if (result.previousBidderId && result.previousBidderId !== userId) {
            socketEmit({
                event: "auction_outbid",
                room: `customer:${result.previousBidderId}`,
                data: {
                    listingId,
                    newAmount: result.bid.amount,
                    message: `Tu oferta fue superada. La nueva oferta es $${result.bid.amount.toLocaleString("es-AR")}`,
                },
            }).catch(console.error);
        }

        return NextResponse.json({
            bid: {
                id: result.bid.id,
                amount: result.bid.amount,
                createdAt: result.bid.createdAt,
            },
            currentBid: result.bid.amount,
            extended: result.extended,
            newEndsAt: result.newEndsAt,
            message: result.extended
                ? `¡Oferta registrada! La subasta se extendió 2 minutos por oferta de último momento.`
                : `¡Oferta de $${result.bid.amount.toLocaleString("es-AR")} registrada!`,
        }, { status: 201 });

    } catch (error: any) {
        const msg = error?.message || "";

        if (msg === "LISTING_NOT_FOUND") {
            return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
        }
        if (msg === "NOT_AUCTION") {
            return NextResponse.json({ error: "Esta publicación no es una subasta" }, { status: 400 });
        }
        if (msg === "AUCTION_NOT_ACTIVE") {
            return NextResponse.json({ error: "Esta subasta ya no está activa" }, { status: 400 });
        }
        if (msg === "AUCTION_EXPIRED") {
            return NextResponse.json({ error: "Esta subasta ya terminó" }, { status: 400 });
        }
        if (msg === "CANNOT_BID_OWN") {
            return NextResponse.json({ error: "No podés ofertar en tu propia subasta" }, { status: 403 });
        }
        if (msg === "ALREADY_HIGHEST") {
            return NextResponse.json({ error: "Ya tenés la oferta más alta" }, { status: 400 });
        }
        if (msg.startsWith("MIN_BID:")) {
            const min = msg.split(":")[1];
            return NextResponse.json(
                { error: `La oferta mínima es $${Number(min).toLocaleString("es-AR")}` },
                { status: 400 }
            );
        }

        console.error("[listings/bid] Error:", error);
        return NextResponse.json({ error: "Error interno al procesar la oferta" }, { status: 500 });
    }
}
