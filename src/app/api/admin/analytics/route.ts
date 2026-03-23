// API: Admin Analytics - Comprehensive business metrics
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

interface AnalyticsResponse {
    period: string;
    business: {
        totalOrders: number;
        grossRevenue: number;
        moovyRevenue: number;
        averageTicket: number;
        cancellationRate: number;
        newUserRegistrations: number;
        paymentSplit: {
            cash: number;
            mercadopago: number;
        };
    };
    merchants: {
        activeCount: number;
        registeredCount: number;
        averageRating: number;
        inactiveCount: number;
        topByOrders: Array<{
            id: string;
            name: string;
            ordersCount: number;
            revenue: number;
            rating: number;
        }>;
    };
    drivers: {
        activeCount: number;
        registeredCount: number;
        averageRating: number;
        statusBreakdown: {
            online: number;
            offline: number;
            busy: number;
        };
        topByDeliveries: Array<{
            id: string;
            name: string;
            deliveriesCount: number;
            rating: number;
        }>;
    };
    buyers: {
        activeBuyersCount: number;
        repeatRate: number;
        newUserCount: number;
    };
}

export async function GET(request: NextRequest): Promise<NextResponse<AnalyticsResponse | { error: string }>> {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "today";

        // Calculate date ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let dateFilter: { gte?: Date; lte?: Date } = {};
        if (period === "today") {
            dateFilter = { gte: todayStart };
        } else if (period === "week") {
            dateFilter = { gte: weekStart };
        } else if (period === "month") {
            dateFilter = { gte: monthStart };
        }

        // ====== BUSINESS METRICS ======
        const periodOrders = await prisma.order.findMany({
            where: {
                createdAt: dateFilter,
                deletedAt: null,
            },
            select: {
                id: true,
                total: true,
                status: true,
                paymentMethod: true,
                merchantId: true,
                createdAt: true,
            },
        });

        const totalOrders = periodOrders.length;
        const grossRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
        const averageTicket = totalOrders > 0 ? grossRevenue / totalOrders : 0;

        // Calculate MOOVY commission (8% merchant + 12% seller from orders)
        // Simplified: assume average 8% on all orders delivered
        const deliveredOrders = periodOrders.filter(o => o.status === "DELIVERED");
        const moovyRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total * 0.08), 0);

        const cancelledCount = periodOrders.filter(o => o.status === "CANCELLED").length;
        const cancellationRate = totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;

        const cashCount = periodOrders.filter(o => o.paymentMethod === "CASH").length;
        const mpCount = periodOrders.filter(o => o.paymentMethod === "MERCADOPAGO").length;

        const newUserRegs = await prisma.user.count({
            where: {
                createdAt: dateFilter,
            },
        });

        // ====== MERCHANT METRICS ======
        const activeCount = await prisma.merchant.count({
            where: { isActive: true, approvalStatus: "APPROVED" },
        });
        const registeredCount = await prisma.merchant.count();

        const merchantsWithRatings = await prisma.merchant.findMany({
            where: { isActive: true },
            select: { id: true, rating: true },
        });
        const avgMerchantRating = merchantsWithRatings.length > 0
            ? merchantsWithRatings.reduce((sum, m) => sum + (m.rating || 0), 0) / merchantsWithRatings.length
            : 0;

        // Inactive merchants (no orders in last 7 days)
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const inactiveMerchantsData = await prisma.merchant.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        const merchantsWithOrders = await prisma.order.findMany({
            where: {
                merchantId: { in: inactiveMerchantsData.map(m => m.id) },
                createdAt: { gte: sevenDaysAgo },
            },
            select: { merchantId: true },
            distinct: ["merchantId"],
        });
        const merchantsWithOrdersIds = new Set(merchantsWithOrders.map(o => o.merchantId).filter(Boolean));
        const inactiveCount = inactiveMerchantsData.length - merchantsWithOrdersIds.size;

        // Top merchants by orders
        const topMerchantsGroupBy = await prisma.order.groupBy({
            by: ["merchantId"],
            where: {
                merchantId: { not: null },
                status: "DELIVERED",
                createdAt: dateFilter,
            },
            _count: { id: true },
            _sum: { total: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
        });

        const topMerchantIds = topMerchantsGroupBy
            .map(m => m.merchantId)
            .filter((id): id is string => id !== null);
        const topMerchantsInfo = await prisma.merchant.findMany({
            where: { id: { in: topMerchantIds } },
            select: { id: true, name: true, rating: true },
        });

        const topMerchantsByOrders = topMerchantsGroupBy.map(m => {
            const merchant = topMerchantsInfo.find(mi => mi.id === m.merchantId);
            return {
                id: m.merchantId || "",
                name: merchant?.name || "Desconocido",
                ordersCount: m._count.id,
                revenue: m._sum.total || 0,
                rating: merchant?.rating || 0,
            };
        });

        // ====== DRIVER METRICS ======
        const driversActive = await prisma.driver.count({
            where: { isActive: true, isOnline: true, approvalStatus: "APPROVED" },
        });
        const driversRegistered = await prisma.driver.count();

        const driversWithRatings = await prisma.driver.findMany({
            where: { isActive: true },
            select: { id: true, rating: true },
        });
        const avgDriverRating = driversWithRatings.length > 0
            ? driversWithRatings.reduce((sum, d) => sum + (d.rating || 0), 0) / driversWithRatings.length
            : 0;

        // Driver status breakdown
        const driverStatuses = await prisma.driver.groupBy({
            by: ["availabilityStatus"],
            _count: { id: true },
        });

        const statusBreakdown = {
            online: driverStatuses.find(s => s.availabilityStatus === "ONLINE")?._count.id || 0,
            offline: driverStatuses.find(s => s.availabilityStatus === "OFFLINE")?._count.id || 0,
            busy: driverStatuses.find(s => s.availabilityStatus === "BUSY")?._count.id || 0,
        };

        // Top drivers by deliveries
        const topDriversGroupBy = await prisma.order.groupBy({
            by: ["driverId"],
            where: {
                driverId: { not: null },
                status: "DELIVERED",
                createdAt: dateFilter,
            },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
        });

        const topDriverIds = topDriversGroupBy
            .map(d => d.driverId)
            .filter((id): id is string => id !== null);
        const topDriversInfo = await prisma.driver.findMany({
            where: { id: { in: topDriverIds } },
            select: {
                id: true,
                userId: true,
                rating: true,
                user: { select: { firstName: true, lastName: true } },
            },
        });

        const topDriversByDeliveries = topDriversGroupBy.map(d => {
            const driver = topDriversInfo.find(di => di.id === d.driverId);
            const driverName = driver?.user
                ? `${driver.user.firstName || ""} ${driver.user.lastName || ""}`.trim()
                : "Desconocido";
            return {
                id: d.driverId || "",
                name: driverName,
                deliveriesCount: d._count.id,
                rating: driver?.rating || 0,
            };
        });

        // ====== BUYER METRICS ======
        const activeBuyersThirtyDays = new Date(now);
        activeBuyersThirtyDays.setDate(activeBuyersThirtyDays.getDate() - 30);

        const activeBuyersCount = await prisma.order.findMany({
            where: {
                createdAt: { gte: activeBuyersThirtyDays },
                status: "DELIVERED",
            },
            select: { userId: true },
            distinct: ["userId"],
        });

        // Repeat buyers (ordered more than once in last 30 days)
        const buyersWithOrderCounts = await prisma.order.groupBy({
            by: ["userId"],
            where: {
                createdAt: { gte: activeBuyersThirtyDays },
                status: "DELIVERED",
            },
            _count: { id: true },
        });

        const repeatBuyersCount = buyersWithOrderCounts.filter(b => b._count.id > 1).length;
        const repeatRate = activeBuyersCount.length > 0
            ? (repeatBuyersCount / activeBuyersCount.length) * 100
            : 0;

        const newBuyersCount = await prisma.user.count({
            where: {
                createdAt: dateFilter,
                role: "USER",
            },
        });

        const response: AnalyticsResponse = {
            period,
            business: {
                totalOrders,
                grossRevenue,
                moovyRevenue,
                averageTicket,
                cancellationRate,
                newUserRegistrations: newUserRegs,
                paymentSplit: {
                    cash: cashCount,
                    mercadopago: mpCount,
                },
            },
            merchants: {
                activeCount,
                registeredCount,
                averageRating: Math.round(avgMerchantRating * 100) / 100,
                inactiveCount,
                topByOrders: topMerchantsByOrders,
            },
            drivers: {
                activeCount: driversActive,
                registeredCount: driversRegistered,
                averageRating: Math.round(avgDriverRating * 100) / 100,
                statusBreakdown,
                topByDeliveries: topDriversByDeliveries,
            },
            buyers: {
                activeBuyersCount: activeBuyersCount.length,
                repeatRate: Math.round(repeatRate * 100) / 100,
                newUserCount: newBuyersCount,
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
