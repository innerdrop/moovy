// Ley 25.326 Art. 14 (Acceso) + Art. 19 bis (Portabilidad) + AAIP
// GET /api/profile/export-data → devuelve un archivo JSON con TODOS los datos
// personales del usuario autenticado, en formato estructurado y portable.
// Es el derecho de "portabilidad" que exige la autoridad: el usuario puede
// pedir todos sus datos y llevárselos a otra plataforma.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
    // Rate limit estricto: este endpoint hace muchas queries, y no debería
    // poder spamearse. 3 requests por 10 minutos es más que suficiente.
    const rateLimited = await applyRateLimit(request, "profile:export", 3, 600_000);
    if (rateLimited) return rateLimited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = session.user.id;

        // Datos personales del User (excluyendo password/tokens/resetToken)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                emailVerified: true,
                pointsBalance: true,
                pendingBonusPoints: true,
                bonusActivated: true,
                referralCode: true,
                referredById: true,
                createdAt: true,
                updatedAt: true,
                privacyConsentAt: true,
                privacyConsentVersion: true,
                termsConsentAt: true,
                termsConsentVersion: true,
                age18Confirmed: true,
                marketingConsent: true,
                marketingConsentAt: true,
                marketingConsentRevokedAt: true,
                cookiesConsent: true,
                cookiesConsentAt: true,
                onboardingCompletedAt: true,
                deletedAt: true,
                isSuspended: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Queries paralelas — todos los datos propios del usuario
        const [
            addresses,
            orders,
            pointsTransactions,
            favorites,
            pushSubscriptions,
            referralsMade,
            consentLogs,
            driver,
            ownedMerchants,
            sellerProfile,
        ] = await Promise.all([
            prisma.address.findMany({ where: { userId } }),
            prisma.order.findMany({
                where: { userId },
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    deliveryStatus: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    subtotal: true,
                    deliveryFee: true,
                    discount: true,
                    pointsUsed: true,
                    pointsEarned: true,
                    total: true,
                    deliveryNotes: true,
                    customerNotes: true,
                    createdAt: true,
                    deliveredAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.pointsTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            }),
            prisma.favorite.findMany({ where: { userId } }),
            prisma.pushSubscription.findMany({
                where: { userId },
                select: { id: true, endpoint: true, createdAt: true },
            }),
            prisma.referral.findMany({
                where: { referrerId: userId },
                select: {
                    id: true,
                    refereeId: true,
                    codeUsed: true,
                    status: true,
                    createdAt: true,
                    referrerPoints: true,
                    refereePoints: true,
                },
            }),
            prisma.consentLog.findMany({
                where: { userId },
                orderBy: { acceptedAt: "desc" },
            }),
            prisma.driver.findUnique({
                where: { userId },
                select: {
                    id: true,
                    vehicleType: true,
                    licensePlate: true,
                    isActive: true,
                    isOnline: true,
                    totalDeliveries: true,
                    rating: true,
                    createdAt: true,
                    acceptedTermsAt: true,
                    acceptedPrivacyAt: true,
                    approvalStatus: true,
                },
            }),
            prisma.merchant.findMany({
                where: { ownerId: userId },
                select: {
                    id: true,
                    businessName: true,
                    slug: true,
                    category: true,
                    address: true,
                    approvalStatus: true,
                    isActive: true,
                    createdAt: true,
                    acceptedTermsAt: true,
                    acceptedPrivacyAt: true,
                },
            }),
            prisma.sellerProfile.findUnique({
                where: { userId },
                select: {
                    id: true,
                    displayName: true,
                    bio: true,
                    isActive: true,
                    isVerified: true,
                    totalSales: true,
                    rating: true,
                    createdAt: true,
                    acceptedTermsAt: true,
                    acceptedPrivacyAt: true,
                },
            }),
        ]);

        // Ensamblar paquete. Objetivo: legibilidad humana + formato portable.
        const exportPayload = {
            meta: {
                exportedAt: new Date().toISOString(),
                basadoEn: "Ley 25.326 Art. 14 y Art. 19 bis — Derecho de Acceso y Portabilidad",
                formato: "JSON estructurado",
                titular: user.email,
                nota: "Este archivo contiene todos los datos personales asociados a tu cuenta MOOVY. Podés usarlo para ejercer tu derecho de portabilidad ante cualquier servicio similar. No contiene contraseñas ni tokens de acceso.",
            },
            datosPersonales: user,
            direcciones: addresses,
            pedidos: orders,
            transaccionesDePuntos: pointsTransactions,
            favoritos: favorites,
            suscripcionesPush: pushSubscriptions,
            referidos: referralsMade,
            consentimientos: consentLogs,
            perfilRepartidor: driver,
            comerciosPropios: ownedMerchants,
            perfilVendedor: sellerProfile,
        };

        // Audit log — exportación de datos es operación sensible
        await logAudit({
            action: "USER_DATA_EXPORTED",
            entityType: "user",
            entityId: userId,
            userId,
            details: {
                email: user.email,
                timestamp: new Date().toISOString(),
            },
        });

        const filename = `moovy-datos-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;

        return new NextResponse(JSON.stringify(exportPayload, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (error) {
        logger.error({ error }, "profile export-data error");
        return NextResponse.json(
            { error: "Error al exportar tus datos. Volvé a intentar." },
            { status: 500 }
        );
    }
}
