import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

/**
 * GET /api/admin/users-unified/[id]
 *
 * Full user profile with ALL related data:
 * - User base fields
 * - roles: UserRole[]
 * - merchant: full Merchant object if exists
 * - driver: full Driver object if exists
 * - seller: full SellerProfile if exists
 * - addresses: all Address records
 * - recentOrders: last 5 orders
 * - pointsTransactions: last 10 transactions
 * - stats: { totalOrders, totalSpent, memberSince }
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await context.params;

        // Fetch complete user with all relations
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                // User base fields
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                pointsBalance: true,
                createdAt: true,
                deletedAt: true,
                referralCode: true,
                emailVerified: true,
                isSuspended: true,
                suspendedAt: true,
                suspendedUntil: true,
                suspensionReason: true,
                archivedAt: true,

                // User roles
                roles: {
                    select: {
                        id: true,
                        role: true,
                        isActive: true,
                        activatedAt: true,
                    },
                },

                // Merchant (first owned merchant - typically one per user)
                ownedMerchants: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        image: true,
                        banner: true,
                        isActive: true,
                        isOpen: true,
                        email: true,
                        phone: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        deliveryRadiusKm: true,
                        minOrderAmount: true,
                        allowPickup: true,
                        isSuspended: true,
                        suspendedAt: true,
                        suspendedUntil: true,
                        suspensionReason: true,
                        approvalStatus: true,
                        approvedAt: true,
                        rejectionReason: true,
                        commissionRate: true,
                        commissionOverride: true,
                        commissionOverrideReason: true,
                        rating: true,
                        loyaltyTier: true,
                        loyaltyTierLocked: true,
                        category: true,
                        // Documentos y datos fiscales — eran invisibles en OPS
                        // antes de fix/onboarding-comercio-completo porque este
                        // select los omitía, generando "Sin cargar" falso.
                        cuit: true,
                        bankAccount: true,
                        constanciaAfipUrl: true,
                        habilitacionMunicipalUrl: true,
                        registroSanitarioUrl: true,
                        // Estado de aprobación por documento (granular)
                        cuitStatus: true,
                        cuitApprovedAt: true,
                        cuitRejectionReason: true,
                        // Origen + nota de la aprobación (rama ops-upload-logo-merchant).
                        // Cuando admin aprueba PHYSICAL desde OPS, escribe acá la nota.
                        // Sin esto la UI no puede mostrar la caja amarilla con la nota
                        // y el merchant no ve "Aprobado por administrador".
                        cuitApprovalSource: true,
                        cuitApprovalNote: true,
                        bankAccountStatus: true,
                        bankAccountApprovedAt: true,
                        bankAccountRejectionReason: true,
                        bankAccountApprovalSource: true,
                        bankAccountApprovalNote: true,
                        constanciaAfipStatus: true,
                        constanciaAfipApprovedAt: true,
                        constanciaAfipRejectionReason: true,
                        constanciaAfipApprovalSource: true,
                        constanciaAfipApprovalNote: true,
                        habilitacionMunicipalStatus: true,
                        habilitacionMunicipalApprovedAt: true,
                        habilitacionMunicipalRejectionReason: true,
                        habilitacionMunicipalApprovalSource: true,
                        habilitacionMunicipalApprovalNote: true,
                        registroSanitarioStatus: true,
                        registroSanitarioApprovedAt: true,
                        registroSanitarioRejectionReason: true,
                        registroSanitarioApprovalSource: true,
                        registroSanitarioApprovalNote: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                orders: true,
                                products: true,
                            },
                        },
                    },
                    take: 1, // Get first merchant (typically only one)
                },

                // Driver (one-to-one optional)
                driver: {
                    select: {
                        id: true,
                        vehicleType: true,
                        vehicleBrand: true,
                        vehicleModel: true,
                        vehicleYear: true,
                        vehicleColor: true,
                        licensePlate: true,
                        // Docs (texto + URLs)
                        cuit: true,
                        constanciaCuitUrl: true,
                        dniFrenteUrl: true,
                        dniDorsoUrl: true,
                        licenciaUrl: true,
                        seguroUrl: true,
                        vtvUrl: true,
                        cedulaVerdeUrl: true,
                        // Status/approvedAt/rejectionReason triples (8 docs)
                        cuitStatus: true,
                        cuitApprovedAt: true,
                        cuitRejectionReason: true,
                        constanciaCuitStatus: true,
                        constanciaCuitApprovedAt: true,
                        constanciaCuitRejectionReason: true,
                        dniFrenteStatus: true,
                        dniFrenteApprovedAt: true,
                        dniFrenteRejectionReason: true,
                        dniDorsoStatus: true,
                        dniDorsoApprovedAt: true,
                        dniDorsoRejectionReason: true,
                        licenciaStatus: true,
                        licenciaApprovedAt: true,
                        licenciaRejectionReason: true,
                        seguroStatus: true,
                        seguroApprovedAt: true,
                        seguroRejectionReason: true,
                        vtvStatus: true,
                        vtvApprovedAt: true,
                        vtvRejectionReason: true,
                        cedulaVerdeStatus: true,
                        cedulaVerdeApprovedAt: true,
                        cedulaVerdeRejectionReason: true,
                        // Vencimientos + stage de notificación (4 docs)
                        licenciaExpiresAt: true,
                        licenciaNotifiedStage: true,
                        seguroExpiresAt: true,
                        seguroNotifiedStage: true,
                        vtvExpiresAt: true,
                        vtvNotifiedStage: true,
                        cedulaVerdeExpiresAt: true,
                        cedulaVerdeNotifiedStage: true,
                        acceptedTermsAt: true,
                        isActive: true,
                        isOnline: true,
                        totalDeliveries: true,
                        rating: true,
                        isSuspended: true,
                        suspendedAt: true,
                        suspendedUntil: true,
                        suspensionReason: true,
                        approvalStatus: true,
                        approvedAt: true,
                        rejectionReason: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },

                // Seller Profile (one-to-one optional)
                sellerProfile: {
                    select: {
                        id: true,
                        displayName: true,
                        bio: true,
                        avatar: true,
                        cuit: true,
                        acceptedTermsAt: true,
                        isActive: true,
                        isVerified: true,
                        totalSales: true,
                        rating: true,
                        isSuspended: true,
                        suspendedAt: true,
                        suspendedUntil: true,
                        suspensionReason: true,
                        commissionRate: true,
                        mpLinkedAt: true,
                        isOnline: true,
                        isPaused: true,
                        pauseEndsAt: true,
                        preparationMinutes: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                listings: true,
                            },
                        },
                    },
                },

                // Addresses
                addresses: {
                    select: {
                        id: true,
                        label: true,
                        street: true,
                        number: true,
                        apartment: true,
                        neighborhood: true,
                        city: true,
                        province: true,
                        zipCode: true,
                        latitude: true,
                        longitude: true,
                        isDefault: true,
                        createdAt: true,
                    },
                },

                // Recent orders (last 5)
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                        paymentStatus: true,
                        createdAt: true,
                        deliveredAt: true,
                        merchant: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },

                // Points transactions (last 10)
                pointsTransactions: {
                    select: {
                        id: true,
                        amount: true,
                        type: true,
                        description: true,
                        balanceAfter: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        // Compute stats
        // - totalSpent: SOLO pedidos DELIVERED. Es el LTV real del cliente.
        //   Mostramos este número como "Total gastado" en la UI (lo que ya se cobró).
        // - openOrdersValue: pedidos activos (no DELIVERED, no CANCELLED, no REFUNDED).
        //   Permite a OPS ver actividad en curso sin mezclarla con el LTV consolidado.
        const allOrdersCount = await prisma.order.count({
            where: { userId: id, deletedAt: null },
        });

        const deliveredOrders = await prisma.order.aggregate({
            where: { userId: id, status: "DELIVERED", deletedAt: null },
            _sum: { total: true },
        });

        const openOrders = await prisma.order.aggregate({
            where: {
                userId: id,
                deletedAt: null,
                status: { notIn: ["DELIVERED", "CANCELLED"] },
                paymentStatus: { not: "REFUNDED" },
            },
            _sum: { total: true },
            _count: true,
        });

        const stats = {
            totalOrders: allOrdersCount,
            totalSpent: deliveredOrders._sum.total || 0,
            openOrdersValue: openOrders._sum.total || 0,
            openOrdersCount: openOrders._count || 0,
            memberSince: user.createdAt,
        };

        // Decrypt fiscal data for OPS display. `decrypt()` is safe para plaintext
        // (devuelve el valor original si no está cifrado) — ver src/lib/encryption.ts.
        const rawMerchant = user.ownedMerchants.length > 0 ? user.ownedMerchants[0] : null;
        const merchant = rawMerchant
            ? {
                  ...rawMerchant,
                  cuit: rawMerchant.cuit ? decrypt(rawMerchant.cuit) : null,
                  bankAccount: rawMerchant.bankAccount ? decrypt(rawMerchant.bankAccount) : null,
              }
            : null;

        const rawDriver = user.driver;
        const driver = rawDriver
            ? {
                  ...rawDriver,
                  cuit: rawDriver.cuit ? decrypt(rawDriver.cuit) : null,
              }
            : null;

        const rawSeller = user.sellerProfile;
        const seller = rawSeller
            ? {
                  ...rawSeller,
                  cuit: rawSeller.cuit ? decrypt(rawSeller.cuit) : null,
              }
            : null;

        // Format response
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            pointsBalance: user.pointsBalance,
            createdAt: user.createdAt,
            deletedAt: user.deletedAt,
            referralCode: user.referralCode,
            emailVerified: user.emailVerified,
            isSuspended: user.isSuspended,
            suspendedAt: user.suspendedAt,
            suspendedUntil: user.suspendedUntil,
            suspensionReason: user.suspensionReason,
            archivedAt: user.archivedAt,
            roles: user.roles,
            merchant,
            driver,
            seller,
            addresses: user.addresses,
            recentOrders: user.orders,
            pointsTransactions: user.pointsTransactions,
            stats,
        });
    } catch (error) {
        console.error("Error fetching user detail:", error);
        return NextResponse.json(
            { error: "Error al obtener detalle del usuario" },
            { status: 500 }
        );
    }
}