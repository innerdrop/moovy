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
      // Restore: set deletedAt = null. Ya no tocamos UserRole porque los roles
      // COMERCIO/DRIVER/SELLER se derivan del estado del Merchant/Driver/SellerProfile
      // en cada request. El rol USER sale del campo legacy User.role.
      await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });

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
      // Derived role list for logging (no UserRole query needed).
      const derivedRoles: string[] = ["USER"];
      if (user.ownedMerchants?.length) derivedRoles.push("COMERCIO");
      if (user.driver) derivedRoles.push("DRIVER");
      if (user.sellerProfile) derivedRoles.push("SELLER");

      // Delete: set deletedAt = now + cascade a domain objects.
      // (UserRole ya no se toca; los roles derivados se apagan solos vía deletedAt).
      //
      // Regla (2026-04-21): cascada completa para evitar bug de resurrección.
      // El admin delete NO anonimiza el email del User (a diferencia de profile/delete)
      // — mantiene el email en la DB para que el registro futuro con ese email
      // sea rechazado con 410 "cuenta eliminada, escribinos a soporte". Esto es
      // intencional: admin delete = cuenta "quemada" (fraude/abuso/etc). Si el
      // admin decide restaurar, el restore trae la cuenta y sus datos de vuelta.
      // El usuario que quiera volver usando el mismo email necesita intervención
      // humana (lo cual es correcto para casos sensibles).
      //
      // Para Merchant/Driver/SellerProfile sí "apagamos" datos sensibles (cuit,
      // cbu, mpAccessToken) porque ya no deben ser operativos. La estructura
      // queda para auditoría/integridad referencial (órdenes históricas, etc.).
      const now = new Date();
      const cascadeReason = "Cuenta eliminada por administrador";

      await prisma.$transaction(async (tx) => {
        // Update user (NO anonimizar email — ver comentario arriba)
        await tx.user.update({
          where: { id },
          data: { deletedAt: now },
        });

        // Cascade Merchants: deactivate + reject approval + anonymize fiscal data
        if (user.ownedMerchants && user.ownedMerchants.length > 0) {
          await tx.merchant.updateMany({
            where: { ownerId: id },
            data: {
              isActive: false,
              isOpen: false,
              approvalStatus: "REJECTED",
              rejectionReason: cascadeReason,
              isSuspended: true,
              suspendedAt: now,
              suspensionReason: cascadeReason,
              // Null out sensitive/operational fiscal data
              cuit: null,
              cuil: null,
              bankAccount: null,
              ownerDni: null,
              mpAccessToken: null,
              mpRefreshToken: null,
              mpUserId: null,
              mpEmail: null,
            },
          });
        }

        // Cascade Driver: same pattern
        if (user.driver) {
          await tx.driver.update({
            where: { id: user.driver.id },
            data: {
              isActive: false,
              isOnline: false,
              availabilityStatus: "FUERA_DE_SERVICIO",
              approvalStatus: "REJECTED",
              rejectionReason: cascadeReason,
              isSuspended: true,
              suspendedAt: now,
              suspensionReason: cascadeReason,
              // Null out sensitive data
              cuit: null,
              latitude: null,
              longitude: null,
            },
          });
        }

        // Cascade SellerProfile: same pattern
        if (user.sellerProfile) {
          await tx.sellerProfile.update({
            where: { id: user.sellerProfile.id },
            data: {
              isActive: false,
              isOnline: false,
              isSuspended: true,
              suspendedAt: now,
              suspensionReason: cascadeReason,
              displayName: "[Cuenta eliminada]",
              bio: null,
              // Null out sensitive data
              cuit: null,
              bankAlias: null,
              bankCbu: null,
              mpAccessToken: null,
              mpRefreshToken: null,
              mpUserId: null,
              mpEmail: null,
            },
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
          roles: derivedRoles,
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
          roles: derivedRoles,
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
          roles: derivedRoles,
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
