import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users-unified/counts
 *
 * Returns user counts per tab for the unified users panel.
 */
export async function GET() {
    try {
        const session = await auth();

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Total (excluding soft-deleted)
        const todos = await prisma.user.count({
            where: { deletedAt: null },
        });

        // Pending: has a Driver or Merchant with approvalStatus PENDING
        const pendientes = await prisma.user.count({
            where: {
                deletedAt: null,
                OR: [
                    { driver: { approvalStatus: "PENDING" } },
                    { ownedMerchants: { some: { approvalStatus: "PENDING" } } },
                ],
            },
        });

        // By role (active UserRole)
        const comercios = await prisma.user.count({
            where: {
                deletedAt: null,
                roles: { some: { role: "COMERCIO", isActive: true } },
            },
        });

        const repartidores = await prisma.user.count({
            where: {
                deletedAt: null,
                roles: { some: { role: "DRIVER", isActive: true } },
            },
        });

        const vendedores = await prisma.user.count({
            where: {
                deletedAt: null,
                roles: { some: { role: "SELLER", isActive: true } },
            },
        });

        // Clientes: has USER role active and no other active role
        const clientes = await prisma.user.count({
            where: {
                deletedAt: null,
                roles: { some: { role: "USER", isActive: true } },
                NOT: {
                    roles: {
                        some: {
                            role: { in: ["COMERCIO", "DRIVER", "SELLER", "ADMIN"] },
                            isActive: true,
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            todos,
            pendientes,
            comercios,
            repartidores,
            vendedores,
            clientes,
        });
    } catch (error) {
        console.error("Error fetching user counts:", error);
        return NextResponse.json(
            { error: "Error al obtener contadores" },
            { status: 500 }
        );
    }
}