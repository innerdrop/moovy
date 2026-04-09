import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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
                        approvalStatus: true,
                        approvedAt: true,
                        rejectionReason: true,
                        commissionRate: true,
                        rating: true,
                        loyaltyTier: true,
                        category: true,
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
                        cuit: true,
                        licenciaUrl: true,
                        seguroUrl: true,
                        vtvUrl: true,
                        dniFrenteUrl: true,
                        dniDorsoUrl: true,
                        acceptedTermsAt: true,
                        isActive: true,
                        isOnline: true,
                        totalDeliveries: true,
                        rating: true,
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
        const allOrdersCount = await prisma.order.count({
            where: { userId: id, deletedAt: null },
        });

        const deliveredOrders = await prisma.order.aggregate({
            where: { userId: id, status: "DELIVERED", deletedAt: null },
            _sum: { total: true },
        });

        const stats = {
            totalOrders: allOrdersCount,
            totalSpent: deliveredOrders._sum.total || 0,
            memberSince: user.createdAt,
        };

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
            roles: user.roles,
            merchant: user.ownedMerchants.length > 0 ? user.ownedMerchants[0] : null,
            driver: user.driver,
            seller: user.sellerProfile,
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