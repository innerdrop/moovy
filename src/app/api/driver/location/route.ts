// API Route: Driver location updates
// PUT /api/driver/location - Updates driver's real-time location
// Only updates DB if driver moved significantly (>10 meters)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/geo";

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        const { latitude, longitude } = await request.json();

        if (typeof latitude !== "number" || typeof longitude !== "number") {
            return NextResponse.json(
                { error: "latitude y longitude requeridos" },
                { status: 400 }
            );
        }

        // Validate coordinates are within reasonable range
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return NextResponse.json(
                { error: "Coordenadas inválidas" },
                { status: 400 }
            );
        }

        // Get driver record
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Perfil de repartidor no encontrado" },
                { status: 404 }
            );
        }

        // Check if moved significantly (>10 meters from last position)
        let shouldUpdate = true;
        if (driver.latitude !== null && driver.longitude !== null) {
            const distanceKm = calculateDistance(
                driver.latitude,
                driver.longitude,
                latitude,
                longitude
            );
            const distanceMeters = distanceKm * 1000;

            // V-016 FIX: GPS speed validation — reject physically impossible movements
            // Max realistic speed: 200 km/h (covers motorcycles on highways)
            if (driver.lastLocationAt) {
                const timeDiffSeconds = (Date.now() - new Date(driver.lastLocationAt).getTime()) / 1000;
                if (timeDiffSeconds > 0 && timeDiffSeconds < 300) { // Only check within 5 min window
                    const speedKmh = (distanceKm / timeDiffSeconds) * 3600;
                    if (speedKmh > 200) {
                        console.warn(`[GPS] Suspicious speed: ${speedKmh.toFixed(0)} km/h for driver ${driver.id}`);
                        return NextResponse.json(
                            { error: "Movimiento inválido: velocidad imposible detectada", updated: false },
                            { status: 400 }
                        );
                    }
                }
            }

            // Only update if moved more than 10 meters
            if (distanceMeters < 10) {
                shouldUpdate = false;
            }
        }

        if (shouldUpdate) {
            // Update both standard fields and PostGIS geography column
            await prisma.$executeRaw`
                UPDATE "Driver"
                SET latitude = ${latitude},
                    longitude = ${longitude},
                    ubicacion = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
                    "lastLocationAt" = NOW()
                WHERE id = ${driver.id}
            `;

            return NextResponse.json({
                updated: true,
                message: "Ubicación actualizada correctamente con PostGIS",
            });
        }

        return NextResponse.json({
            updated: false,
            message: "Movimiento no significativo",
        });
    } catch (error) {
        console.error("Error updating driver location:", error);
        return NextResponse.json(
            { error: "Error al actualizar ubicación" },
            { status: 500 }
        );
    }
}

// GET - Get current driver location (for debugging/admin)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const isDriver = hasAnyRole(session, ["DRIVER"]);

        // For drivers, return their own location
        if (isDriver) {
            const driver = await prisma.driver.findUnique({
                where: { userId: session.user.id },
                select: {
                    latitude: true,
                    longitude: true,
                    lastLocationAt: true,
                    availabilityStatus: true,
                },
            });

            return NextResponse.json(driver);
        }

        // For admin, return all drivers with location
        const drivers = await prisma.driver.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null },
            },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                lastLocationAt: true,
                availabilityStatus: true,
                vehicleType: true,
                user: { select: { name: true } },
            },
        });

        return NextResponse.json(drivers);
    } catch (error) {
        console.error("Error getting driver location:", error);
        return NextResponse.json(
            { error: "Error al obtener ubicación" },
            { status: 500 }
        );
    }
}
