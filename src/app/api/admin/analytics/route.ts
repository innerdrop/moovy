// API: Admin Analytics
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "week";

        // Date ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Orders stats
        const [totalOrders, todayOrders, pendingOrders, deliveredOrders, cancelledOrders] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.order.count({ where: { status: "DELIVERED" } }),
            prisma.order.count({ where: { status: "CANCELLED" } })
        ]);

        // Revenue stats
        const [totalRevenue, todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
            prisma.order.aggregate({ where: { status: "DELIVERED" }, _sum: { total: true } }),
            prisma.order.aggregate({ where: { status: "DELIVERED", createdAt: { gte: todayStart } }, _sum: { total: true } }),
            prisma.order.aggregate({ where: { status: "DELIVERED", createdAt: { gte: weekStart } }, _sum: { total: true } }),
            prisma.order.aggregate({ where: { status: "DELIVERED", createdAt: { gte: monthStart } }, _sum: { total: true } })
        ]);

        // Users stats
        const [totalUsers, clients, merchants, drivers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "CLIENT" } }),
            prisma.merchant.count({ where: { isActive: true } }),
            prisma.driver.count({ where: { isActive: true } })
        ]);

        // Top merchants by orders
        const topMerchantsData = await prisma.order.groupBy({
            by: ["merchantId"],
            where: { merchantId: { not: null }, status: "DELIVERED" },
            _count: { id: true },
            _sum: { total: true },
            orderBy: { _count: { id: "desc" } },
            take: 5
        });

        const merchantIds = topMerchantsData.map(m => m.merchantId!).filter(Boolean);
        const merchantsInfo = await prisma.merchant.findMany({
            where: { id: { in: merchantIds } },
            select: { id: true, name: true }
        });

        const topMerchants = topMerchantsData.map(m => {
            const merchant = merchantsInfo.find(mi => mi.id === m.merchantId);
            return {
                id: m.merchantId || "",
                name: merchant?.name || "Desconocido",
                orders: m._count.id,
                revenue: m._sum.total || 0
            };
        });

        // Top products by sales
        const topProductsData = await prisma.orderItem.groupBy({
            by: ["productId"],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: "desc" } },
            take: 5
        });

        const productIds = topProductsData.map(p => p.productId);
        const productsInfo = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true }
        });

        const topProducts = topProductsData.map(p => {
            const product = productsInfo.find(pi => pi.id === p.productId);
            return {
                id: p.productId,
                name: product?.name || "Producto desconocido",
                sold: p._sum.quantity || 0
            };
        });

        return NextResponse.json({
            orders: {
                total: totalOrders,
                today: todayOrders,
                pending: pendingOrders,
                delivered: deliveredOrders,
                cancelled: cancelledOrders
            },
            revenue: {
                total: totalRevenue._sum.total || 0,
                today: todayRevenue._sum.total || 0,
                thisWeek: weekRevenue._sum.total || 0,
                thisMonth: monthRevenue._sum.total || 0
            },
            users: {
                total: totalUsers,
                clients,
                merchants,
                drivers
            },
            topMerchants,
            topProducts
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
