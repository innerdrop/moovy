// API Route: Single Driver Operations
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single driver
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true },
                },
                orders: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        address: true,
                    },
                },
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Error fetching driver:", error);
        return NextResponse.json({ error: "Error al obtener repartidor" }, { status: 500 });
    }
}

// PATCH - Update driver
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const data = await request.json();

        const updateData: any = {};
        if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType;
        if (data.licensePlate !== undefined) updateData.licensePlate = data.licensePlate;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;

        const driver = await prisma.driver.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true },
                },
            },
        });

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Error updating driver:", error);
        return NextResponse.json({ error: "Error al actualizar repartidor" }, { status: 500 });
    }
}

// DELETE - Remove driver status (demote to regular user)
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        // Check for active orders
        const activeOrders = await prisma.order.count({
            where: {
                driverId: id,
                status: { in: ["IN_DELIVERY"] },
            },
        });

        if (activeOrders > 0) {
            return NextResponse.json(
                { error: "No se puede eliminar: tiene pedidos en curso" },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            // Remove driver record
            await tx.driver.delete({ where: { id } });

            // Demote user back to regular user
            await tx.user.update({
                where: { id: driver.userId },
                data: { role: "USER" },
            });
        });

        return NextResponse.json({ success: true, message: "Repartidor eliminado" });
    } catch (error) {
        console.error("Error deleting driver:", error);
        return NextResponse.json({ error: "Error al eliminar repartidor" }, { status: 500 });
    }
}
