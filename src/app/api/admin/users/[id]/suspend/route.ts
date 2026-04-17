import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAdminAction, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";

const adminLogger = logger.child({ context: "admin/suspend-user" });

export async function POST(
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
    const { reason, until, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Razón de suspensión requerida" },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = ["COMERCIO", "DRIVER", "SELLER"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol de suspensión inválido" },
        { status: 400 }
      );
    }

    // Validate until date if provided
    let untilDate: Date | null = null;
    if (until) {
      untilDate = new Date(until);
      if (isNaN(untilDate.getTime())) {
        return NextResponse.json(
          { error: "Fecha de suspensión inválida" },
          { status: 400 }
        );
      }
    }

    // Check that user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true } },
        ownedMerchants: { select: { id: true } },
        sellerProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const now = new Date();
    const { ipAddress, userAgent } = extractRequestInfo(request);

    // If role is specified, suspend only that specific entity
    // Otherwise, suspend the User entirely (all access blocked)
    if (role) {
      // Suspend by role
      const transactions = [];

      if (role === "COMERCIO" && user.ownedMerchants && user.ownedMerchants.length > 0) {
        transactions.push(
          ...user.ownedMerchants.map((merchant) =>
            prisma.merchant.update({
              where: { id: merchant.id },
              data: {
                isSuspended: true,
                suspendedAt: now,
                suspendedUntil: untilDate,
                suspensionReason: reason,
              },
            })
          )
        );
      } else if (role === "DRIVER" && user.driver) {
        transactions.push(
          prisma.driver.update({
            where: { id: user.driver.id },
            data: {
              isSuspended: true,
              suspendedAt: now,
              suspendedUntil: untilDate,
              suspensionReason: reason,
            },
          })
        );
      } else if (role === "SELLER" && user.sellerProfile) {
        transactions.push(
          prisma.sellerProfile.update({
            where: { id: user.sellerProfile.id },
            data: {
              isSuspended: true,
              suspendedAt: now,
              suspendedUntil: untilDate,
              suspensionReason: reason,
            },
          })
        );
      }

      if (transactions.length > 0) {
        await prisma.$transaction(transactions);
      }
    } else {
      // Suspend user entirely (all access blocked)
      await prisma.$transaction([
        // Suspend user
        prisma.user.update({
          where: { id },
          data: {
            isSuspended: true,
            suspendedAt: now,
            suspendedUntil: untilDate,
            suspensionReason: reason,
          },
        }),

        // Suspend merchant if exists
        ...(user.ownedMerchants && user.ownedMerchants.length > 0
          ? user.ownedMerchants.map((merchant) =>
              prisma.merchant.update({
                where: { id: merchant.id },
                data: {
                  isSuspended: true,
                  suspendedAt: now,
                  suspendedUntil: untilDate,
                  suspensionReason: reason,
                },
              })
            )
          : []),

        // Suspend driver if exists
        ...(user.driver
          ? [
              prisma.driver.update({
                where: { id: user.driver.id },
                data: {
                  isSuspended: true,
                  suspendedAt: now,
                  suspendedUntil: untilDate,
                  suspensionReason: reason,
                },
              }),
            ]
          : []),

        // Suspend seller if exists
        ...(user.sellerProfile
          ? [
              prisma.sellerProfile.update({
                where: { id: user.sellerProfile.id },
                data: {
                  isSuspended: true,
                  suspendedAt: now,
                  suspendedUntil: untilDate,
                  suspensionReason: reason,
                },
              }),
            ]
          : []),
      ]);
    }

    // Log admin action
    await logAdminAction({
      adminUserId: session.user.id,
      targetUserId: id,
      action: ACTIVITY_ACTIONS.ADMIN_SUSPENDED,
      entityType: "User",
      entityId: id,
      details: {
        reason,
        until: untilDate ? untilDate.toISOString() : null,
        permanent: !untilDate,
        role: role || "FULL_USER",
      },
      ipAddress,
      userAgent,
    });

    // Log audit
    await logAudit({
      action: "USER_SUSPENDED",
      entityType: "User",
      entityId: id,
      userId: session.user.id,
      details: {
        reason,
        until: untilDate ? untilDate.toISOString() : null,
        role: role || "FULL_USER",
      },
    });

    adminLogger.info(
      { userId: id, adminId: session.user.id, reason, until, role: role || "FULL_USER" },
      "Usuario suspendido"
    );

    return NextResponse.json({
      success: true,
      message: role
        ? `Rol ${role} del usuario ${id} suspendido exitosamente`
        : `Usuario ${id} suspendido exitosamente`,
      suspended: true,
      until: untilDate ? untilDate.toISOString() : null,
      role: role || null,
    });
  } catch (error) {
    adminLogger.error({ error }, "Error al suspender usuario");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
