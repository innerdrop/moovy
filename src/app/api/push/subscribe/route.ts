// API Route: Subscribe to Push Notifications
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { socketLogger } from "@/lib/logger";

const PushSubscriptionSchema = z.object({
    endpoint: z.string().url("Endpoint inválido"),
    p256dh: z.string().min(1, "p256dh requerido"),
    auth: z.string().min(1, "auth requerido"),
});

export async function POST(request: Request) {
    const limited = await applyRateLimit(request, "push:subscribe", 10, 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validation = PushSubscriptionSchema.safeParse(body);

        if (!validation.success) {
            const message = validation.error.issues[0]?.message || "Datos inválidos";
            return NextResponse.json(
                { success: false, error: message },
                { status: 400 }
            );
        }

        const { endpoint, p256dh, auth: authKey } = validation.data;

        // Upsert subscription (update if exists, create if not)
        const subscription = await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                p256dh,
                auth: authKey,
                userId: session.user.id
            },
            create: {
                endpoint,
                p256dh,
                auth: authKey,
                userId: session.user.id
            }
        });

        socketLogger.info(
            { userId: session.user.id, subscriptionId: subscription.id },
            "Push subscription saved"
        );

        return NextResponse.json({
            success: true,
            subscriptionId: subscription.id
        });
    } catch (error) {
        socketLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error saving push subscription"
        );
        return NextResponse.json(
            { success: false, error: "Error al guardar suscripción" },
            { status: 500 }
        );
    }
}
