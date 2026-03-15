import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Define date range for filtering
        let filterFrom = new Date(0); // Beginning of time by default
        let filterTo = new Date(); // Now by default

        if (dateFrom) {
            filterFrom = new Date(dateFrom);
        }
        if (dateTo) {
            filterTo = new Date(dateTo);
        }

        // All delivered orders within date range
        const orders = await prisma.order.findMany({
            where: {
                status: "DELIVERED",
                createdAt: {
                    gte: filterFrom,
                    lte: filterTo
                }
            },
            select: {
                total: true,
                subtotal: true,
                deliveryFee: true,
                merchantPayout: true,
                moovyCommission: true,
                paymentMethod: true,
                createdAt: true,
            },
        });

        const sum = (arr: typeof orders, field: "total" | "merchantPayout" | "moovyCommission" | "deliveryFee") =>
            arr.reduce((acc, o) => acc + (o[field] || 0), 0);

        const thisMonth = orders.filter((o) => o.createdAt >= thisMonthStart);
        const lastMonth = orders.filter((o) => o.createdAt >= lastMonthStart && o.createdAt < thisMonthStart);

        const mpOrders = orders.filter((o) => o.paymentMethod === "mercadopago");
        const cashOrders = orders.filter((o) => o.paymentMethod === "cash");

        // SubOrder seller commissions
        const sellerCommissions = await prisma.subOrder.aggregate({
            where: { order: { status: "DELIVERED" } },
            _sum: { moovyCommission: true, sellerPayout: true },
        });

        const result = {
            allTime: {
                totalSales: sum(orders, "total"),
                moovyCommission: sum(orders, "moovyCommission"),
                merchantPayouts: sum(orders, "merchantPayout"),
                deliveryFees: sum(orders, "deliveryFee"),
                orderCount: orders.length,
                sellerCommissions: sellerCommissions._sum.moovyCommission || 0,
                sellerPayouts: sellerCommissions._sum.sellerPayout || 0,
            },
            thisMonth: {
                totalSales: sum(thisMonth, "total"),
                moovyCommission: sum(thisMonth, "moovyCommission"),
                merchantPayouts: sum(thisMonth, "merchantPayout"),
                orderCount: thisMonth.length,
            },
            lastMonth: {
                totalSales: sum(lastMonth, "total"),
                moovyCommission: sum(lastMonth, "moovyCommission"),
                merchantPayouts: sum(lastMonth, "merchantPayout"),
                orderCount: lastMonth.length,
            },
            byPaymentMethod: {
                mercadopago: { count: mpOrders.length, total: sum(mpOrders, "total") },
                cash: { count: cashOrders.length, total: sum(cashOrders, "total") },
            },
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Revenue error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
