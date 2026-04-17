import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAdminAction, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";

const adminLogger = logger.child({ context: "admin/unsuspend-user" });

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
    const { role } = body || {};

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = ["COMERCIO", "DRIVER", "SELLER"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol de reactivación inválido" },
        { status: 400 }
      );
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

    const { ipAddress, userAgent } = extractRequestInfo(request);

    // If role is specified, unsuspend only that specific entity
    // Otherwise, unsuspend the User entirely + all entities
    if (role) {
      // Unsuspend by role
      const transactions = [];

      if (role === "COMERCIO" && user.ownedMerchants && user.ownedMerchants.length > 0) {
        transactions.push(
          ...user.ownedMerchants.map((merchant) =>
            prisma.merchant.update({
              where: { id: merchant.id },
              data: {
                isSuspended: false,
                suspendedAt: null,
                suspendedUntil: null,
                suspensionReason: null,
              },
            })
          )
        );
      } else if (role === "DRIVER" && user.driver) {
        transactions.push(
          prisma.driver.update({
            where: { id: user.driver.id },
            data: {
              isSuspended: false,
              suspendedAt: null,
              suspendedUntil: null,
              suspensionReason: null,
            },
          })
        );
      } else if (role === "SELLER" && user.sellerProfile) {
        transactions.push(
          prisma.sellerProfile.update({
            where: { id: user.sellerProfile.id },
            data: {
              isSuspended: false,
              suspendedAt: null,
              suspendedUntil: null,
              suspensionReason: null,
            },
          })
        );
      }

      if (transactions.length > 0) {
        await prisma.$transaction(transactions);
      }
    } else {
      // Unsuspend user entirely + all entities
      await prisma.$transaction([
        // Unsuspend user
        prisma.user.update({
          where: { id },
          data: {
            isSuspended: false,
            suspendedAt: null,
            suspendedUntil: null,
            suspensionReason: null,
          },
        }),

        // Unsuspend merchant if exists
        ...(user.ownedMerchants && user.ownedMerchants.length > 0
          ? user.ownedMerchants.map((merchant) =>
              prisma.merchant.update({
                where: { id: merchant.id },
                data: {
                  isSuspended: false,
                  suspendedAt: null,
                  suspendedUntil: null,
                  suspensionReason: null,
                },
              })
            )
          : []),

        // Unsuspend driver if exists
        ...(user.driver
          ? [
              prisma.driver.update({
                where: { id: user.driver.id },
                data: {
                  isSuspended: false,
                  suspendedAt: null,
                  suspendedUntil: null,
                  suspensionReason: null,
                },
              }),
            ]
          : []),

        // Unsuspend seller if exists
        ...(user.sellerProfile
          ? [
              prisma.sellerProfile.update({
                where: { id: user.sellerProfile.id },
                data: {
                  isSuspended: false,
                  suspendedAt: null,
                  suspendedUntil: null,
                  suspensionReason: null,
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
      action: ACTIVITY_ACTIONS.ADMIN_UNSUSPENDED,
      entityType: "User",
      entityId: id,
      details: {
        role: role || "FULL_USER",
      },
      ipAddress,
      userAgent,
    });

    // Log audit
    await logAudit({
      action: "USER_UNSUSPENDED",
      entityType: "User",
      entityId: id,
      userId: session.user.id,
      details: {
        role: role || "FULL_USER",
      },
    });

    adminLogger.info(
      { userId: id, adminId: session.user.id, role: role || "FULL_USER" },
      "Usuario reactivado"
    );

    return NextResponse.json({
      success: true,
      message: role
        ? `Rol ${role} del usuario ${id} reactivado exitosamente`
        : `Usuario ${id} reactivado exitosamente`,
      suspended: false,
      role: role || null,
    });
  } catch (error) {
    adminLogger.error({ error }, "Error al reactivar usuario");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
