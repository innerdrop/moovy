// API: Operator - Toggle online/offline status
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { isOnline } = await request.json();

        const operator = await (prisma as any).supportOperator.findUnique({
            where: { userId }
        });

        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

        const updated = await (prisma as any).supportOperator.update({
            where: { id: operator.id },
            data: {
                isOnline: isOnline === true,
                lastSeenAt: new Date()
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating operator status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST — igual que PATCH pero por POST, para poder usarlo con navigator.sendBeacon
// (que solo hace POST) en el 'pagehide' del portal → marcar offline al cerrar.
// También lo usa el heartbeat periódico (isOnline:true refresca lastSeenAt).
// feat/chat-en-vivo.
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const userId = (session.user as any).id;

        let isOnline = false;
        try {
            const body = await request.json();
            isOnline = body?.isOnline === true;
        } catch {
            // sendBeacon puede mandar body como texto/blob; si no parsea, asumimos offline.
            isOnline = false;
        }

        const operator = await (prisma as any).supportOperator.findUnique({ where: { userId } });
        if (!operator || !operator.isActive) {
            return NextResponse.json({ error: "No eres un operador de soporte" }, { status: 403 });
        }

        await (prisma as any).supportOperator.update({
            where: { id: operator.id },
            data: { isOnline, lastSeenAt: new Date() },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error POST operator status:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
