// API Route: Get merchant KPI stats
import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { prisma } from "@/lib/prisma";

interface MerchantStats {
  todayOrdersCount: number;
  todayRevenue: number;
  pendingOrdersCount: number;
  averageRating: number;
  weekOrdersCount: number;
  weekRevenue: number;
}

export async function GET() {
  try {
    // Auth contra DB (no contra el JWT cache): el comercio recién aprobado tiene
    // el token stale por unos segundos; requireMerchantApi consulta la tabla
    // Merchant directamente. Ver src/lib/merchant-auth.ts.
    const authResult = await requireMerchantApi({ allowAdmin: true });
    if (authResult instanceof NextResponse) return authResult;
    const { merchant } = authResult;

    if (!merchant) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    // Define date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Fetch all stats in parallel
    const [
      todayOrdersResult,
      todayRevenueResult,
      pendingOrdersCount,
      weekOrdersResult,
      weekRevenueResult,
    ] = await Promise.all([
      // Today's orders count
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
          deletedAt: null,
        },
      }),
      // Today's revenue (paid orders only)
      // fix/auditoria-estados-crons: estado pagado canónico = "PAID" (regla #32).
      // Con "APPROVED" (estado inexistente) el dashboard del comercio sumaba $0.
      prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
          paymentStatus: "PAID",
          deletedAt: null,
        },
        _sum: { total: true },
      }),
      // Pending orders count
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          deletedAt: null,
        },
      }),
      // Week's orders count
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: weekAgo },
          deletedAt: null,
        },
      }),
      // Week's revenue
      prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: weekAgo },
          paymentStatus: "PAID",
          deletedAt: null,
        },
        _sum: { total: true },
      }),
    ]);

    const stats: MerchantStats = {
      todayOrdersCount: todayOrdersResult,
      todayRevenue: todayRevenueResult._sum.total || 0,
      pendingOrdersCount,
      averageRating: merchant.rating || 0,
      weekOrdersCount: weekOrdersResult,
      weekRevenue: weekRevenueResult._sum.total || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching merchant stats:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
