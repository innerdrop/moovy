import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptDriverData } from "@/lib/fiscal-crypto";

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
        // fix/asignacion-y-logistica (2026-06-05): hasThermalBag / hasColdStorage --
        // equipamiento de frio declarado por el driver. Habilitan ofertas HOT/FRESH
        // en el assignment-engine. Se aceptan solo si vienen como boolean explicito.
        const { vehicleType, vehicleModel, vehiclePlate, hasThermalBag, hasColdStorage } = body;
        const updatedDriver = await prisma.driver.update({
            where: { userId },
            data: {
                ...(vehicleType && { vehicleType }),
                ...(vehicleModel && { vehicleModel }),
                ...(vehiclePlate && { vehiclePlate }),
                ...(typeof hasThermalBag === "boolean" && { hasThermalBag }),
                ...(typeof hasColdStorage === "boolean" && { hasColdStorage }),
            }
        });

        // SECURITY (fix/driver-profile-no-filtrar-campos-internos): NO devolver la
        // fila completa del Driver (arrastraba fraudScore, GPS, bankCbu/bankAlias y
        // notas internas OPS). El frontend (ProfileView.handleSave) solo mira res.ok
        // y NO lee el body, asi que devolvemos un acuse minimo y seguro.
        return NextResponse.json({ success: true });
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

        // Decifrar campos fiscales (CUIT) antes de devolverlos al frontend.
        // El driver ve su propio dato, asi que va plaintext. Sin esto el panel
        // mostraba el ciphertext hex (bug visual reportado 2026-04-25).
        // El cifrado en DB se mantiene -- defense in depth.
        const decryptedDriver = decryptDriverData(driver);

        // SECURITY (fix/driver-profile-no-filtrar-campos-internos): whitelist explicita.
        // Antes se spreadeaba la fila completa, filtrando al browser campos internos:
        // fraudScore/lastFraudCheckAt (anti-fraude), latitude/longitude/ubicacion (GPS),
        // bankCbu/bankAlias (el form bancario usa su propio endpoint), y los
        // *ApprovalSource/*ApprovalNote/*NotifiedStage (notas internas OPS / cron, AAIP).
        // Solo devolvemos lo que ProfileView (portal repartidor) y mi-perfil consumen.
        const d = decryptedDriver as Record<string, unknown>;
        return NextResponse.json({
            id: d.id,
            // Vehiculo
            vehicleType: d.vehicleType,
            vehicleModel: d.vehicleModel,
            vehiclePlate: d.vehiclePlate,
            licensePlate: d.licensePlate,
            hasThermalBag: d.hasThermalBag,
            hasColdStorage: d.hasColdStorage,
            // Perfil / estado (mi-perfil lee approvalStatus + isActive)
            rating: d.rating,
            createdAt: d.createdAt,
            approvalStatus: d.approvalStatus,
            isActive: d.isActive,
            // CUIT (decifrado -- dato propio del driver) + estado del doc
            cuit: d.cuit,
            cuitStatus: d.cuitStatus,
            cuitRejectionReason: d.cuitRejectionReason,
            cuitApprovedAt: d.cuitApprovedAt,
            // Documentos: url/value + Status + RejectionReason + ApprovedAt (+ ExpiresAt)
            constanciaCuitUrl: d.constanciaCuitUrl,
            constanciaCuitStatus: d.constanciaCuitStatus,
            constanciaCuitRejectionReason: d.constanciaCuitRejectionReason,
            constanciaCuitApprovedAt: d.constanciaCuitApprovedAt,
            dniFrenteUrl: d.dniFrenteUrl,
            dniFrenteStatus: d.dniFrenteStatus,
            dniFrenteRejectionReason: d.dniFrenteRejectionReason,
            dniFrenteApprovedAt: d.dniFrenteApprovedAt,
            dniDorsoUrl: d.dniDorsoUrl,
            dniDorsoStatus: d.dniDorsoStatus,
            dniDorsoRejectionReason: d.dniDorsoRejectionReason,
            dniDorsoApprovedAt: d.dniDorsoApprovedAt,
            licenciaUrl: d.licenciaUrl,
            licenciaStatus: d.licenciaStatus,
            licenciaRejectionReason: d.licenciaRejectionReason,
            licenciaApprovedAt: d.licenciaApprovedAt,
            licenciaExpiresAt: d.licenciaExpiresAt,
            seguroUrl: d.seguroUrl,
            seguroStatus: d.seguroStatus,
            seguroRejectionReason: d.seguroRejectionReason,
            seguroApprovedAt: d.seguroApprovedAt,
            seguroExpiresAt: d.seguroExpiresAt,
            vtvUrl: d.vtvUrl,
            vtvStatus: d.vtvStatus,
            vtvRejectionReason: d.vtvRejectionReason,
            vtvApprovedAt: d.vtvApprovedAt,
            vtvExpiresAt: d.vtvExpiresAt,
            cedulaVerdeUrl: d.cedulaVerdeUrl,
            cedulaVerdeStatus: d.cedulaVerdeStatus,
            cedulaVerdeRejectionReason: d.cedulaVerdeRejectionReason,
            cedulaVerdeApprovedAt: d.cedulaVerdeApprovedAt,
            cedulaVerdeExpiresAt: d.cedulaVerdeExpiresAt,
            // Usuario (subobjeto ya seleccionado: id, name, email, phone, image)
            user: d.user,
            // Sintetico
            totalDeliveries: driver._count.orders,
        });
    } catch (error) {
        console.error("Error fetching driver profile:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
