import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        if (!driver) {
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "week"; // "week" or "month"

        // Fetch store settings for rider commission %
        const storeSettings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });
        const riderPercent = (storeSettings as any)?.riderCommissionPercent ?? 80;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            // Start of current week (Monday)
            const day = now.getDay();
            const diff = day === 0 ? 6 : day - 1; // Monday = 0
            startDate = new Date(now);
            startDate.setDate(now.getDate() - diff);
            startDate.setHours(0, 0, 0, 0);
        }

        // Get completed orders in date range
        const orders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: "DELIVERED",
                deliveredAt: {
                    gte: startDate,
                    lte: now,
                },
            },
            select: {
                deliveryFee: true,
                deliveredAt: true,
                createdAt: true,
            },
            orderBy: { deliveredAt: "desc" },
        });

        // Group by day
        const dailyMap: Record<string, { deliveries: number; earnings: number }> = {};

        orders.forEach((order) => {
            const dateKey = (order.deliveredAt || order.createdAt)
                .toISOString()
                .split("T")[0];
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { deliveries: 0, earnings: 0 };
            }
            dailyMap[dateKey].deliveries += 1;
            dailyMap[dateKey].earnings += Math.round(
                (order.deliveryFee || 0) * riderPercent / 100
            );
        });

        // Convert to sorted array
        const dailyBreakdown = Object.entries(dailyMap)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => b.date.localeCompare(a.date));

        // Totals
        const totalEarnings = dailyBreakdown.reduce((s, d) => s + d.earnings, 0);
        const totalDeliveries = dailyBreakdown.reduce((s, d) => s + d.deliveries, 0);

        // Previous period for comparison
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

        const prevTotal = prevOrders.reduce(
            (s, o) => s + Math.round((o.deliveryFee || 0) * riderPercent / 100),
            0
        );

        return NextResponse.json({
            period,
            totalEarnings,
            totalDeliveries,
            avgPerDelivery: totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0,
            avgPerDay: dailyBreakdown.length > 0 ? Math.round(totalEarnings / dailyBreakdown.length) : 0,
            previousPeriodTotal: prevTotal,
            dailyBreakdown,
            riderPercent,
        });
    } catch (error) {
        console.error("Error fetching driver earnings:", error);
        return NextResponse.json(
            { error: "Error al obtener ganancias" },
            { status: 500 }
        );
    }
}
