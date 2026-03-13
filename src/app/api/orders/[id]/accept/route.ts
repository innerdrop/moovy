import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { driverAcceptOrder } from "@/lib/assignment-engine";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
            return NextResponse.json({ error: "Solo repartidores pueden aceptar pedidos" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get driver profile
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id }
        });

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        if (!driver.isActive) {
            return NextResponse.json({ error: "Tu cuenta de repartidor no está activa" }, { status: 403 });
        }

        // Delegate to assignment engine (Serializable isolation + PendingAssignment/AssignmentLog)
        const result = await driverAcceptOrder(driver.id, id);

        if (!result.success) {
            const status = result.error === "conflict" ? 409 : 400;
            return NextResponse.json(
                { error: result.error === "conflict" ? "Este pedido ya tiene un repartidor asignado" : result.error },
                { status }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Pedido aceptado",
        });
    } catch (error: any) {
        console.error("Error accepting order:", error);
        return NextResponse.json(
            { error: error.message || "Error al aceptar el pedido" },
            { status: 500 }
        );
    }
}
