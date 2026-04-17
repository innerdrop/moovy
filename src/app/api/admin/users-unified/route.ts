import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users-unified
 *
 * Unified users panel: returns ALL users with their roles and related entities
 * (merchant, driver, seller profile).
 *
 * Query parameters:
 * - search: filter by name, email, or phone (case-insensitive contains)
 * - role: filter by UserRoleType (USER, ADMIN, COMERCIO, DRIVER, SELLER)
 * - status: "active", "pending", "rejected", "inactive", "suspended", "archived"
 * - page: default 1
 * - limit: default 20
 * - sortBy: default "createdAt"
 * - sortOrder: default "desc"
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);

        // Parse pagination
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));
        const skip = (page - 1) * limit;

        // Parse sorting
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

        // Parse filters
        const search = searchParams.get("search");
        const roleFilter = searchParams.get("role");
        const statusFilter = searchParams.get("status");

        // Build where clause for filtering
        const where: any = {
            deletedAt: null, // Exclude soft-deleted users by default
        };

        // Search filter (name, email, phone)
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        // Status filter
        if (statusFilter) {
            if (statusFilter === "active") {
                // Not suspended, not archived, not soft-deleted
                where.AND = [
                    { isSuspended: false },
                    { archivedAt: null },
                    { deletedAt: null },
                ];
            } else if (statusFilter === "suspended") {
                // isSuspended = true
                where.isSuspended = true;
            } else if (statusFilter === "archived") {
                // archivedAt is not null
                where.archivedAt = { not: null };
            } else if (statusFilter === "pending") {
                // Has a Driver with PENDING approval OR Merchant with PENDING approval
                where.OR = [
                    { driver: { approvalStatus: "PENDING" } },
                    { ownedMerchants: { some: { approvalStatus: "PENDING" } } },
                ];
            } else if (statusFilter === "rejected") {
                // Has a Driver with REJECTED approval OR Merchant with REJECTED approval
                where.OR = [
                    { driver: { approvalStatus: "REJECTED" } },
                    { ownedMerchants: { some: { approvalStatus: "REJECTED" } } },
                ];
            } else if (statusFilter === "inactive") {
                // Soft-deleted OR all roles inactive
                where.OR = [
                    { deletedAt: { not: null } },
                    { roles: { every: { isActive: false } } },
                ];
            }
        }

        // Fetch total count for pagination
        const total = await prisma.user.count({ where });
        const totalPages = Math.ceil(total / limit);

        // Main query
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                role: true, // legacy field
                pointsBalance: true,
                createdAt: true,
                deletedAt: true,
                isSuspended: true,
                archivedAt: true,
                roles: {
                    select: {
                        role: true,
                        isActive: true,
                    },
                },
                ownedMerchants: {
                    select: {
                        id: true,
                        name: true,
                        approvalStatus: true,
                        isActive: true,
                        loyaltyTier: true,
                    },
                    take: 1, // User typically owns 1 merchant, but schema allows multiple
                },
                driver: {
                    select: {
                        id: true,
                        approvalStatus: true,
                        isActive: true,
                        isOnline: true,
                        vehicleType: true,
                        totalDeliveries: true,
                        rating: true,
                    },
                },
                sellerProfile: {
                    select: {
                        id: true,
                        displayName: true,
                        isActive: true,
                        isVerified: true,
                        totalSales: true,
                        rating: true,
                    },
                },
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        });

        // Apply role filter after fetching (Prisma doesn't allow filtering within relations easily)
        let filteredUsers = users;
        if (roleFilter) {
            filteredUsers = users.filter((u) =>
                u.roles.some((ur) => ur.role === roleFilter && ur.isActive)
            );
        }

        // Format response
        const formattedUsers = filteredUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            pointsBalance: user.pointsBalance,
            createdAt: user.createdAt,
            deletedAt: user.deletedAt,
            isSuspended: user.isSuspended,
            archivedAt: user.archivedAt,
            roles: user.roles,
            merchant: user.ownedMerchants.length > 0 ? user.ownedMerchants[0] : null,
            driver: user.driver,
            seller: user.sellerProfile,
        }));

        return NextResponse.json({
            users: formattedUsers,
            total,
            page,
            limit,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching unified users:", error);
        return NextResponse.json(
            { error: "Error al obtener usuarios" },
            { status: 500 }
        );
    }
}
