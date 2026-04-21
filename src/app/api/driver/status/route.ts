// API Route: Update driver availability status
// PUT /api/driver/status { status: "DISPONIBLE" | "OCUPADO" | "FUERA_DE_SERVICIO" }
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyAvailabilitySubscribers } from "@/lib/driver-availability";

const VALID_STATUSES = ["DISPONIBLE", "OCUPADO", "FUERA_DE_SERVICIO"];

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Estado inválido. Valores válidos: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        // ISSUE-054: Detectamos el edge offline → online antes de actualizar para
        // disparar el push a buyers suscriptos solo en esa transición (no en
        // cada actualización de estado mientras el driver ya estaba online).
        const previous = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { isOnline: true },
        });
        const wasOffline = !previous?.isOnline;

        const driver = await prisma.driver.update({
            where: { userId: session.user.id },
            data: {
                availabilityStatus: status,
                isOnline: status !== "FUERA_DE_SERVICIO",
            },
            select: {
                id: true,
                availabilityStatus: true,
                isOnline: true,
                latitude: true,
                longitude: true,
            },
        });

        // BUG FIX #1: Update PostGIS ubicacion when driver goes online
        if (driver.isOnline) {
            if (!driver.latitude || !driver.longitude) {
                return NextResponse.json(
                    { error: "Debes habilitar ubicación GPS antes de conectarte" },
                    { status: 400 }
                );
            }
            // Update PostGIS ubicacion field with driver's current coordinates
            await prisma.$executeRaw`
                UPDATE "Driver"
                SET ubicacion = ST_SetSRID(ST_MakePoint(${driver.longitude}, ${driver.latitude}), 4326)
                WHERE id = ${driver.id}
            `;

            // ISSUE-054: solo disparar el aviso a suscriptores cuando el driver acaba
            // de conectarse (transición offline → online), no en toggles entre
            // DISPONIBLE ↔ OCUPADO. Fire-and-forget para no bloquear la respuesta.
            if (wasOffline) {
                notifyAvailabilitySubscribers({
                    driverId: driver.id,
                    driverLat: driver.latitude,
                    driverLng: driver.longitude,
                }).catch((err) =>
                    console.error("[driver/status] notifyAvailabilitySubscribers failed:", err)
                );
            }
        }

        return NextResponse.json({
            success: true,
            status: driver.availabilityStatus,
            isOnline: driver.isOnline,
        });
    } catch (error) {
        console.error("Error updating driver status:", error);
        return NextResponse.json(
            { error: "Error al actualizar estado" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: {
                id: true,
                availabilityStatus: true,
                isOnline: true,
                latitude: true,
                longitude: true,
                lastLocationAt: true,
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
        }

        return NextResponse.json(driver);
    } catch (error) {
        console.error("Error getting driver status:", error);
        return NextResponse.json(
            { error: "Error al obtener estado" },
            { status: 500 }
        );
    }
}
