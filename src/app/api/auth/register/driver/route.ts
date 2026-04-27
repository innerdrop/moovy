// API Route: Driver Registration
//
// Reglas post fix/onboarding-repartidor-complet:
// - CUIT valida checksum AFIP (validateCuit del helper src/lib/cuit.ts).
// - Constancia AFIP URL es OBLIGATORIA (fondo legal: monotributo).
// - Para motorizados: cédula verde + seguro + licencia + RTO obligatorias
//   + expiraciones (licenciaExpiresAt, seguroExpiresAt, vtvExpiresAt, cedulaVerdeExpiresAt)
//   pasadas al schema. Expiraciones se validan server-side: no puede ser
//   fecha pasada ni más de 20 años en el futuro.
// - vehicleYear: validación de antigüedad por tipo (moto ≤15 años, resto ≤25).
// - isMotorizedVehicle() del helper driver-document-approval.ts es canónico.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { applyRateLimit } from "@/lib/rate-limit";
import { encryptDriverData } from "@/lib/fiscal-crypto";
import { recordConsent } from "@/lib/consent";
import { sendAdminNewDriverPendingEmail } from "@/lib/email-admin-ops";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "@/lib/legal-versions";
import { validateCuit } from "@/lib/cuit";
import { validatePatente } from "@/lib/patente";
import { isMotorizedVehicle } from "@/lib/driver-document-approval";

export const dynamic = "force-dynamic";

/**
 * Cap de antigüedad por tipo de vehículo (Ushuaia: clima salino + frío extremo
 * degradan vehículos más rápido que en el resto del país). Límites conservadores.
 */
const MAX_VEHICLE_AGE_YEARS: Record<string, number> = {
    MOTO: 15,
    AUTO: 25,
    CAMIONETA: 25,
    PICKUP: 25,
    SUV: 25,
    FLETE: 30,
};

function validateVehicleAge(vehicleType: string, vehicleYear: number): string | null {
    const now = new Date().getFullYear();
    const age = now - vehicleYear;
    if (vehicleYear < 1950 || vehicleYear > now + 1) {
        return `Año del vehículo inválido (${vehicleYear}).`;
    }
    const cap = MAX_VEHICLE_AGE_YEARS[vehicleType.toUpperCase()];
    if (cap !== undefined && age > cap) {
        return `Tu vehículo tiene ${age} años. El máximo permitido para ${vehicleType.toLowerCase()} es ${cap} años.`;
    }
    return null;
}

function parseExpiration(raw: unknown, label: string): Date | string | null {
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw !== "string") return `Fecha de vencimiento de ${label} inválida.`;
    const date = new Date(raw);
    if (isNaN(date.getTime())) return `Fecha de vencimiento de ${label} inválida.`;
    const now = new Date();
    const minPast = new Date(now);
    minPast.setDate(minPast.getDate() - 1);
    const maxFuture = new Date(now);
    maxFuture.setFullYear(maxFuture.getFullYear() + 20);
    if (date < minPast)
        return `La fecha de vencimiento de ${label} ya pasó. Subí un documento vigente.`;
    if (date > maxFuture)
        return `La fecha de vencimiento de ${label} es implausible (más de 20 años).`;
    return date;
}

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

        // Validate legal acceptance
        if (!data.acceptTerms || !data.acceptPrivacy) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Repartidores y la Política de Privacidad" },
                { status: 400 }
            );
        }

        // feat/registro-simplificado (2026-04-27): documentos y CUIT son OPCIONALES
        // en el registro. El driver puede entrar al panel y completarlos después.
        // La aprobación (approveDriverTransition) sigue requiriendo todos los docs
        // según vehicleType — sin esos, el admin no aprueba y el driver no opera.
        // Si el driver mandó algún campo, lo validamos. Si no, queda null/skip.

        if (data.cuit && data.cuit.toString().trim().length > 0) {
            const cuitCheck = validateCuit(data.cuit);
            if (!cuitCheck.valid) {
                return NextResponse.json(
                    { error: cuitCheck.error || "CUIT/CUIL inválido" },
                    { status: 400 }
                );
            }
        }

        const vehicleTypeUpper = data.vehicleType.toUpperCase();
        const isMotorized = isMotorizedVehicle(vehicleTypeUpper);

        // Patente opcional, pero si vino se valida formato.
        let normalizedLicensePlate: string | null = null;
        if (isMotorized && data.licensePlate && data.licensePlate.toString().trim().length > 0) {
            const plateCheck = validatePatente(data.licensePlate);
            if (!plateCheck.valid || !plateCheck.normalized) {
                return NextResponse.json(
                    { error: plateCheck.error || "Patente inválida" },
                    { status: 400 }
                );
            }
            normalizedLicensePlate = plateCheck.normalized;
        }

        // Vehicle age check si vino el año
        if (isMotorized && data.vehicleYear) {
            const ageError = validateVehicleAge(
                vehicleTypeUpper,
                parseInt(data.vehicleYear.toString(), 10)
            );
            if (ageError) {
                return NextResponse.json({ error: ageError }, { status: 400 });
            }
        }

        // Parse expirations: opcionales pero si vienen se validan
        let licenciaExpiresAt: Date | null = null;
        let seguroExpiresAt: Date | null = null;
        let vtvExpiresAt: Date | null = null;
        let cedulaVerdeExpiresAt: Date | null = null;

        if (isMotorized) {
            if (data.licenciaExpiresAt) {
                const parsedLic = parseExpiration(data.licenciaExpiresAt, "Licencia");
                if (typeof parsedLic === "string")
                    return NextResponse.json({ error: parsedLic }, { status: 400 });
                licenciaExpiresAt = parsedLic;
            }

            if (data.seguroExpiresAt) {
                const parsedSeg = parseExpiration(data.seguroExpiresAt, "Seguro");
                if (typeof parsedSeg === "string")
                    return NextResponse.json({ error: parsedSeg }, { status: 400 });
                seguroExpiresAt = parsedSeg;
            }

            if (data.vtvExpiresAt) {
                const parsedVtv = parseExpiration(data.vtvExpiresAt, "RTO");
                if (typeof parsedVtv === "string")
                    return NextResponse.json({ error: parsedVtv }, { status: 400 });
                vtvExpiresAt = parsedVtv;
            }

            if (data.cedulaVerdeExpiresAt) {
                const parsedCed = parseExpiration(data.cedulaVerdeExpiresAt, "Cédula verde");
                if (typeof parsedCed === "string")
                    return NextResponse.json({ error: parsedCed }, { status: 400 });
                cedulaVerdeExpiresAt = parsedCed;
            }
        }

        // Check if email already exists (ignore soft-deleted users).
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: {
                id: true,
                deletedAt: true,
                driver: { select: { id: true } },
            }
        });

        // Resurrection block: cuentas soft-deleted no pueden re-registrarse
        // (ISSUE-060 — ver /api/auth/register/route.ts).
        if (existingUser?.deletedAt) {
            return NextResponse.json(
                { error: "Esta cuenta fue eliminada. Si creés que fue un error, escribinos a soporte." },
                { status: 410 }
            );
        }

        if (existingUser && !existingUser.deletedAt && existingUser?.driver) {
            return NextResponse.json(
                { error: "Ya tenés una cuenta de repartidor con ese email" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        // Driver data (shared between both paths)
        let driverData: Record<string, any> = {
            vehicleType: vehicleTypeUpper,
            vehicleBrand: isMotorized ? data.vehicleBrand : null,
            vehicleModel: isMotorized ? data.vehicleModel : null,
            vehicleYear: isMotorized && data.vehicleYear ? parseInt(data.vehicleYear.toString()) : null,
            vehicleColor: isMotorized ? data.vehicleColor : null,
            licensePlate: isMotorized ? normalizedLicensePlate : null,
            cuit: cuitCheck.normalized,
            constanciaCuitUrl: data.constanciaCuitUrl,
            dniFrenteUrl: data.dniFrenteUrl,
            dniDorsoUrl: data.dniDorsoUrl,
            licenciaUrl: isMotorized ? data.licenciaUrl : null,
            seguroUrl: isMotorized ? data.seguroUrl : null,
            vtvUrl: isMotorized ? data.vtvUrl : null,
            cedulaVerdeUrl: isMotorized ? data.cedulaVerdeUrl : null,
            licenciaExpiresAt,
            seguroExpiresAt,
            vtvExpiresAt,
            cedulaVerdeExpiresAt,
            acceptedTermsAt: new Date(),
            acceptedPrivacyAt: new Date(),
            isActive: false,
            approvalStatus: "PENDING",
        };

        // Encrypt sensitive fiscal data before saving
        driverData = encryptDriverData(driverData);

        const resultUser = await prisma.$transaction(async (tx) => {
            if (existingUser) {
                // PATH A: user already exists → solo creamos el Driver.
                const driver = await tx.driver.create({
                    data: { ...driverData, userId: existingUser.id },
                    select: { id: true },
                });
                return { id: existingUser.id, driverId: driver.id };
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

                const driver = await tx.driver.create({
                    data: { ...driverData, userId: newUser.id },
                    select: { id: true },
                });
                return { id: newUser.id, driverId: driver.id };
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

        // Aviso al admin/owner — nuevo repartidor pendiente de revisión (fire-and-forget)
        sendAdminNewDriverPendingEmail({
            driverName: fullName,
            driverEmail: data.email,
            driverPhone: data.phone || "No informado",
            vehicleType: vehicleTypeUpper,
            driverId: resultUser.driverId,
        }).catch((err) =>
            console.error("[Register Driver] Failed to send admin pending email:", err)
        );

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
