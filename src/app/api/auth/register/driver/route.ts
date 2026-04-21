// API Route: Driver Registration
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { applyRateLimit } from "@/lib/rate-limit";
import { encryptDriverData } from "@/lib/fiscal-crypto";
import { recordConsent } from "@/lib/consent";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "@/lib/legal-versions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    // Rate limit: max 5 registrations per 15 minutes per IP
    const limited = await applyRateLimit(request, "auth:register:driver", 5, 15 * 60_000);
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

        // Check if email already exists (ignore soft-deleted users).
        // Ya no consultamos UserRole: el rol DRIVER se deriva de Driver.approvalStatus
        // en cada request. Ver src/lib/roles.ts.
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                deletedAt: true,
                driver: { select: { id: true } },
            }
        });

        // If user exists, is NOT deleted, AND already has a driver profile, reject
        if (existingUser && !existingUser.deletedAt && existingUser?.driver) {
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
            acceptedTermsAt: new Date(),
            acceptedPrivacyAt: new Date(),
            isActive: false,
        };

        // Encrypt sensitive fiscal data before saving
        driverData = encryptDriverData(driverData);

        const resultUser = await prisma.$transaction(async (tx) => {
            if (existingUser) {
                // PATH A: user already exists → solo creamos el Driver.
                // No tocamos UserRole: el rol DRIVER se deriva del Driver existiendo
                // (con approvalStatus como gate). Ver src/lib/roles.ts.
                await tx.driver.create({
                    data: { ...driverData, userId: existingUser.id }
                });
                return { id: existingUser.id };
            } else {
                // PATH B: user nuevo → creamos User + Driver.
                const newUser = await tx.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        name: fullName,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone,
                        role: 'USER',
                        termsConsentAt: new Date(),
                        termsConsentVersion: TERMS_VERSION,
                        privacyConsentAt: new Date(),
                        privacyConsentVersion: PRIVACY_POLICY_VERSION,
                    }
                });

                await tx.driver.create({
                    data: { ...driverData, userId: newUser.id }
                });
                return { id: newUser.id };
            }
        });

        // Ley 25.326 + AAIP: registrar consentimientos en ConsentLog
        try {
            await recordConsent({
                userId: resultUser.id,
                consentType: "TERMS",
                version: TERMS_VERSION,
                action: "ACCEPT",
                request,
                details: { context: "driver_registration" },
            });
            await recordConsent({
                userId: resultUser.id,
                consentType: "PRIVACY",
                version: PRIVACY_POLICY_VERSION,
                action: "ACCEPT",
                request,
                details: { context: "driver_registration" },
            });
        } catch (err) {
            console.error("[REGISTER DRIVER] Failed to persist consent log:", err);
        }

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
