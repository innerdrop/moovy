/**
 * Merchant Loyalty API
 *
 * GET /api/merchant/loyalty
 * Returns loyalty widget data for a merchant.
 *
 * Query params:
 * - merchantId (optional, for ADMIN) — specific merchant
 * - Without merchantId, returns for current user's merchant
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/lib/auth-utils";
import { getMerchantLoyaltyWidget } from "@/lib/merchant-loyalty";
import logger from "@/lib/logger";

const loyaltyLogger = logger.child({ context: "merchant-loyalty-api" });

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");
    const userId = (session.user as any).id;

    let targetMerchantId: string | null = null;

    if (merchantId && hasAnyRole(session, ["ADMIN"])) {
      // Admin can specify any merchant
      targetMerchantId = merchantId;
    } else {
      // User can only see their own merchant
      const merchant = await prisma.merchant.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (!merchant) {
        return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
      }

      targetMerchantId = merchant.id;
    }

    if (!targetMerchantId) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    const loyaltyData = await getMerchantLoyaltyWidget(targetMerchantId);

    if (!loyaltyData) {
      return NextResponse.json({ error: "No se pudo cargar datos de lealtad" }, { status: 500 });
    }

    return NextResponse.json(loyaltyData);
  } catch (error) {
    loyaltyLogger.error({ error }, "Error fetching loyalty data");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
