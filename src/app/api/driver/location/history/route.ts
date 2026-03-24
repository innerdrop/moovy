// API Route: Driver location history - batch save for GPS trace
// POST /api/driver/location/history - Save multiple location points for dispute resolution
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security";
import { createRequestLogger } from "@/lib/logger";

const logger = createRequestLogger("driver-location-history");

// Validation schema for batch location points
const LocationPointSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().positive().optional(),
    speed: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
    timestamp: z.string().datetime(),
});

const BatchLocationSchema = z.object({
    points: z.array(LocationPointSchema).min(1).max(100), // Max 100 points per request
    orderId: z.string().optional(), // Optional — track even when idle
});

type BatchLocationInput = z.infer<typeof BatchLocationSchema>;

export async function POST(request: Request) {
    let sessionUserId: string | null = null;
    try {
        const session = await auth();
        sessionUserId = session?.user?.id ?? null;
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        // Rate limit: 10 requests per minute
        const rateLimitKey = `location-history:${session.user.id}`;
        const rateLimitResult = await checkRateLimit(rateLimitKey, 10, 60 * 1000);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: "Límite de solicitudes excedido. Intenta más tarde.",
                    remaining: rateLimitResult.remaining,
                    resetIn: rateLimitResult.resetIn,
                },
                { status: 429 }
            );
        }

        // Validate request body
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Body JSON inválido" },
                { status: 400 }
            );
        }

        const validationResult = BatchLocationSchema.safeParse(body);
        if (!validationResult.success) {
            logger.warn(
                {
                    errors: validationResult.error.issues,
                    userId: session.user.id,
                },
                "Location history validation failed"
            );
            return NextResponse.json(
                { error: "Datos inválidos", details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const { points, orderId } = validationResult.data;

        // Verify driver exists and get their ID
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!driver) {
            return NextResponse.json(
                { error: "Perfil de repartidor no encontrado" },
                { status: 404 }
            );
        }

        // Optional: verify orderId belongs to this driver (if provided)
        if (orderId) {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { driverId: true, status: true },
            });

            if (!order || order.driverId !== driver.id) {
                return NextResponse.json(
                    { error: "Pedido no encontrado o no asignado a este repartidor" },
                    { status: 404 }
                );
            }

            // Don't save history for completed orders
            if (order.status === "CANCELLED" || order.status === "DELIVERED") {
                return NextResponse.json(
                    { saved: 0, message: "Pedido finalizado, no se guarda historial" }
                );
            }
        }

        // Batch insert location history
        const locationRecords = points.map((point) => ({
            driverId: driver.id,
            orderId: orderId || null,
            latitude: point.latitude,
            longitude: point.longitude,
            accuracy: point.accuracy ?? null,
            speed: point.speed ?? null,
            heading: point.heading ?? null,
            timestamp: new Date(point.timestamp),
            createdAt: new Date(),
        }));

        const saved = await prisma.driverLocationHistory.createMany({
            data: locationRecords,
            skipDuplicates: false, // We'll accept duplicates (unlikely with timestamps)
        });

        logger.info(
            {
                driverId: driver.id,
                orderId: orderId || null,
                pointsSaved: saved.count,
            },
            "Location history saved"
        );

        return NextResponse.json({
            saved: saved.count,
            message: `${saved.count} punto(s) de ubicación guardados`,
        });
    } catch (error) {
        logger.error(
            { error, userId: sessionUserId },
            "Error saving location history"
        );
        return NextResponse.json(
            { error: "Error al guardar historial de ubicación" },
            { status: 500 }
        );
    }
}
