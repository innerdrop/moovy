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
        await prisma.$transaction(async (tx) => {
            // Delete push subscriptions
            await tx.pushSubscription.deleteMany({ where: { userId } });

            // Delete favorites
            await tx.favorite.deleteMany({ where: { userId } });

            // Delete referrals (as referrer and referee)
            await tx.referral.deleteMany({
                where: { OR: [{ referrerId: userId }, { refereeId: userId }] },
            });

            // Delete user roles
            await tx.userRole.deleteMany({ where: { userId } });

            // Delete addresses
            await tx.address.deleteMany({ where: { userId } });

            // Soft-delete orders (keep for financial records)
            await tx.order.updateMany({
                where: { userId },
                data: { deletedAt: new Date() },
            });

            // Anonymize user record (keep for referential integrity)
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
                },
            });

            // If user is a driver, deactivate
            const driver = await tx.driver.findUnique({ where: { userId } });
            if (driver) {
                await tx.driver.update({
                    where: { userId },
                    data: {
                        availabilityStatus: "OFFLINE",
                        latitude: null,
                        longitude: null,
                        cuit: null,
                    },
                });
            }

            // If user is a seller, deactivate profile
            const seller = await tx.sellerProfile.findUnique({ where: { userId } });
            if (seller) {
                await tx.sellerProfile.update({
                    where: { userId },
                    data: {
                        displayName: "[Cuenta eliminada]",
                        bio: null,
                        isActive: false,
                        cuit: null,
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
