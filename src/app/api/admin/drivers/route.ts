// API Route: Drivers CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all drivers
export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const drivers = await prisma.driver.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                _count: {
                    select: { orders: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(drivers);
    } catch (error) {
        console.error("Error fetching drivers:", error);
        return NextResponse.json({ error: "Error al obtener repartidores" }, { status: 500 });
    }
}

// POST - Create new driver (promote existing user to driver)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Check if already a driver
        const existingDriver = await prisma.driver.findUnique({
            where: { userId: data.userId },
        });

        if (existingDriver) {
            return NextResponse.json({ error: "El usuario ya es repartidor" }, { status: 400 });
        }

        // Create driver and update user role
        const driver = await prisma.$transaction(async (tx) => {
            // Update user role
            await tx.user.update({
                where: { id: data.userId },
                data: { role: "DRIVER" },
            });

            // Create driver record
            return tx.driver.create({
                data: {
                    userId: data.userId,
                    vehicleType: data.vehicleType || "MOTO",
                    licensePlate: data.licensePlate || null,
                    isActive: true,
                    isOnline: false,
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, phone: true },
                    },
                },
            });
        });

        return NextResponse.json(driver, { status: 201 });
    } catch (error) {
        console.error("Error creating driver:", error);
        return NextResponse.json({ error: "Error al crear repartidor" }, { status: 500 });
    }
}

