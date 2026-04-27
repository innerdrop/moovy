import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDriverRequestNotification } from "@/lib/email";
import { encryptDriverData } from "@/lib/fiscal-crypto";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCuit } from "@/lib/cuit";
import { validatePatente } from "@/lib/patente";
import { isMotorizedVehicle } from "@/lib/driver-document-approval";

/**
 * Cap de antigüedad por tipo de vehículo (ver register/driver/route.ts para
 * el rationale — clima salino + frío extremo de Ushuaia).
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

// POST - Request DRIVER role activation from authenticated user (with full vehicle/doc data)
export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "auth:activate-driver", 5, 15 * 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Check if already a driver
        const existingDriver = await prisma.driver.findUnique({
            where: { userId }
        });
        if (existingDriver) {
            return NextResponse.json({
                error: existingDriver.approvalStatus === "APPROVED"
                    ? "Ya sos repartidor activo"
                    : "Tu solicitud está pendiente de aprobación",
                status: existingDriver.approvalStatus === "APPROVED" ? "ACTIVE" : "PENDING_VERIFICATION"
            }, { status: 409 });
        }

        // Parse body with vehicle and document data
        let body: Record<string, any> = {};
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }

        // Validate required fields
        if (!body.vehicleType) {
            return NextResponse.json({ error: "El tipo de vehículo es obligatorio" }, { status: 400 });
        }

        if (!body.acceptTerms) {
            return NextResponse.json(
                { error: "Debés aceptar los Términos para Repartidores" },
                { status: 400 }
            );
        }

        // feat/registro-simplificado (2026-04-27): documentos y CUIT son OPCIONALES
        // en la activación. El driver puede entrar al panel y completarlos después.
        // approveDriverTransition sigue requiriéndolos según vehicleType para aprobar.

        let normalizedCuit: string | null = null;
        if (body.cuit && body.cuit.toString().trim().length > 0) {
            const cuitCheck = validateCuit(body.cuit);
            if (!cuitCheck.valid) {
                return NextResponse.json(
                    { error: cuitCheck.error || "CUIT/CUIL inválido" },
                    { status: 400 }
                );
            }
            normalizedCuit = cuitCheck.normalized;
        }

        const vehicleTypeUpper = body.vehicleType.toUpperCase();
        const isMotorized = isMotorizedVehicle(vehicleTypeUpper);

        let normalizedLicensePlate: string | null = null;
        if (isMotorized && body.licensePlate && body.licensePlate.toString().trim().length > 0) {
            const plateCheck = validatePatente(body.licensePlate);
            if (!plateCheck.valid || !plateCheck.normalized) {
                return NextResponse.json(
                    { error: plateCheck.error || "Patente inválida" },
                    { status: 400 }
                );
            }
            normalizedLicensePlate = plateCheck.normalized;
        }

        if (isMotorized && body.vehicleYear) {
            const ageError = validateVehicleAge(
                vehicleTypeUpper,
                parseInt(body.vehicleYear.toString(), 10)
            );
            if (ageError) {
                return NextResponse.json({ error: ageError }, { status: 400 });
            }
        }

        // Parse expirations (opcionales)
        let licenciaExpiresAt: Date | null = null;
        let seguroExpiresAt: Date | null = null;
        let vtvExpiresAt: Date | null = null;
        let cedulaVerdeExpiresAt: Date | null = null;

        if (isMotorized) {
            if (body.licenciaExpiresAt) {
                const parsedLic = parseExpiration(body.licenciaExpiresAt, "Licencia");
                if (typeof parsedLic === "string")
                    return NextResponse.json({ error: parsedLic }, { status: 400 });
                licenciaExpiresAt = parsedLic;
            }
            if (body.seguroExpiresAt) {
                const parsedSeg = parseExpiration(body.seguroExpiresAt, "Seguro");
                if (typeof parsedSeg === "string")
                    return NextResponse.json({ error: parsedSeg }, { status: 400 });
                seguroExpiresAt = parsedSeg;
            }
            if (body.vtvExpiresAt) {
                const parsedVtv = parseExpiration(body.vtvExpiresAt, "RTO");
                if (typeof parsedVtv === "string")
                    return NextResponse.json({ error: parsedVtv }, { status: 400 });
                vtvExpiresAt = parsedVtv;
            }
            if (body.cedulaVerdeExpiresAt) {
                const parsedCed = parseExpiration(body.cedulaVerdeExpiresAt, "Cédula verde");
                if (typeof parsedCed === "string")
                    return NextResponse.json({ error: parsedCed }, { status: 400 });
                cedulaVerdeExpiresAt = parsedCed;
            }
        }

        // Build driver data
        let driverData: Record<string, any> = {
            userId,
            vehicleType: vehicleTypeUpper,
            vehicleBrand: isMotorized ? (body.vehicleBrand || null) : null,
            vehicleModel: isMotorized ? (body.vehicleModel || null) : null,
            vehicleYear: isMotorized && body.vehicleYear ? parseInt(body.vehicleYear.toString()) : null,
            vehicleColor: isMotorized ? (body.vehicleColor || null) : null,
            licensePlate: isMotorized ? normalizedLicensePlate : null,
            cuit: normalizedCuit,
            constanciaCuitUrl: body.constanciaCuitUrl || null,
            dniFrenteUrl: body.dniFrenteUrl || null,
            dniDorsoUrl: body.dniDorsoUrl || null,
            licenciaUrl: isMotorized ? (body.licenciaUrl || null) : null,
            seguroUrl: isMotorized ? (body.seguroUrl || null) : null,
            vtvUrl: isMotorized ? (body.vtvUrl || null) : null,
            cedulaVerdeUrl: isMotorized ? (body.cedulaVerdeUrl || null) : null,
            licenciaExpiresAt,
            seguroExpiresAt,
            vtvExpiresAt,
            cedulaVerdeExpiresAt,
            acceptedTermsAt: new Date(),
            isActive: false,
            approvalStatus: "PENDING",
            applicationStatus: "DRAFT",
        };

        // Encrypt sensitive fiscal data
        driverData = encryptDriverData(driverData);

        // Solo creamos el Driver. El rol DRIVER se deriva de Driver.approvalStatus.
        await prisma.driver.create({ data: driverData as any });

        // Send admin notification email (non-blocking)
        sendDriverRequestNotification(
            session.user.name || null,
            session.user.email || null
        );

        return NextResponse.json({ success: true, status: "PENDING_VERIFICATION" });
    } catch (error) {
        console.error("[ActivateDriver] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
