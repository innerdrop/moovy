// feat/driver-cancelar-pedido (2026-06-04)
// API Route: el repartidor CANCELA un pedido que YA aceptó, ANTES de retirarlo.
// POST /api/driver/orders/[id]/cancel  { reason, comment? }
//
// Distinto de /reject (que rechaza la OFERTA, pre-aceptación). Acá el driver ya
// está asignado y se arrepiente / no puede cumplir. El motor libera el pedido,
// lo reasigna a otro driver (excluyendo a este). Solo se registra el motivo (sin penalización).
//
// Guarda de estado: SOLO si el driver es el asignado Y el pedido no fue retirado
// (deliveryStatus null o DRIVER_ASSIGNED). Si ya retiró → 409.
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDriverApi } from "@/lib/driver-auth";
import { driverCancelAcceptedOrder } from "@/lib/assignment-engine";
import { deliveryLogger } from "@/lib/logger";

const bodySchema = z.object({
    reason: z.enum([
        "ACCEPTED_BY_MISTAKE",
        "HARD_ACCESS",
        "VEHICLE_NOT_SUITABLE",
        "MECHANICAL_PERSONAL",
        "DISTANCE",
        "OTHER",
    ]),
    comment: z.string().max(300).optional(),
});

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        if (!driver) {
            return NextResponse.json(
                { error: "Perfil de repartidor no encontrado" },
                { status: 404 }
            );
        }

        const { id } = await context.params;

        // Validación Zod del body — motivo obligatorio, comentario libre opcional.
        let parsedBody: z.infer<typeof bodySchema>;
        try {
            const raw = await request.json();
            const parsed = bodySchema.safeParse(raw);
            if (!parsed.success) {
                return NextResponse.json(
                    { error: "Datos inválidos. Elegí un motivo de cancelación." },
                    { status: 400 }
                );
            }
            parsedBody = parsed.data;
        } catch {
            return NextResponse.json(
                { error: "Body inválido" },
                { status: 400 }
            );
        }

        const result = await driverCancelAcceptedOrder(
            driver.id,
            id,
            parsedBody.reason,
            parsedBody.comment
        );

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Pedido cancelado. Estamos asignándolo a otro repartidor.",
            });
        }

        return NextResponse.json(
            { success: false, error: result.error },
            { status: result.status ?? 400 }
        );
    } catch (error) {
        deliveryLogger.error({ error }, "Error in driver cancel order route");
        return NextResponse.json(
            { error: "Error al cancelar el pedido" },
            { status: 500 }
        );
    }
}
