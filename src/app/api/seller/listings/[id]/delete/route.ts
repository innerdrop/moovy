import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Eliminar (soft delete) una listing propia del vendedor.
//
// s4-4c-03: el vendedor podia OCULTAR (toggle isActive via DELETE) pero no
// ELIMINAR. Esto agrega la eliminacion real, como soft delete (NO hard) por:
//   - audit AFIP (no borrar registros con historial fiscal),
//   - evitar OrderItems huerfanos (Listing referenciada por OrderItem sin cascade).
//
// Usa el MISMO mecanismo que la moderacion de OPS (deletedAt/deletedBy/
// deletedReason), asi las queries publicas que ya filtran deletedAt la ocultan
// automaticamente, sin tocar mas codigo.
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const userId = (session.user as any).id;
        const { id } = await context.params;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!seller) {
            return NextResponse.json({ error: "No tenés perfil de vendedor." }, { status: 404 });
        }

        const existing = await prisma.listing.findUnique({
            where: { id },
            select: { sellerId: true, deletedAt: true, auctionStatus: true, totalBids: true },
        });
        if (!existing || existing.sellerId !== seller.id) {
            return NextResponse.json({ error: "Listing no encontrada" }, { status: 404 });
        }
        if (existing.deletedAt) {
            return NextResponse.json({ error: "Esta publicación ya fue eliminada" }, { status: 409 });
        }
        // Defensa: no eliminar una subasta ACTIVA con ofertas (hoy las subastas
        // estan deshabilitadas — ISSUE-002 — pero dejamos la guarda por si se
        // reactivan). Habria que cancelarla antes para no dejar ofertas colgadas.
        if (existing.auctionStatus === "ACTIVE" && (existing.totalBids ?? 0) > 0) {
            return NextResponse.json(
                { error: "No podés eliminar una subasta activa con ofertas. Cancelala primero." },
                { status: 409 }
            );
        }

        await prisma.listing.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy: userId,
                deletedReason: "Seller-initiated",
                isActive: false, // ademas la sacamos de circulacion
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting listing:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
