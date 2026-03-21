// API Route: Get merchant KPI stats
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

interface MerchantStats {
  todayOrdersCount: number;
  todayRevenue: number;
  pendingOrdersCount: number;
  averageRating: number;
  weekOrdersCount: number;
  weekRevenue: number;
}

export async function GET(): Promise<NextResponse<MerchantStats | { error: string }>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Get merchant for this user
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, rating: true },
    });

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
      // Today's revenue (approved payments only)
      prisma.order.aggregate({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: today },
          paymentStatus: "APPROVED",
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
          paymentStatus: "APPROVED",
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
