// API Route: Resolve MercadoPago preferenceId → orderId
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const preferenceId = request.nextUrl.searchParams.get("preferenceId")
            || request.nextUrl.searchParams.get("preference_id");
        if (!preferenceId) {
            return NextResponse.json(
                { error: "Se requiere el parámetro preferenceId" },
                { status: 400 }
            );
        }

        const order = await prisma.order.findFirst({
            where: { mpPreferenceId: preferenceId },
            select: { id: true, userId: true },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Orden no encontrada para esta preferencia" },
                { status: 404 }
            );
        }

        // Only owner or admin can resolve
        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        if (order.userId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        return NextResponse.json({ orderId: order.id });
    } catch (error) {
        console.error("Error resolving preference:", error);
        return NextResponse.json(
            { error: "Error al resolver la preferencia de pago" },
            { status: 500 }
        );
    }
}
