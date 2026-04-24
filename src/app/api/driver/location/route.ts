// API Route: Driver location updates
// PUT /api/driver/location - Updates driver's real-time location
// Only updates DB if driver moved significantly (>10 meters)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/geo";
import { checkAndNotifyNearDestination } from "@/lib/driver-proximity";
import { requireDriverApi } from "@/lib/driver-auth";

export async function PUT(request: Request) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

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

        if (!driver) {
            return NextResponse.json(
                { error: "Perfil de repartidor no encontrado" },
                { status: 404 }
            );
        }

        if (driver.approvalStatus !== "APPROVED") {
            return NextResponse.json(
                { error: "Tu solicitud está pendiente de aprobación" },
                { status: 403 }
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

            // Save to location history if driver has an active order
            // Don't save idle locations to reduce storage (only save when delivering)
            try {
                const activeOrder = await prisma.order.findFirst({
                    where: {
                        driverId: driver.id,
                        status: { notIn: ["CANCELLED", "DELIVERED"] },
                        deletedAt: null,
                    },
                    select: { id: true, deliveryStatus: true },
                    orderBy: { createdAt: "desc" },
                });

                if (activeOrder) {
                    // Save location point with associated order
                    await prisma.driverLocationHistory.create({
                        data: {
                            driverId: driver.id,
                            orderId: activeOrder.id,
                            latitude,
                            longitude,
                            accuracy: null,
                            speed: null,
                            heading: null,
                            timestamp: new Date(),
                        },
                    });
                }
            } catch (historyError) {
                // Log error but don't fail the location update
                console.error(
                    "[LocationHistory] Failed to save history:",
                    historyError
                );
            }

            // ISSUE-013 — fire-and-forget: chequear si entró en radio de 300m del destino
            // de alguna entrega activa y disparar push al buyer.
            // No bloqueamos la respuesta HTTP del driver (la UI espera update rápido).
            checkAndNotifyNearDestination({
                driverId: driver.id,
                driverLat: latitude,
                driverLng: longitude,
            }).catch((err) =>
                console.error("[Proximity] Fire-and-forget falló:", err)
            );

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
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { userId, driver, isAdmin } = authResult;

        // For drivers, return their own location
        // A user that is both driver and admin is treated as driver here (scoped to self)
        if (driver) {
            const driverLoc = await prisma.driver.findUnique({
                where: { userId },
                select: {
                    latitude: true,
                    longitude: true,
                    lastLocationAt: true,
                    availabilityStatus: true,
                },
            });

            return NextResponse.json(driverLoc);
        }

        // For admin without driver profile, return all drivers with location
        if (isAdmin) {
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
        }

        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    } catch (error) {
        console.error("Error getting driver location:", error);
        return NextResponse.json(
            { error: "Error al obtener ubicación" },
            { status: 500 }
        );
    }
}
