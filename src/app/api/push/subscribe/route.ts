// API Route: Subscribe to Push Notifications
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
    const limited = applyRateLimit(request, "push:subscribe", 10, 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { endpoint, p256dh, auth: authKey } = await request.json();

        if (!endpoint || !p256dh || !authKey) {
            return NextResponse.json(
                { error: "Faltan datos de suscripción" },
                { status: 400 }
            );
        }

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

        console.log(`[Push] Subscription saved for user ${session.user.id}`);

        return NextResponse.json({
            success: true,
            subscriptionId: subscription.id
        });
    } catch (error) {
        console.error("[Push] Error saving subscription:", error);
        return NextResponse.json(
            { error: "Error al guardar suscripción" },
            { status: 500 }
        );
    }
}
