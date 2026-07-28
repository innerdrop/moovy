// GET /api/merchant/orders/pendientes — cuántos pedidos esperan una decisión.
//
// fix/comercio-pausa-stock-y-ajustes (2026-07-27): alimenta el contador rojo del
// ícono Pedidos en la barra del panel. Endpoint propio y MINÚSCULO a propósito:
// /api/merchant/orders devuelve los pedidos completos con items, cliente y
// subórdenes — pedirlos cada 30 segundos solo para contar sería tirar ancho de
// banda del comerciante (que muchas veces está con datos móviles en el local).
//
// Qué cuenta: PENDING (efectivo, espera aceptación), CONFIRMED (pagado por MP,
// espera que el comercio empiece a preparar) y SCHEDULED (reserva sin confirmar).
// Son exactamente los estados en los que la pelota está del lado del comercio.
import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

const ESPERAN_DECISION = ["PENDING", "CONFIRMED", "SCHEDULED"];

export async function GET() {
    try {
        const authResult = await requireMerchantApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { merchant } = authResult;

        if (!merchant) return NextResponse.json({ count: 0 });

        const count = await prisma.order.count({
            where: {
                merchantId: merchant.id,
                status: { in: ESPERAN_DECISION },
            },
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error contando pedidos pendientes:", error);
        // Nunca romper la barra de navegación por esto.
        return NextResponse.json({ count: 0 });
    }
}
