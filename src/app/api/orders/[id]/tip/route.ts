// API: Declarar propina al driver (modelo informativo).
//
// feat/propinas-y-ratings-post-entrega (2026-05-08): el buyer indica que va
// a dejar propina al driver y por que medio. ESTO NO ES UN PAGO REAL — Moovy
// no procesa la transaccion. La propina se hace 100% directa entre buyer y
// driver:
//   - CASH: el buyer le da al driver en mano (suele pasar al recibir el pedido,
//     pero puede ser declarado post-entrega como gesto retroactivo).
//   - TRANSFER: el buyer transfiere al alias bancario del driver. Le mostramos
//     el alias copiable en la UI.
//   - NONE: el buyer indico que esta vez no deja propina. Util para no
//     re-mostrar el prompt en la misma orden.
//
// Por que registramos esto si Moovy no toca la plata:
// 1. Reporting al driver: "este mes te declararon $X de propinas". Util para
//    el driver y para Moovy entender la salud del modelo (si nadie deja
//    propina, hay que repensar el flow).
// 2. Analytics agregadas: % de pedidos con propina, ticket promedio, etc.
// 3. UX para el buyer: si vuelve a la pantalla de calificacion, no le
//    re-aparece el prompt si ya declaro algo.
//
// Reglas:
// - Auth obligatoria, el buyer del pedido.
// - El order debe estar DELIVERED o COMPLETED.
// - Se puede setear/sobreescribir hasta una vez por order. Si ya hay un
//   driverTipMethod registrado, devolvemos 409 (anti-spam, anti-fat-finger).
// - amount es opcional. Para CASH puede ser null (lo arregla en mano sin
//   monto predeclarado). Para TRANSFER preferimos que venga, pero no es
//   obligatorio.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const tipSchema = z.object({
    method: z.enum(["CASH", "TRANSFER", "NONE"]),
    // amount: positivo, max 1M (anti-fat-finger). Se permite 0 / null.
    amount: z.number().min(0).max(1_000_000).optional().nullable(),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id: orderId } = await params;
        const userId = (session.user as any).id;
        const body = await request.json().catch(() => ({}));
        const parsed = tipSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Body inválido" },
                { status: 400 }
            );
        }

        const { method, amount } = parsed.data;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                status: true,
                driverId: true,
                driverTipMethod: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (order.status !== "DELIVERED" && order.status !== "COMPLETED") {
            return NextResponse.json(
                { error: "Solo podés declarar propina en pedidos entregados" },
                { status: 400 }
            );
        }

        if (!order.driverId) {
            return NextResponse.json(
                { error: "Este pedido no tiene repartidor asignado" },
                { status: 400 }
            );
        }

        if (order.driverTipMethod) {
            return NextResponse.json(
                { error: "Ya declaraste cómo dejaste la propina en este pedido" },
                { status: 409 }
            );
        }

        await prisma.order.update({
            where: { id: orderId },
            data: {
                driverTipMethod: method,
                driverTipAmount: method === "NONE" ? null : (amount ?? null),
                driverTipDeclaredAt: new Date(),
            },
        });

        await logAudit({
            action: "DRIVER_TIP_DECLARED",
            entityType: "Order",
            entityId: orderId,
            userId,
            details: {
                method,
                amount: method === "NONE" ? null : (amount ?? null),
            },
        }).catch(() => {});

        return NextResponse.json({
            success: true,
            method,
            amount: method === "NONE" ? null : (amount ?? null),
            message:
                method === "TRANSFER"
                    ? "¡Gracias! El repartidor recibirá tu transferencia."
                    : method === "CASH"
                    ? "¡Gracias! Coordiná la propina en mano con el repartidor."
                    : "Sin problema. Tu calificación nos ayuda igual.",
        });
    } catch (error: any) {
        console.error("[orders/tip] Error:", error);
        return NextResponse.json({ error: "Error al registrar la propina" }, { status: 500 });
    }
}
