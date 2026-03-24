/**
 * Admin: Get/Update loyalty tier configurations
 * GET /api/ops/merchant-loyalty/tiers
 * PUT /api/ops/merchant-loyalty/tiers/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/lib/auth-utils";
import logger from "@/lib/logger";

const opsLogger = logger.child({ context: "ops-merchant-loyalty-tiers" });

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tiers = await prisma.merchantLoyaltyConfig.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(tiers);
  } catch (error) {
    opsLogger.error({ error }, "Error fetching tiers");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
