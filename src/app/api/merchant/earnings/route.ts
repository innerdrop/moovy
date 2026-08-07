import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { getCommissionForDisplay } from "@/lib/merchant-loyalty";

export async function GET(request: NextRequest) {
    try {
        // Auth contra DB (no contra el JWT cache). Ver src/lib/merchant-auth.ts.
        const authResult = await requireMerchantApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { merchant: ownMerchant, isAdmin } = authResult;

        const { searchParams } = new URL(request.url);
        const merchantId = searchParams.get("merchantId");

        // Si viene merchantId y el user es ADMIN, usa ese comercio. Si no, el propio.
        const merchant = (merchantId && isAdmin)
            ? await prisma.merchant.findUnique({
                where: { id: merchantId },
                // Ya no pedimos commissionRate: esa columna no se muestra mas
                // (ver getCommissionForDisplay). El % sale del motor de comisiones.
                select: { id: true },
            })
            : ownMerchant;

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // fix/la-comision-que-ve-el-comercio: el % que ve el comercio es el mismo
        // con el que se le liquida cada pedido — override > mes gratis > tier >
        // default de la Biblia. Antes esto devolvia Merchant.commissionRate, una
        // columna legacy con @default(8) que no se cobra en ningun lado.
        const commission = await getCommissionForDisplay(merchant.id);

        // Get all delivered orders with payment data
        const orders = await prisma.order.findMany({
            where: {
                merchantId: merchant.id,
                status: "DELIVERED",
            },
            select: {
                id: true,
                orderNumber: true,
                total: true,
                subtotal: true,
                deliveryFee: true,
                merchantPayout: true,
                moovyCommission: true,
                // fix/dashboard-dinero-real: % del SNAPSHOT con el que se liquidó cada
                // pedido (mes 1 gratis / tier del momento). El snapshot vive en la
                // SubOrder (canon del Reparto Financiero) — con multi-vendor OFF hay
                // exactamente una por pedido. Se aplana en la response.
                subOrders: {
                    select: { merchantCommissionRate: true },
                    take: 1,
                },
                paymentMethod: true,
                paymentStatus: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Calculate summaries
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const thisMonth = orders.filter(o => new Date(o.createdAt) >= startOfMonth);
        const lastMonth = orders.filter(o => {
            const d = new Date(o.createdAt);
            return d >= startOfLastMonth && d <= endOfLastMonth;
        });

        // fix/dashboard-dinero-real:
        // - "Ventas" = SUBTOTAL (los productos del comercio). El total incluye el
        //   envío, que es plata del repartidor/Moovy — sumarlo inflaba el resumen.
        // - round2 en las sumas (regla PAGOS: los floats acumulan drift de centavos).
        const round2 = (n: number) => Math.round(n * 100) / 100;
        const sumField = (arr: typeof orders, field: "subtotal" | "merchantPayout" | "moovyCommission") =>
            round2(arr.reduce((acc, o) => acc + (o[field] || 0), 0));

        const summary = {
            merchantId: merchant.id,
            // % ACTUAL del comercio (para el banner "tu comisión hoy"); cada pedido
            // trae además su merchantCommissionRate del snapshot.
            commissionRate: commission.rate,
            commissionSource: commission.source,
            // Mes gratis: hasta cuándo corre y qué porcentaje viene después. Sin
            // esto el comercio arma sus precios sobre un 0% que se le vence.
            firstMonthFree: commission.firstMonthFree,
            firstMonthEndsAt: commission.firstMonthEndsAt,
            rateAfterFirstMonth: commission.rateAfterFirstMonth,
            thisMonth: {
                totalSales: sumField(thisMonth, "subtotal"),
                payout: sumField(thisMonth, "merchantPayout"),
                commission: sumField(thisMonth, "moovyCommission"),
                orderCount: thisMonth.length,
            },
            lastMonth: {
                totalSales: sumField(lastMonth, "subtotal"),
                payout: sumField(lastMonth, "merchantPayout"),
                commission: sumField(lastMonth, "moovyCommission"),
                orderCount: lastMonth.length,
            },
            allTime: {
                totalSales: sumField(orders, "subtotal"),
                payout: sumField(orders, "merchantPayout"),
                commission: sumField(orders, "moovyCommission"),
                orderCount: orders.length,
            },
        };

        // Recent transactions (last 20) — merchantCommissionRate aplanado desde la SubOrder.
        const recentOrders = orders.slice(0, 20).map(({ subOrders, ...o }) => ({
            ...o,
            merchantCommissionRate: subOrders[0]?.merchantCommissionRate ?? null,
        }));

        return NextResponse.json({ summary, recentOrders });
    } catch (error) {
        console.error("Error fetching merchant earnings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
