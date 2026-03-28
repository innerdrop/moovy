import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/merchant/ad-placements/[id]
 * Permite al comercio cancelar su propia solicitud de publicidad.
 * Solo si está en estado PENDING (aún no aprobada).
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { id } = await params;
        const { action } = await req.json();

        if (action !== "cancel") {
            return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
        }

        // Buscar la solicitud verificando que pertenece al merchant del usuario
        const merchant = await prisma.merchant.findFirst({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!merchant) {
            return NextResponse.json({ error: "No sos comercio" }, { status: 403 });
        }

        const placement = await prisma.adPlacement.findFirst({
            where: { id, merchantId: merchant.id },
        });

        if (!placement) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
        }

        // Solo se puede cancelar en estado PENDING
        if (placement.status !== "PENDING") {
            return NextResponse.json(
                { error: "Solo podés cancelar solicitudes pendientes. Para cancelar una publicidad aprobada o activa, contactá a soporte." },
                { status: 400 }
            );
        }

        // Cancelar
        const updated = await prisma.adPlacement.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        return NextResponse.json({
            placement: updated,
            message: "Solicitud cancelada. Podés solicitar un nuevo espacio cuando quieras.",
        });
    } catch (error) {
        console.error("[merchant/ad-placements/cancel]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
