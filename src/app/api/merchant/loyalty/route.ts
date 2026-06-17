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
import { requireMerchantApi } from "@/lib/merchant-auth";
import { getMerchantLoyaltyWidget } from "@/lib/merchant-loyalty";
import logger from "@/lib/logger";

const loyaltyLogger = logger.child({ context: "merchant-loyalty-api" });

export async function GET(request: NextRequest) {
  try {
    // Auth contra DB (no contra el JWT cache). Ver src/lib/merchant-auth.ts.
    const authResult = await requireMerchantApi({ allowAdmin: true });
    if (authResult instanceof NextResponse) return authResult;
    const { merchant: ownMerchant, isAdmin } = authResult;

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    // Admin puede especificar cualquier comercio por ?merchantId; el resto solo
    // ve el propio.
    const targetMerchantId: string | null = (merchantId && isAdmin)
      ? merchantId
      : (ownMerchant?.id ?? null);

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
