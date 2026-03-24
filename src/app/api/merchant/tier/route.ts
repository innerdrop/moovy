/**
 * Merchant Tier API
 *
 * GET /api/merchant/tier?merchantId=...
 * Returns the tier badge info for a merchant.
 * Public endpoint (no auth required).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTierConfig } from "@/lib/merchant-loyalty";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json({ error: "Missing merchantId" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { loyaltyTier: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const tierConfig = await getTierConfig(merchant.loyaltyTier as any);

    if (!tierConfig) {
      return NextResponse.json(
        {
          tier: merchant.loyaltyTier,
          badgeText: merchant.loyaltyTier,
        }
      );
    }

    return NextResponse.json({
      tier: merchant.loyaltyTier,
      badgeText: tierConfig.badgeText,
      badgeColor: tierConfig.badgeColor,
      commissionRate: tierConfig.commissionRate,
    });
  } catch (error) {
    console.error("Error fetching merchant tier:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
