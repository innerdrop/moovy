import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update driver profile (email/phone only)
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        const { email, phone, image } = body;

        // Check if user is a driver
        const driver = await prisma.driver.findUnique({
            where: { userId }
        });

        if (!driver) {
            return NextResponse.json({ error: "No eres repartidor" }, { status: 403 });
        }

        // Validate email if changing
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email,
                    id: { not: userId }
                }
            });
            if (existingEmail) {
                return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(email && { email }),
                ...(phone !== undefined && { phone: phone || null }),
                ...(image !== undefined && { image: image || null })
            },
            select: { id: true }
        });

        // Update driver specific fields
        const { vehicleType, vehicleModel, vehiclePlate } = body;
        const updatedDriver = await prisma.driver.update({
            where: { userId },
            data: {
                ...(vehicleType && { vehicleType }),
                ...(vehicleModel && { vehicleModel }),
                ...(vehiclePlate && { vehiclePlate }),
            }
        });

        return NextResponse.json({ ...updatedUser, ...updatedDriver });
    } catch (error) {
        console.error("Error updating driver profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// GET - Get driver profile and stats
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const driver = await prisma.driver.findUnique({
            where: { userId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, image: true }
                },
                _count: { select: { orders: true } }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: "No eres repartidor" }, { status: 404 });
        }

        return NextResponse.json({
            ...driver,
            totalDeliveries: driver._count.orders
        });
    } catch (error) {
        console.error("Error fetching driver profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
