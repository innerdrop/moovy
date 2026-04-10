import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { logAdminAction, extractRequestInfo } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

const log = logger.child({ context: "admin/users/delete" });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check ADMIN role
    if (!hasRole(session, "ADMIN")) {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar usuarios" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { restore } = body;

    // Get user to validate they exist
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        ownedMerchants: { select: { id: true } },
        driver: { select: { id: true } },
        sellerProfile: { select: { id: true } },
        roles: { select: { role: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = extractRequestInfo(request);

    if (restore) {
      // Restore: set deletedAt = null and reactivate roles
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: { deletedAt: null },
        });

        await tx.userRole.updateMany({
          where: { userId: id },
          data: { isActive: true },
        });
      }, { isolationLevel: "Serializable" });

      // Log activity
      await logAdminAction({
        adminUserId: session.user.id,
        targetUserId: id,
        action: "ADMIN_USER_RESTORED",
        entityType: "User",
        entityId: id,
        details: {
          email: user.email,
          name: user.name,
        },
        ipAddress,
        userAgent,
      });

      // Log audit
      await logAudit({
        action: "USER_RESTORED",
        entityType: "User",
        entityId: id,
        userId: session.user.id,
        details: {
          email: user.email,
          name: user.name,
          restoredAt: new Date().toISOString(),
        },
      });

      log.info(
        { userId: id, email: user.email, adminId: session.user.id },
        "User restored"
      );

      return NextResponse.json({
        message: `Usuario ${user.email} restaurado correctamente`,
        user: { id, email: user.email, deletedAt: null },
      });
    } else {
      // Delete: set deletedAt = now and deactivate roles
      await prisma.$transaction(async (tx) => {
        // Update user
        await tx.user.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        // Deactivate user roles
        await tx.userRole.updateMany({
          where: { userId: id },
          data: { isActive: false },
        });

        // Deactivate merchants if exist
        if (user.ownedMerchants && user.ownedMerchants.length > 0) {
          await tx.merchant.updateMany({
            where: { ownerId: id },
            data: { isActive: false },
          });
        }

        // Deactivate driver if exists
        if (user.driver) {
          await tx.driver.update({
            where: { id: user.driver.id },
            data: { isActive: false },
          });
        }

        // Deactivate seller if exists
        if (user.sellerProfile) {
          await tx.sellerProfile.update({
            where: { id: user.sellerProfile.id },
            data: { isActive: false },
          });
        }
      }, { isolationLevel: "Serializable" });

      // Log activity
      await logAdminAction({
        adminUserId: session.user.id,
        targetUserId: id,
        action: "ADMIN_USER_DELETED",
        entityType: "User",
        entityId: id,
        details: {
          email: user.email,
          name: user.name,
          roles: user.roles.map((r) => r.role),
        },
        ipAddress,
        userAgent,
      });

      // Log audit
      await logAudit({
        action: "USER_DELETED",
        entityType: "User",
        entityId: id,
        userId: session.user.id,
        details: {
          email: user.email,
          name: user.name,
          roles: user.roles.map((r) => r.role),
          deletedAt: new Date().toISOString(),
          merchants: user.ownedMerchants?.map((m) => m.id) || [],
          driver: user.driver?.id || null,
          seller: user.sellerProfile?.id || null,
        },
      });

      log.info(
        {
          userId: id,
          email: user.email,
          adminId: session.user.id,
          roles: user.roles.map((r) => r.role),
        },
        "User soft-deleted"
      );

      return NextResponse.json({
        message: `Usuario ${user.email} eliminado correctamente`,
        user: { id, email: user.email, deletedAt: new Date().toISOString() },
      });
    }
  } catch (error) {
    log.error({ error }, "Error deleting user");
    return NextResponse.json(
      { error: "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}
