// API Route: Driver Payouts History
//
// Rama feat/driver-historial-ganancias-y-pagos (2026-05-17):
//
// Devuelve el historial de PAGOS que Moovy ya le transfirió al driver
// (batches con status=PAID donde el driver tuvo PayoutItem). Esto soluciona
// la queja "después de pagarme me desaparece el historial" — el historial
// NUNCA se borraba, simplemente la UI no lo exponía.
//
// Returns shape:
//   [
//     {
//       id: string;            // PayoutBatch.id
//       paidAt: string;        // ISO datetime
//       amount: number;        // PayoutItem.amount (lo que cobró ESTE driver)
//       itemCount: number;     // cantidad de pedidos incluidos en este pago
//       orderIds: string[];    // ids parseados de PayoutItem.ordersIncluded
//       periodStart: string;   // ISO — rango que cubre el batch
//       periodEnd: string;     // ISO
//       bankAccount: string?;  // CBU/alias denormalizado al momento del pago
//       batchNotes: string?;   // notas del batch (admin)
//     },
//     ...
//   ]
//
// Ordenado por paidAt desc. Sin paginación: asumimos que un driver tiene
// pocos batches (1-4 por mes). Si en el futuro supera 100+ batches,
// agregamos cursor pagination.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        if (!driver) {
            // Admin sin Driver propio no tiene pagos que consultar
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }

        // Buscar PayoutItems del driver donde el batch ya está PAID.
        // Filtro doble (recipientType=DRIVER AND recipientId=driver.id) +
        // batch.status=PAID. Sin exposición a IDOR: el driver solo ve sus
        // propios items.
        const items = await prisma.payoutItem.findMany({
            where: {
                recipientType: "DRIVER",
                recipientId: driver.id,
                batch: {
                    status: "PAID",
                },
            },
            include: {
                batch: {
                    select: {
                        id: true,
                        paidAt: true,
                        periodStart: true,
                        periodEnd: true,
                        notes: true,
                    },
                },
            },
            orderBy: {
                batch: { paidAt: "desc" },
            },
        });

        const payouts = items.map((item) => {
            let orderIds: string[] = [];
            try {
                const parsed = JSON.parse(item.ordersIncluded);
                if (Array.isArray(parsed)) {
                    orderIds = parsed.filter((x): x is string => typeof x === "string");
                }
            } catch {
                // Si el JSON está corrupto, devolvemos array vacío en lugar de 500.
                // El monto y el conteo igual se ven; el detalle de orderIds falla limpio.
                orderIds = [];
            }

            return {
                id: item.batch.id,
                paidAt: item.batch.paidAt?.toISOString() || null,
                amount: item.amount,
                itemCount: orderIds.length,
                orderIds,
                periodStart: item.batch.periodStart.toISOString(),
                periodEnd: item.batch.periodEnd.toISOString(),
                bankAccount: item.bankAccount,
                batchNotes: item.batch.notes,
            };
        });

        // Total acumulado histórico de pagos recibidos (para mostrar arriba
        // del listado: "Total cobrado en Moovy: $X")
        const totalReceived = payouts.reduce((sum, p) => sum + p.amount, 0);

        return NextResponse.json({
            payouts,
            totalReceived,
            count: payouts.length,
        });
    } catch (error) {
        console.error("Error fetching driver payouts:", error);
        return NextResponse.json(
            { error: "Error al obtener historial de pagos" },
            { status: 500 }
        );
    }
}
