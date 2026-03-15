import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const merchantId = searchParams.get("merchantId");
        const userId = (session.user as any).id;

        // If merchantId is provided and user is ADMIN, use it. Otherwise use user's own merchant
        let merchant;
        if (merchantId && hasAnyRole(session, ["ADMIN"])) {
            merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: { id: true, commissionRate: true },
            });
        } else {
            merchant = await prisma.merchant.findFirst({
                where: { ownerId: userId },
                select: { id: true, commissionRate: true },
            });
        }

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

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

        const sumField = (arr: typeof orders, field: "total" | "merchantPayout" | "moovyCommission") =>
            arr.reduce((acc, o) => acc + (o[field] || 0), 0);

        const summary = {
            merchantId: merchant.id,
            commissionRate: merchant.commissionRate,
            thisMonth: {
                totalSales: sumField(thisMonth, "total"),
                payout: sumField(thisMonth, "merchantPayout"),
                commission: sumField(thisMonth, "moovyCommission"),
                orderCount: thisMonth.length,
            },
            lastMonth: {
                totalSales: sumField(lastMonth, "total"),
                payout: sumField(lastMonth, "merchantPayout"),
                commission: sumField(lastMonth, "moovyCommission"),
                orderCount: lastMonth.length,
            },
            allTime: {
                totalSales: sumField(orders, "total"),
                payout: sumField(orders, "merchantPayout"),
                commission: sumField(orders, "moovyCommission"),
                orderCount: orders.length,
            },
        };

        // Recent transactions (last 20)
        const recentOrders = orders.slice(0, 20);

        return NextResponse.json({ summary, recentOrders });
    } catch (error) {
        console.error("Error fetching merchant earnings:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
