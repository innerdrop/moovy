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

            // 2. Create Driver with legal/document data
            await tx.driver.create({
                data: {
                    userId: newUser.id,
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
