import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAdminAction, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";

const adminLogger = logger.child({ context: "admin/archive-user" });

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
    const { unarchive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // Check that user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, archivedAt: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = extractRequestInfo(request);

    if (unarchive) {
      // Unarchive
      await prisma.user.update({
        where: { id },
        data: {
          archivedAt: null,
        },
      });

      // Log admin action
      await logAdminAction({
        adminUserId: session.user.id,
        targetUserId: id,
        action: ACTIVITY_ACTIONS.ADMIN_UNARCHIVED,
        entityType: "User",
        entityId: id,
        details: {},
        ipAddress,
        userAgent,
      });

      // Log audit
      await logAudit({
        action: "USER_UNARCHIVED",
        entityType: "User",
        entityId: id,
        userId: session.user.id,
        details: {},
      });

      adminLogger.info(
        { userId: id, adminId: session.user.id },
        "Usuario desarchivado"
      );

      return NextResponse.json({
        success: true,
        message: `Usuario ${id} desarchivado exitosamente`,
        archived: false,
      });
    } else {
      // Archive
      const now = new Date();

      await prisma.user.update({
        where: { id },
        data: {
          archivedAt: now,
        },
      });

      // Log admin action
      await logAdminAction({
        adminUserId: session.user.id,
        targetUserId: id,
        action: ACTIVITY_ACTIONS.ADMIN_ARCHIVED,
        entityType: "User",
        entityId: id,
        details: {},
        ipAddress,
        userAgent,
      });

      // Log audit
      await logAudit({
        action: "USER_ARCHIVED",
        entityType: "User",
        entityId: id,
        userId: session.user.id,
        details: {},
      });

      adminLogger.info(
        { userId: id, adminId: session.user.id },
        "Usuario archivado"
      );

      return NextResponse.json({
        success: true,
        message: `Usuario ${id} archivado exitosamente`,
        archived: true,
      });
    }
  } catch (error) {
    adminLogger.error({ error }, "Error al cambiar estado de archivo");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
