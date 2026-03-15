// API Route: Driver Shift Summary
// Returns earnings and delivery stats for the current shift (today)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json(
                { error: "Acceso denegado" },
                { status: 403 }
            );
        }

        // Get driver record for current user
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Repartidor no encontrado" },
                { status: 404 }
            );
        }

        // Get start of today (00:00:00 local time)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Find all delivered orders for this driver today
        const deliveredOrders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: "DELIVERED",
                deliveredAt: {
                    gte: startOfToday,
                },
            },
            include: {
                merchant: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                deliveredAt: "desc",
            },
        });

        // Get store settings for rider commission percentage
        const storeSettings = await prisma.storeSettings.findFirst();
        const riderPercent = storeSettings?.riderCommissionPercent ?? 80;

        // Calculate earnings per order
        const orderEarnings = deliveredOrders.map((order) => ({
            orderNumber: order.orderNumber,
            comercio: order.merchant?.name || "Comercio",
            earnings: Math.round((order.deliveryFee || 0) * (riderPercent / 100)),
        }));

        // Calculate summary stats
        const totalEarnings = orderEarnings.reduce(
            (sum, o) => sum + o.earnings,
            0
        );
        const totalDeliveries = orderEarnings.length;
        const avgPerDelivery =
            totalDeliveries > 0
                ? Math.round(totalEarnings / totalDeliveries)
                : 0;

        // Get best delivery (highest earnings)
        const bestDelivery =
            orderEarnings.length > 0
                ? orderEarnings.reduce((best, o) =>
                      o.earnings > best.earnings ? o : best
                  )
                : null;

        // Calculate total time online (from first delivery to now, or 0)
        const firstDelivery = deliveredOrders[deliveredOrders.length - 1];
        const totalMinutesOnline = firstDelivery
            ? Math.round(
                  (Date.now() - new Date(firstDelivery.createdAt).getTime()) /
                      60000
              )
            : 0;

        return NextResponse.json({
            totalEarnings,
            totalDeliveries,
            avgPerDelivery,
            bestDelivery,
            totalMinutesOnline,
        });
    } catch (error) {
        console.error("[ShiftSummary] Error:", error);
        return NextResponse.json(
            { error: "Error al obtener resumen del turno" },
            { status: 500 }
        );
    }
}
