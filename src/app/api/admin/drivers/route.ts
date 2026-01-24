// API Route: Drivers CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

// POST - Create new driver with new user account
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { name, email, phone, password, vehicleType, licensePlate } = data;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and driver in transaction
        const driver = await prisma.$transaction(async (tx) => {
            // Create user with DRIVER role
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone: phone || null,
                    password: hashedPassword,
                    role: "DRIVER",
                },
            });

            // Create driver record
            return tx.driver.create({
                data: {
                    userId: user.id,
                    vehicleType: vehicleType || "MOTO",
                    licensePlate: licensePlate || null,
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


