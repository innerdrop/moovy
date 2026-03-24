// API Route: Unsubscribe from Push Notifications
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { socketLogger } from "@/lib/logger";

const UnsubscribeSchema = z.object({
    endpoint: z.string().url("Endpoint inválido"),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validation = UnsubscribeSchema.safeParse(body);

        if (!validation.success) {
            const message = validation.error.issues[0]?.message || "Datos inválidos";
            return NextResponse.json(
                { success: false, error: message },
                { status: 400 }
            );
        }

        const { endpoint } = validation.data;

        // Delete subscription
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                userId: session.user.id
            }
        });

        socketLogger.info(
            { userId: session.user.id, endpoint },
            "Push subscription removed"
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        socketLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error removing push subscription"
        );
        return NextResponse.json(
            { success: false, error: "Error al eliminar suscripción" },
            { status: 500 }
        );
    }
}
