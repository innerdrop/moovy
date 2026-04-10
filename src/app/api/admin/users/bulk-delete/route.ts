import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { logAdminAction, extractRequestInfo } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import logger from "@/lib/logger";

const log = logger.child({ context: "admin/users/bulk-delete" });

export async function POST(request: Request) {
  try {
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
    const { userIds } = body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs de usuarios" },
        { status: 400 }
      );
    }

    if (userIds.length > 50) {
      return NextResponse.json(
        { error: "Máximo 50 usuarios por solicitud" },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = extractRequestInfo(request);

    // Fetch all users to be deleted (for logging)
    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        roles: { select: { role: true } },
        ownedMerchants: { select: { id: true } },
        driver: { select: { id: true } },
        sellerProfile: { select: { id: true } },
      },
    });

    // Update all users in transaction
    await prisma.$transaction(async (tx) => {
      // Soft-delete users
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { deletedAt: new Date() },
      });

      // Deactivate all user roles
      await tx.userRole.updateMany({
        where: { userId: { in: userIds } },
        data: { isActive: false },
      });

      // Deactivate associated merchants
      await tx.merchant.updateMany({
        where: { ownerId: { in: userIds } },
        data: { isActive: false },
      });

      // Deactivate associated drivers
      await tx.driver.updateMany({
        where: { userId: { in: userIds } },
        data: { isActive: false },
      });

      // Deactivate associated sellers
      await tx.sellerProfile.updateMany({
        where: { userId: { in: userIds } },
        data: { isActive: false },
      });
    }, { isolationLevel: "Serializable" });

    // Log each deletion individually for audit trail
    for (const user of usersToDelete) {
      await logAdminAction({
        adminUserId: session.user.id,
        targetUserId: user.id,
        action: "ADMIN_USER_DELETED",
        entityType: "User",
        entityId: user.id,
        details: {
          email: user.email,
          name: user.name,
          roles: user.roles.map((r) => r.role),
          bulkOperation: true,
        },
        ipAddress,
        userAgent,
      });

      await logAudit({
        action: "USER_DELETED",
        entityType: "User",
        entityId: user.id,
        userId: session.user.id,
        details: {
          email: user.email,
          name: user.name,
          roles: user.roles.map((r) => r.role),
          bulkOperation: true,
          deletedAt: new Date().toISOString(),
        },
      });
    }

    log.info(
      {
        count: usersToDelete.length,
        userIds,
        adminId: session.user.id,
      },
      "Bulk user soft-delete completed"
    );

    return NextResponse.json({
      message: `${usersToDelete.length} usuarios eliminados correctamente`,
      deletedCount: usersToDelete.length,
      deletedUsers: usersToDelete.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
      })),
    });
  } catch (error) {
    log.error({ error }, "Error bulk-deleting users");
    return NextResponse.json(
      { error: "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}
