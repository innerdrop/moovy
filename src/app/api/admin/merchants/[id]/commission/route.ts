import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAdminAction, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";

const adminLogger = logger.child({ context: "admin/merchant-commission" });

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
    const { commissionOverride, reason } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de comercio requerido" },
        { status: 400 }
      );
    }

    // Validate commissionOverride
    if (commissionOverride !== null && typeof commissionOverride !== "number") {
      return NextResponse.json(
        { error: "Comisión debe ser un número o null" },
        { status: 400 }
      );
    }

    if (
      commissionOverride !== null &&
      (commissionOverride < 0 || commissionOverride > 100)
    ) {
      return NextResponse.json(
        { error: "Comisión debe estar entre 0 y 100" },
        { status: 400 }
      );
    }

    // Get merchant with current override
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        commissionOverride: true,
        commissionOverrideReason: true,
        loyaltyTier: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = extractRequestInfo(request);
    const oldCommission = merchant.commissionOverride;
    const oldReason = merchant.commissionOverrideReason;

    // Update merchant
    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        commissionOverride:
          commissionOverride !== undefined ? commissionOverride : undefined,
        commissionOverrideReason:
          commissionOverride === null ? null : reason || null,
      },
      select: {
        id: true,
        name: true,
        commissionOverride: true,
        commissionOverrideReason: true,
        loyaltyTier: true,
      },
    });

    // Log admin action
    await logAdminAction({
      adminUserId: session.user.id,
      targetUserId: merchant.id, // Use merchant ID as entity identifier
      action: ACTIVITY_ACTIONS.ADMIN_COMMISSION_OVERRIDE,
      entityType: "Merchant",
      entityId: id,
      details: {
        oldCommission,
        oldReason,
        newCommission: commissionOverride,
        newReason: reason || null,
        loyaltyTier: merchant.loyaltyTier,
      },
      ipAddress,
      userAgent,
    });

    // Log audit
    await logAudit({
      action: "MERCHANT_COMMISSION_OVERRIDE",
      entityType: "Merchant",
      entityId: id,
      userId: session.user.id,
      details: {
        oldCommission,
        newCommission: commissionOverride,
        reason,
      },
    });

    adminLogger.info(
      {
        merchantId: id,
        merchantName: merchant.name,
        adminId: session.user.id,
        oldCommission,
        newCommission: commissionOverride,
      },
      "Comisión de comercio actualizada"
    );

    return NextResponse.json({
      success: true,
      message:
        commissionOverride === null
          ? "Anulación de comisión removida"
          : "Comisión actualizada exitosamente",
      merchant: updated,
    });
  } catch (error) {
    adminLogger.error({ error }, "Error al actualizar comisión");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
