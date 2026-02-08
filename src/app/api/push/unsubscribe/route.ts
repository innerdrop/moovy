// API Route: Unsubscribe from Push Notifications
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json(
                { error: "Falta endpoint" },
                { status: 400 }
            );
        }

        // Delete subscription
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                userId: session.user.id
            }
        });

        console.log(`[Push] Subscription removed for user ${session.user.id}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Push] Error removing subscription:", error);
        return NextResponse.json(
            { error: "Error al eliminar suscripción" },
            { status: 500 }
        );
    }
}
