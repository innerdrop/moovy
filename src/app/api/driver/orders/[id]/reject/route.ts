// API Route: Driver rejects pending order
// POST /api/driver/orders/[id]/reject
import { NextResponse } from "next/server";
import { driverRejectOrder } from "@/lib/logistics";
import { requireDriverApi } from "@/lib/driver-auth";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        const { id } = await context.params;

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        const result = await driverRejectOrder(driver.id, id);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Pedido rechazado, buscando otro repartidor",
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Error rejecting order:", error);
        return NextResponse.json(
            { error: "Error al rechazar pedido" },
            { status: 500 }
        );
    }
}
