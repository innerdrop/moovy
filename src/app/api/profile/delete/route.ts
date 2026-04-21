// V-025 FIX: Account deletion endpoint (required by Google Play Store)
// POST /api/profile/delete
// Deletes all user data: orders (soft), addresses, favorites, push subs, roles, points, referrals
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { confirmEmail } = body;

        // Require email confirmation to prevent accidental deletion
        if (!confirmEmail || confirmEmail !== session.user.email) {
            return NextResponse.json(
                { error: "Confirmá tu email para eliminar la cuenta" },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Audit log BEFORE deletion
        await logAudit({
            action: "ACCOUNT_DELETION_REQUESTED",
            entityType: "user",
            entityId: userId,
            userId,
            details: {
                email: session.user.email,
                timestamp: new Date().toISOString(),
            },
        });

        // Delete user data in transaction
        // Regla (2026-04-21): cascada completa + anonimización del email.
        // A diferencia de admin delete, el self-delete SÍ libera el email
        // (deleted-${userId}@deleted.moovy.local) para que la persona pueda
        // volver a registrarse con ese email más adelante, obteniendo una
        // cuenta FRESCA (sin datos ni comercios viejos colgados). Esto evita
        // el bug de resurrección porque el email queda anonimizado ⇒ la próxima
        // registración no encuentra existingUser.
        const now = new Date();
        const selfDeleteReason = "Cuenta eliminada por el usuario";

        await prisma.$transaction(async (tx) => {
            // Delete push subscriptions
            await tx.pushSubscription.deleteMany({ where: { userId } });

            // Delete favorites
            await tx.favorite.deleteMany({ where: { userId } });

            // Delete referrals (as referrer and referee)
            await tx.referral.deleteMany({
                where: { OR: [{ referrerId: userId }, { refereeId: userId }] },
            });

            // Nota: ya no borramos UserRole. Los roles se derivan del dominio
            // (Merchant/Driver/SellerProfile) y se apagan solos porque el User
            // queda con deletedAt != null (ver src/lib/roles.ts#computeUserAccess,
            // que retorna null para usuarios soft-deleted).

            // Delete addresses
            await tx.address.deleteMany({ where: { userId } });

            // Soft-delete orders (keep for financial records)
            await tx.order.updateMany({
                where: { userId },
                data: { deletedAt: now },
            });

            // Anonymize user record (keep for referential integrity) + mark deleted
            await tx.user.update({
                where: { id: userId },
                data: {
                    name: "[Cuenta eliminada]",
                    email: `deleted-${userId}@deleted.moovy.local`,
                    phone: null,
                    password: "DELETED",
                    image: null,
                    pointsBalance: 0,
                    pendingBonusPoints: 0,
                    referralCode: `DEL-${userId.slice(0, 8)}`,
                    referredById: null,
                    resetToken: null,
                    resetTokenExpiry: null,
                    deletedAt: now,
                    isSuspended: true,
                    suspendedAt: now,
                    suspensionReason: selfDeleteReason,
                },
            });

            // Cascade Merchants (bug previo: profile/delete no tocaba comercios).
            // Si el usuario era dueño de comercios, quedaban APPROVED + APROBADOS
            // colgados de un User anonimizado. Acá los apagamos totalmente.
            await tx.merchant.updateMany({
                where: { ownerId: userId },
                data: {
                    isActive: false,
                    isOpen: false,
                    approvalStatus: "REJECTED",
                    rejectionReason: selfDeleteReason,
                    isSuspended: true,
                    suspendedAt: now,
                    suspensionReason: selfDeleteReason,
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

            // If user is a driver, deactivate + reject
            const driver = await tx.driver.findUnique({ where: { userId } });
            if (driver) {
                await tx.driver.update({
                    where: { userId },
                    data: {
                        isActive: false,
                        isOnline: false,
                        availabilityStatus: "FUERA_DE_SERVICIO",
                        approvalStatus: "REJECTED",
                        rejectionReason: selfDeleteReason,
                        isSuspended: true,
                        suspendedAt: now,
                        suspensionReason: selfDeleteReason,
                        latitude: null,
                        longitude: null,
                        cuit: null,
                    },
                });
            }

            // If user is a seller, deactivate profile + nullify fiscal data
            const seller = await tx.sellerProfile.findUnique({ where: { userId } });
            if (seller) {
                await tx.sellerProfile.update({
                    where: { userId },
                    data: {
                        displayName: "[Cuenta eliminada]",
                        bio: null,
                        isActive: false,
                        isOnline: false,
                        isSuspended: true,
                        suspendedAt: now,
                        suspensionReason: selfDeleteReason,
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
        });

        // Log account deletion activity (fire-and-forget)
        const { ipAddress, userAgent } = extractRequestInfo(request);
        logUserActivity({
            userId: session.user.id,
            action: ACTIVITY_ACTIONS.ACCOUNT_DELETED,
            entityType: "User",
            entityId: session.user.id,
            ipAddress,
            userAgent,
        }).catch((err) => console.error("[Delete] Failed to log account deletion activity:", err));

        return NextResponse.json({
            success: true,
            message: "Tu cuenta y datos personales han sido eliminados.",
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json(
            { error: "Error al eliminar la cuenta" },
            { status: 500 }
        );
    }
}
