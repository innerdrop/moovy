// API Route: Driver Shift Summary
// GET /api/driver/shift-summary — Returns earnings and delivery stats for the current shift (today)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        // Start of today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Get delivered orders today
        const deliveredOrders = await prisma.order.findMany({
            where: {
                driverId: driver.id,
                status: "DELIVERED",
                deliveredAt: { gte: startOfToday },
            },
            include: {
                merchant: { select: { name: true } },
            },
            orderBy: { deliveredAt: "desc" },
        });

        // Get rider commission percent
        const storeSettings = await prisma.storeSettings.findFirst();
        const riderPercent = storeSettings?.riderCommissionPercent ?? 80;

        // Calculate earnings per order
        const orderEarnings = deliveredOrders.map((o) => ({
            orderNumber: o.orderNumber,
            comercio: o.merchant?.name || "Comercio",
            earnings: Math.round((o.deliveryFee || 0) * riderPercent / 100),
        }));

        const totalEarnings = orderEarnings.reduce((sum, o) => sum + o.earnings, 0);
        const totalDeliveries = orderEarnings.length;
        const avgPerDelivery = totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0;
        const bestDelivery = orderEarnings.length > 0
            ? orderEarnings.reduce((best, o) => o.earnings > best.earnings ? o : best)
            : null;

        // Approximate time online (from first delivery to now)
        const firstDelivery = deliveredOrders[deliveredOrders.length - 1];
        const totalMinutesOnline = firstDelivery
            ? Math.round((Date.now() - new Date(firstDelivery.createdAt).getTime()) / 60000)
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
