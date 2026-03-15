// Admin Comisiones API - Commission management for merchants
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
            select: { id: true, name: true, image: true, commissionRate: true },
        });

        const orderStats = await prisma.order.groupBy({
            by: ["merchantId"],
            _sum: {
                total: true,
                moovyCommission: true,
                merchantPayout: true,
            },
            where: {
                status: "DELIVERED",
                merchantId: { not: null },
            },
        });

        const pendingStats = await prisma.order.groupBy({
            by: ["merchantId"],
            _sum: {
                moovyCommission: true,
                merchantPayout: true,
            },
            _count: true,
            where: {
                status: "DELIVERED",
                merchantId: { not: null },
                commissionPaid: false,
            },
        });

        const data = merchants.map((merchant) => {
            const stats = orderStats.find((s) => s.merchantId === merchant.id);
            const pending = pendingStats.find((s) => s.merchantId === merchant.id);

            return {
                id: merchant.id,
                name: merchant.name,
                image: merchant.image,
                commissionRate: merchant.commissionRate,
                totalSales: stats?._sum.total || 0,
                totalCommission: stats?._sum.moovyCommission || 0,
                totalPayout: stats?._sum.merchantPayout || 0,
                pendingCommission: pending?._sum.moovyCommission || 0,
                pendingPayout: pending?._sum.merchantPayout || 0,
                pendingOrderCount: pending?._count || 0,
            };
        });

        data.sort((a, b) => b.pendingCommission - a.pendingCommission);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching commissions:", error);
        return NextResponse.json({ error: "Error al obtener comisiones" }, { status: 500 });
    }
}

// Mark all pending orders for a merchant as commission paid
export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { merchantId } = body;

        if (!merchantId) {
            return NextResponse.json({ error: "merchantId requerido" }, { status: 400 });
        }

        const result = await prisma.order.updateMany({
            where: {
                merchantId,
                status: "DELIVERED",
                commissionPaid: false,
            },
            data: {
                commissionPaid: true,
            },
        });

        console.log(`[COMISIONES] Marked ${result.count} orders as paid for merchant ${merchantId} by admin`);

        return NextResponse.json({ updated: result.count });
    } catch (error) {
        console.error("Error marking commissions as paid:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}
