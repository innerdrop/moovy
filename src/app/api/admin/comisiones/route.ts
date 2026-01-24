
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || !["ADMIN", "admin"].includes(userRole)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Fetch all merchants first
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
            select: { id: true, name: true, image: true, commissionRate: true }
        });

        // Fetch aggregated order data
        // We want totals regardless of payment status to show history, but maybe focused on what is pending.
        // Let's get everything for now.
        const orderStats = await prisma.order.groupBy({
            by: ['merchantId'],
            _sum: {
                total: true,
                moovyCommission: true,
                merchantPayout: true,
            },
            where: {
                status: 'DELIVERED', // Only counting delivered orders for commissions
                merchantId: { not: null }
            }
        });

        // Fetch pending commissions (commissionPaid = false)
        const pendingStats = await prisma.order.groupBy({
            by: ['merchantId'],
            _sum: {
                moovyCommission: true,
            },
            where: {
                status: 'DELIVERED',
                merchantId: { not: null },
                commissionPaid: false
            }
        });

        // Combine data
        const data = merchants.map(merchant => {
            const stats = orderStats.find(s => s.merchantId === merchant.id);
            const pending = pendingStats.find(s => s.merchantId === merchant.id);

            return {
                id: merchant.id,
                name: merchant.name,
                image: merchant.image,
                commissionRate: merchant.commissionRate,
                totalSales: stats?._sum.total || 0,
                totalCommission: stats?._sum.moovyCommission || 0,
                totalPayout: stats?._sum.merchantPayout || 0,
                pendingCommission: pending?._sum.moovyCommission || 0,
            };
        });

        // Sort by pending commission desc
        data.sort((a, b) => b.pendingCommission - a.pendingCommission);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error fetching commissions:", error);
        return NextResponse.json(
            { error: "Error al obtener comisiones" },
            { status: 500 }
        );
    }
}
