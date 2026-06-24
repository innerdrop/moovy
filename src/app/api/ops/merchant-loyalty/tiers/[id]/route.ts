/**
 * Admin: Update a specific tier configuration
 * PUT /api/ops/merchant-loyalty/tiers/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const opsLogger = logger.child({ context: "ops-merchant-loyalty-tiers-update" });

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const body = await request.json();
    const { minOrdersPerMonth, commissionRate, badgeText, badgeColor, benefitsJson } = body;

    const updated = await prisma.merchantLoyaltyConfig.update({
      where: { id },
      data: {
        minOrdersPerMonth: minOrdersPerMonth ?? undefined,
        commissionRate: commissionRate ?? undefined,
        badgeText: badgeText ?? undefined,
        badgeColor: badgeColor ?? undefined,
        benefitsJson: benefitsJson ?? undefined,
      },
    });

    opsLogger.info({ tierId: id, updated }, "Tier config updated");

    return NextResponse.json(updated);
  } catch (error) {
    opsLogger.error({ error, tierId: id }, "Error updating tier");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
