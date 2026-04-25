// API Route: Update driver availability status
// PUT /api/driver/status { status: "DISPONIBLE" | "OCUPADO" | "FUERA_DE_SERVICIO" }
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAvailabilitySubscribers } from "@/lib/driver-availability";
import { requireDriverApi } from "@/lib/driver-auth";

const VALID_STATUSES = ["DISPONIBLE", "OCUPADO", "FUERA_DE_SERVICIO"];

// Máxima antigüedad permitida del último GPS para poder pasar a ONLINE.
// Si el driver no reportó coords en los últimos 5 minutos, le pedimos refrescar
// permisos de geolocalización antes de conectarse. Sin esto, el driver figura
// "online" pero el assignment-engine lo filtra (WHERE ubicacion IS NOT NULL),
// lo que hace que pedidos pasen a UNASSIGNABLE y al merchant se le marquen
// como "completados" en el portal — el bug que vimos en producción 2026-04-25.
const MAX_GPS_AGE_MS = 5 * 60 * 1000;

export async function PUT(request: Request) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { userId, driver: existingDriver } = authResult;

        if (!existingDriver) {
            return NextResponse.json(
                { error: "Perfil de repartidor no encontrado" },
                { status: 404 }
            );
        }

        const { status } = await request.json();

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Estado inválido. Valores válidos: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        const goingOnline = status !== "FUERA_DE_SERVICIO";

        // GATE CRÍTICO: si pretende ir online (DISPONIBLE u OCUPADO), exigimos
        // GPS válido y reciente ANTES de tocar la DB. Si no cumple, devolvemos
        // 400 sin escribir nada — el driver queda como estaba. Esto previene
        // el caso donde el driver tenía isOnline=true pero ubicacion=NULL (que
        // hace invisible al assignment-engine y crea pedidos UNASSIGNABLE).
        if (goingOnline) {
            const lat = existingDriver.latitude;
            const lng = existingDriver.longitude;
            const lastLoc = existingDriver.lastLocationAt;

            if (lat === null || lat === undefined || lng === null || lng === undefined) {
                return NextResponse.json(
                    {
                        error: "GPS_REQUIRED",
                        message:
                            "Activá la ubicación de tu navegador antes de conectarte. Sin GPS no podemos asignarte pedidos.",
                    },
                    { status: 400 }
                );
            }

            const gpsAge = lastLoc ? Date.now() - new Date(lastLoc).getTime() : Infinity;
            if (!lastLoc || gpsAge > MAX_GPS_AGE_MS) {
                return NextResponse.json(
                    {
                        error: "GPS_STALE",
                        message:
                            "Tu última ubicación es muy vieja. Refrescá los permisos de ubicación del navegador y volvé a intentar.",
                    },
                    { status: 400 }
                );
            }
        }

        // ISSUE-054: Detectamos el edge offline → online antes de actualizar para
        // disparar el push a buyers suscriptos solo en esa transición (no en
        // cada actualización de estado mientras el driver ya estaba online).
        const wasOffline = !existingDriver.isOnline;

        const driver = await prisma.driver.update({
            where: { userId },
            data: {
                availabilityStatus: status,
                isOnline: goingOnline,
            },
            select: {
                id: true,
                availabilityStatus: true,
                isOnline: true,
                latitude: true,
                longitude: true,
            },
        });

        // Sincronizar el campo PostGIS `ubicacion` cuando el driver pasa a online,
        // usando los lat/lng que ya validamos arriba. Sin esto el campo queda null
        // y el assignment-engine no lo encuentra (filtra ubicacion IS NOT NULL).
        if (driver.isOnline && driver.latitude && driver.longitude) {
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
