/**
 * Admin: Get merchants with loyalty info
 * GET /api/ops/merchant-loyalty/merchants
 */

import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const opsLogger = logger.child({ context: "ops-merchant-loyalty" });

export async function GET(request: NextRequest) {
  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const merchants = await prisma.merchant.findMany({
      where: { isActive: true, approvalStatus: "APPROVED" },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyTier: true,
        loyaltyOrderCount: true,
        loyaltyUpdatedAt: true,
      },
      orderBy: { loyaltyTier: "desc" },
    });

    return NextResponse.json(merchants);
  } catch (error) {
    opsLogger.error({ error }, "Error fetching merchants");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
