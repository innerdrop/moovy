// API Route: Trigger auto-assignment for an order
// POST /api/logistics/assign { orderId }
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { assignOrderToNearestDriver } from "@/lib/logistics";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["ADMIN", "MERCHANT"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
        }

        const result = await assignOrderToNearestDriver(orderId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Repartidor asignado",
                driverId: result.driverId,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in logistics/assign:", error);
        return NextResponse.json(
            { error: "Error al asignar repartidor" },
            { status: 500 }
        );
    }
}
