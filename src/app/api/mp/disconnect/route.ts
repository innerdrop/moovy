// API Route: Disconnect MercadoPago account from vendor
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { type } = body as { type?: string };

        if (type !== "merchant" && type !== "seller") {
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
        }

        const clearMpData = {
            mpAccessToken: null,
            mpRefreshToken: null,
            mpUserId: null,
            mpEmail: null,
            mpLinkedAt: null,
        };

        if (type === "merchant") {
            const merchant = await prisma.merchant.findFirst({
                where: { ownerId: session.user.id },
            });

            if (!merchant) {
                return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
            }

            await prisma.merchant.update({
                where: { id: merchant.id },
                data: clearMpData,
            });
        } else {
            const seller = await prisma.sellerProfile.findUnique({
                where: { userId: session.user.id },
            });

            if (!seller) {
                return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 404 });
            }

            await prisma.sellerProfile.update({
                where: { userId: session.user.id },
                data: clearMpData,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[MP-OAuth] Disconnect error:", error);
        return NextResponse.json({ error: "Error al desvincular" }, { status: 500 });
    }
}
