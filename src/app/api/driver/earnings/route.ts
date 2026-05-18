import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        if (!driver) {
            // Admin sin Driver propio no tiene ganancias que consultar
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        // Rama feat/driver-historial-ganancias-y-pagos (2026-05-17):
        // Antes period solo aceptaba "week" o "month" — el driver no podía
        // ver historial más allá del período actual. Ahora además acepta:
        //   - "all":       todo el histórico del driver desde su primer pedido
        //   - "YYYY-MM":   mes específico (ej: "2026-04" = abril 2026)
        // Esto soluciona la queja "después de pagarme me desaparece el
        // historial" — los pedidos no desaparecían, simplemente la UI
        // solo permitía ver semana/mes actual.
        const period = searchParams.get("period") || "week";

        // Fetch store settings for rider commission %
        const storeSettings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });
        const riderPercent = (storeSettings as any)?.riderCommissionPercent ?? 80;

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;
        // Match para periodos con formato YYYY-MM (ej: 2026-04)
        const specificMonthMatch = /^(\d{4})-(\d{2})$/.exec(period);

        if (period === "all") {
            // Histórico completo: desde epoch hasta ahora. La query igual
            // filtra por driverId, así que solo trae los pedidos del driver.
            startDate = new Date(0);
        } else if (specificMonthMatch) {
            const year = parseInt(specificMonthMatch[1], 10);
            const monthIdx = parseInt(specificMonthMatch[2], 10) - 1; // JS months: 0-11
            // Validar para no aceptar "2026-13" o "9999-01" como input random
            if (monthIdx < 0 || monthIdx > 11 || year < 2024 || year > now.getFullYear() + 1) {
                return NextResponse.json({ error: "Período inválido" }, { status: 400 });
            }
            startDate = new Date(year, monthIdx, 1, 0, 0, 0, 0);
            // Último ms del mes
            endDate = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
        } else if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            // Default: week (start of current week, Monday)
            const day = now.getDay();
            const diff = day === 0 ? 6 : day - 1; // Monday = 0
            startDate = new Date(now);
            startDate.setDate(now.getDate() - diff);
            startDate.setHours(0, 0, 0, 0);
        }

        // Get completed orders in date range
        // feat/propinas-y-ratings-post-entrega (2026-05-08): incluir tambien
        // los campos de propina declarada para sumar al reporte. Las propinas
        // NO se procesan por Moovy — son informativas (lo que el buyer dijo
        // que iba a dejar en efectivo o transferir directo al alias del driver).
        const orders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: "DELIVERED",
                deliveredAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                deliveryFee: true,
                deliveredAt: true,
                createdAt: true,
                driverTipMethod: true,
                driverTipAmount: true,
            },
            orderBy: { deliveredAt: "desc" },
        });

        // Group by day
        const dailyMap: Record<string, { deliveries: number; earnings: number; tipsDeclared: number; tipsCount: number }> = {};

        orders.forEach((order) => {
            const dateKey = (order.deliveredAt || order.createdAt)
                .toISOString()
                .split("T")[0];
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { deliveries: 0, earnings: 0, tipsDeclared: 0, tipsCount: 0 };
            }
            dailyMap[dateKey].deliveries += 1;
            dailyMap[dateKey].earnings += Math.round(
                (order.deliveryFee || 0) * riderPercent / 100
            );
            if (order.driverTipMethod && order.driverTipMethod !== "NONE" && order.driverTipAmount) {
                dailyMap[dateKey].tipsDeclared += order.driverTipAmount;
                dailyMap[dateKey].tipsCount += 1;
            }
        });

        // Convert to sorted array
        const dailyBreakdown = Object.entries(dailyMap)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => b.date.localeCompare(a.date));

        // Totals
        const totalEarnings = dailyBreakdown.reduce((s, d) => s + d.earnings, 0);
        const totalDeliveries = dailyBreakdown.reduce((s, d) => s + d.deliveries, 0);
        const totalTipsDeclared = dailyBreakdown.reduce((s, d) => s + d.tipsDeclared, 0);
        const totalTipsCount = dailyBreakdown.reduce((s, d) => s + d.tipsCount, 0);

        // Previous period for comparison
        // Rama feat/driver-historial-ganancias-y-pagos: el cálculo "vs período
        // anterior" solo aplica a week/month (períodos relativos). Para
        // "all" no tiene sentido (es todo) y para mes específico podría
        // confundir (compararíamos abril vs marzo de oficio).
        let prevTotal = 0;
        if (period === "week" || period === "month") {
            let prevStartDate: Date;
            let prevEndDate: Date;

            if (period === "month") {
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            } else {
                prevStartDate = new Date(startDate);
                prevStartDate.setDate(prevStartDate.getDate() - 7);
                prevEndDate = new Date(startDate);
                prevEndDate.setMilliseconds(-1);
            }

            const prevOrders = await prisma.order.findMany({
                where: {
                    driverId: driver.id,
                    status: "DELIVERED",
                    deliveredAt: {
                        gte: prevStartDate,
                        lte: prevEndDate,
                    },
                },
                select: { deliveryFee: true },
            });

            prevTotal = prevOrders.reduce(
                (s, o) => s + Math.round((o.deliveryFee || 0) * riderPercent / 100),
                0
            );
        }

        return NextResponse.json({
            period,
            totalEarnings,
            totalDeliveries,
            avgPerDelivery: totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0,
            avgPerDay: dailyBreakdown.length > 0 ? Math.round(totalEarnings / dailyBreakdown.length) : 0,
            previousPeriodTotal: prevTotal,
            dailyBreakdown,
            riderPercent,
            // feat/propinas-y-ratings-post-entrega (2026-05-08): propinas
            // declaradas (informativas, no procesadas por Moovy). El driver
            // las cobra/cobro directo del buyer. Mostramos:
            // - totalTipsDeclared: monto total declarado por buyers en el periodo.
            // - totalTipsCount: cantidad de pedidos donde el buyer declaro propina.
            // - hasBankAlias: para mostrar warning si el driver no cargo alias
            //   y por ende los buyers no pueden transferir.
            totalTipsDeclared,
            totalTipsCount,
            hasBankAlias: !!driver.bankAlias,
        });
    } catch (error) {
        console.error("Error fetching driver earnings:", error);
        return NextResponse.json(
            { error: "Error al obtener ganancias" },
            { status: 500 }
        );
    }
}
