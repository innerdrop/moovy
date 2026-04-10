import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDriverRequestNotification } from "@/lib/email";
import { encryptDriverData } from "@/lib/fiscal-crypto";
import { applyRateLimit } from "@/lib/rate-limit";

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

        // Motorized vehicles require license plate
        const motorizedTypes = ["MOTO", "AUTO", "CAMIONETA"];
        const vehicleTypeUpper = body.vehicleType.toUpperCase();
        const isMotorized = motorizedTypes.includes(vehicleTypeUpper);

        if (isMotorized && !body.licensePlate) {
            return NextResponse.json(
                { error: "La patente es obligatoria para vehículos motorizados" },
                { status: 400 }
            );
        }

        // Build driver data
        let driverData: Record<string, any> = {
            userId,
            vehicleType: vehicleTypeUpper,
            vehicleBrand: isMotorized ? (body.vehicleBrand || null) : null,
            vehicleModel: isMotorized ? (body.vehicleModel || null) : null,
            vehicleYear: isMotorized && body.vehicleYear ? parseInt(body.vehicleYear.toString()) : null,
            vehicleColor: isMotorized ? (body.vehicleColor || null) : null,
            licensePlate: isMotorized ? (body.licensePlate?.toUpperCase() || null) : null,
            cuit: body.cuit || null,
            dniFrenteUrl: body.dniFrenteUrl || null,
            dniDorsoUrl: body.dniDorsoUrl || null,
            licenciaUrl: isMotorized ? (body.licenciaUrl || null) : null,
            seguroUrl: isMotorized ? (body.seguroUrl || null) : null,
            vtvUrl: isMotorized ? (body.vtvUrl || null) : null,
            acceptedTermsAt: new Date(),
            isActive: false,
            approvalStatus: "PENDING",
        };

        // Encrypt sensitive fiscal data
        driverData = encryptDriverData(driverData);

        await prisma.$transaction(async (tx) => {
            await tx.driver.create({ data: driverData as any });

            // Create DRIVER role (inactive until admin approves)
            const existingRole = await tx.userRole.findUnique({
                where: { userId_role: { userId, role: "DRIVER" } },
            });
            if (!existingRole) {
                await tx.userRole.create({
                    data: { userId, role: "DRIVER", isActive: false }
                });
            }
        });

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