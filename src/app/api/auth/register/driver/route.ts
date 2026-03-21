// API Route: Driver Registration
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { applyRateLimit } from "@/lib/rate-limit";
import { encryptDriverData } from "@/lib/fiscal-crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    // Rate limit: max 5 registrations per 15 minutes per IP
    const limited = applyRateLimit(request, "auth:register:driver", 5, 15 * 60_000);
    if (limited) return limited;

    try {
        const data = await request.json();
        console.log("[Register Driver] Received:", data.firstName, data.lastName);

        // Validate required fields
        if (!data.email || !data.password || !data.firstName || !data.vehicleType) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios" },
                { status: 400 }
            );
        }

        // Validate motorized vehicle requires license plate
        const motorizedTypes = ["moto", "auto", "camioneta"];
        const isMotorized = motorizedTypes.includes(data.vehicleType);
        if (isMotorized && !data.licensePlate) {
            return NextResponse.json(
                { error: "La patente es obligatoria para vehículos motorizados" },
                { status: 400 }
            );
        }

        // Validate legal acceptance
        if (!data.acceptTerms || !data.acceptPrivacy) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Repartidores y la Política de Privacidad" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                roles: { where: { isActive: true }, select: { role: true } },
                driver: { select: { id: true } },
            }
        });

        // If user exists AND already has a driver profile, reject
        if (existingUser?.driver) {
            return NextResponse.json(
                { error: "Ya tenés una cuenta de repartidor con ese email" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        // Driver data (shared between both paths)
        let driverData = {
            vehicleType: data.vehicleType.toUpperCase(),
            vehicleBrand: isMotorized ? data.vehicleBrand : null,
            vehicleModel: isMotorized ? data.vehicleModel : null,
            vehicleYear: isMotorized && data.vehicleYear ? parseInt(data.vehicleYear.toString()) : null,
            vehicleColor: isMotorized ? data.vehicleColor : null,
            licensePlate: isMotorized ? data.licensePlate.toUpperCase() : null,
            cuit: data.cuit || null,
            dniFrenteUrl: data.dniFrenteUrl || null,
            dniDorsoUrl: data.dniDorsoUrl || null,
            licenciaUrl: isMotorized ? (data.licenciaUrl || null) : null,
            seguroUrl: isMotorized ? (data.seguroUrl || null) : null,
            vtvUrl: isMotorized ? (data.vtvUrl || null) : null,
            acceptedTermsAt: data.acceptTerms ? new Date() : null,
            isActive: false,
        };

        // Encrypt sensitive fiscal data before saving
        driverData = encryptDriverData(driverData);

        await prisma.$transaction(async (tx) => {
            if (existingUser) {
                // --- PATH A: User already exists (has a store/merchant account) ---
                // Add DRIVER role if not already present
                const hasDriverRole = existingUser.roles.some((r: { role: string }) => r.role === "DRIVER");
                if (!hasDriverRole) {
                    await tx.userRole.create({
                        data: { userId: existingUser.id, role: "DRIVER", isActive: true }
                    });
                }

                // Create Driver linked to existing user
                await tx.driver.create({
                    data: { ...driverData, userId: existingUser.id }
                });
            } else {
                // --- PATH B: Brand new user ---
                // 1. Create User with legacy role USER (base account)
                const newUser = await tx.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        name: fullName,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone,
                        role: 'USER',
                    }
                });

                // 2. Create UserRole entries: USER (base) + DRIVER
                await tx.userRole.createMany({
                    data: [
                        { userId: newUser.id, role: "USER", isActive: true },
                        { userId: newUser.id, role: "DRIVER", isActive: true },
                    ]
                });

                // 3. Create Driver
                await tx.driver.create({
                    data: { ...driverData, userId: newUser.id }
                });
            }
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
