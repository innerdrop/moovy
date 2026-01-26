// API Route: Driver rejects pending order
// POST /api/driver/orders/[id]/reject
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { driverRejectOrder } from "@/lib/logistics";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "DRIVER") {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get driver ID for current user
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

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
