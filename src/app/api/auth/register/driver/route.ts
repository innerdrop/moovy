// API Route: Driver Registration
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        console.log("[Register Driver] Received:", data.firstName, data.lastName);

        // Validate required fields
        if (!data.email || !data.password || !data.firstName || !data.licensePlate) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Ya existe una cuenta con ese email" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        // Create User + Driver in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Create User
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: fullName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: 'DRIVER',
                }
            });

            // 2. Create Driver details
            await tx.driver.create({
                data: {
                    userId: newUser.id,
                    vehicleType: data.vehicleType || "AUTO",
                    vehicleBrand: data.vehicleBrand,
                    vehicleModel: data.vehicleModel,
                    vehicleYear: data.vehicleYear ? parseInt(data.vehicleYear.toString()) : undefined,
                    vehicleColor: data.vehicleColor,
                    licensePlate: data.licensePlate.toUpperCase(),
                    isActive: false, // Pending approval
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: "Solicitud enviada exitosamente"
        });

    } catch (error: any) {
        console.error("[Register Driver] Error:", error);
        return NextResponse.json(
            { error: `Error al registrar: ${error.message}` },
            { status: 500 }
        );
    }
}
