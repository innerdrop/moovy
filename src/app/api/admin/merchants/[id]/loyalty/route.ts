import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAdminAction, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";

const adminLogger = logger.child({ context: "admin/merchant-loyalty" });
const VALID_TIERS = ["BRONCE", "PLATA", "ORO", "DIAMANTE"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!hasRole(session, "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { tier, locked } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de comercio requerido" },
        { status: 400 }
      );
    }

    if (!tier || typeof tier !== "string") {
      return NextResponse.json(
        { error: "Tier requerido y debe ser string" },
        { status: 400 }
      );
    }

    if (!VALID_TIERS.includes(tier.toUpperCase())) {
      return NextResponse.json(
        {
          error: `Tier inválido. Debe ser uno de: ${VALID_TIERS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (typeof locked !== "boolean") {
      return NextResponse.json(
        { error: "locked debe ser booleano" },
        { status: 400 }
      );
    }

    // Get merchant with current tier
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        loyaltyTier: true,
        loyaltyTierLocked: true,
        loyaltyOrderCount: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = extractRequestInfo(request);
    const oldTier = merchant.loyaltyTier;
    const oldLocked = merchant.loyaltyTierLocked;
    const now = new Date();

    // Update merchant
    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        loyaltyTier: tier.toUpperCase(),
        loyaltyTierLocked: locked,
        loyaltyUpdatedAt: now,
      },
      select: {
        id: true,
        name: true,
        loyaltyTier: true,
        loyaltyTierLocked: true,
        loyaltyOrderCount: true,
        loyaltyUpdatedAt: true,
      },
    });

    // Determine action type based on lock change
    let action: string = ACTIVITY_ACTIONS.ADMIN_LOYALTY_TIER_CHANGED;
    if (locked && !oldLocked) {
      action = ACTIVITY_ACTIONS.ADMIN_LOYALTY_TIER_LOCKED;
    } else if (!locked && oldLocked) {
      action = ACTIVITY_ACTIONS.ADMIN_LOYALTY_TIER_UNLOCKED;
    }

    // Log admin action
    await logAdminAction({
      adminUserId: session.user.id,
      targetUserId: id, // Use merchant ID as entity identifier
      action,
      entityType: "Merchant",
      entityId: id,
      details: {
        oldTier,
        newTier: tier.toUpperCase(),
        oldLocked,
        newLocked: locked,
        orderCount: merchant.loyaltyOrderCount,
      },
      ipAddress,
      userAgent,
    });

    // Log audit
    await logAudit({
      action: "MERCHANT_LOYALTY_TIER_OVERRIDE",
      entityType: "Merchant",
      entityId: id,
      userId: session.user.id,
      details: {
        oldTier,
        newTier: tier.toUpperCase(),
        locked,
      },
    });

    adminLogger.info(
      {
        merchantId: id,
        merchantName: merchant.name,
        adminId: session.user.id,
        oldTier,
        newTier: tier.toUpperCase(),
        locked,
      },
      "Tier de lealtad del comercio actualizado"
    );

    return NextResponse.json({
      success: true,
      message: `Tier de lealtad actualizado exitosamente${
        locked ? " y bloqueado" : ""
      }`,
      merchant: updated,
    });
  } catch (error) {
    adminLogger.error({ error }, "Error al actualizar tier de lealtad");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
