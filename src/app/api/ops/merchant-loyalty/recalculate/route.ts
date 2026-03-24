/**
 * Admin: Manually trigger tier recalculation
 * POST /api/ops/merchant-loyalty/recalculate
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { updateAllMerchantTiers } from "@/lib/merchant-loyalty";
import logger from "@/lib/logger";

const opsLogger = logger.child({ context: "ops-merchant-loyalty-recalc" });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    opsLogger.info({}, "Admin triggered tier recalculation");

    const changedCount = await updateAllMerchantTiers();

    return NextResponse.json({
      success: true,
      changedCount,
      message: `Recalculated tiers, ${changedCount} merchants changed`,
    });
  } catch (error) {
    opsLogger.error({ error }, "Error recalculating tiers");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
