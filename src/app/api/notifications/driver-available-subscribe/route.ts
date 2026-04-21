// ISSUE-054: Suscripción del buyer para recibir push cuando haya un driver disponible.
// Se llama desde el checkout cuando el flujo detecta "no hay repartidores en la zona".
// Se guarda `latitude/longitude` del address del buyer + opcionalmente `merchantId`
// para que cuando un driver pase a `isOnline=true` podamos matchearlo por distancia.
// Auto-expira en 4h para que no notifiquemos cuando el buyer ya se olvidó.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

const SUBSCRIPTION_TTL_HOURS = 4;
const MAX_ACTIVE_SUBS_PER_USER = 3;

const BodySchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    merchantId: z.string().min(1).max(50).optional(),
});

/**
 * POST /api/notifications/driver-available-subscribe
 * Body: { latitude, longitude, merchantId? }
 * Crea una suscripción pendiente. Si el user ya tiene 3 activas, rechaza.
 * Si ya existe una suscripción para la misma ubicación + merchant, la refresca
 * (updatedAt + expiresAt) en vez de duplicar.
 */
export async function POST(req: Request) {
    try {
        // Rate limit: 10/min por IP — suficiente para un flujo legítimo de checkout.
        const limited = await applyRateLimit(req, "driver-available-subscribe", 10, 60_000);
        if (limited) return limited;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json().catch(() => null);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.issues },
                { status: 400 }
            );
        }

        const { latitude, longitude, merchantId } = parsed.data;
        const userId = session.user.id;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SUBSCRIPTION_TTL_HOURS * 60 * 60 * 1000);

        // Validar que el merchantId existe si viene (evita FKs rotas).
        if (merchantId) {
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: { id: true },
            });
            if (!merchant) {
                return NextResponse.json(
                    { error: "Comercio no encontrado" },
                    { status: 404 }
                );
            }
        }

        // Si ya existe una suscripción activa para la misma combinación (user + ubicación
        // aprox + merchant), la refrescamos en vez de duplicar. "Misma ubicación" = dentro
        // de ~100m (0.001° ≈ 111m) para tolerar variaciones menores del address autocomplete.
        const existingActive = await prisma.driverAvailabilitySubscription.findFirst({
            where: {
                userId,
                merchantId: merchantId ?? null,
                notifiedAt: null,
                expiresAt: { gt: now },
                latitude: { gte: latitude - 0.001, lte: latitude + 0.001 },
                longitude: { gte: longitude - 0.001, lte: longitude + 0.001 },
            },
            select: { id: true },
        });

        if (existingActive) {
            const refreshed = await prisma.driverAvailabilitySubscription.update({
                where: { id: existingActive.id },
                data: { expiresAt, latitude, longitude },
                select: { id: true, expiresAt: true },
            });
            return NextResponse.json({
                success: true,
                subscriptionId: refreshed.id,
                expiresAt: refreshed.expiresAt,
                refreshed: true,
            });
        }

        // Límite por usuario — evita abuso o creación accidental masiva.
        const activeCount = await prisma.driverAvailabilitySubscription.count({
            where: {
                userId,
                notifiedAt: null,
                expiresAt: { gt: now },
            },
        });
        if (activeCount >= MAX_ACTIVE_SUBS_PER_USER) {
            return NextResponse.json(
                {
                    error: `Ya tenés ${MAX_ACTIVE_SUBS_PER_USER} avisos activos. Esperá a que alguno se complete o expire.`,
                },
                { status: 429 }
            );
        }

        const created = await prisma.driverAvailabilitySubscription.create({
            data: {
                userId,
                latitude,
                longitude,
                merchantId: merchantId ?? null,
                expiresAt,
            },
            select: { id: true, expiresAt: true },
        });

        logger.info(
            { userId, subscriptionId: created.id, merchantId: merchantId ?? null, expiresAt },
            "Driver availability subscription created"
        );

        return NextResponse.json({
            success: true,
            subscriptionId: created.id,
            expiresAt: created.expiresAt,
            refreshed: false,
        });
    } catch (error) {
        logger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "driver-available-subscribe POST error"
        );
        return NextResponse.json(
            { error: "Error al crear suscripción" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/notifications/driver-available-subscribe?id=<subscriptionId>
 * Permite al usuario cancelar su aviso (si cambió de opinión o ya pidió de otra forma).
 */
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const url = new URL(req.url);
        const id = url.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "id requerido" }, { status: 400 });
        }

        // Ownership: solo el dueño puede borrar.
        const sub = await prisma.driverAvailabilitySubscription.findUnique({
            where: { id },
            select: { userId: true },
        });
        if (!sub) {
            return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
        }
        if (sub.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        await prisma.driverAvailabilitySubscription.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "driver-available-subscribe DELETE error"
        );
        return NextResponse.json(
            { error: "Error al cancelar suscripción" },
            { status: 500 }
        );
    }
}
