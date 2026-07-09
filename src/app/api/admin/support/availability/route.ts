// API: Admin — disponibilidad para chat en vivo desde OPS.
// Rama: feat/chat-en-vivo-y-logo-tienda
//
// Decisión founder: el equipo atiende el chat en vivo DESDE OPS. Este endpoint
// deja que un admin se ponga "Disponible / No disponible" sin pasar por el portal
// /soporte: crea (si no existe) su registro SupportOperator y prende/apaga isOnline
// + refresca lastSeenAt (que es el "latido"). El mismo POST se usa para el toggle,
// para el heartbeat periódico (available:true cada ~30s) y para el aviso al cerrar
// la pestaña (sendBeacon con available:false).
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const OPERATOR_STALE_MS = 2 * 60 * 1000;

// GET — estado actual de disponibilidad del admin (con staleness).
export async function GET() {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const op = await (prisma as any).supportOperator.findUnique({
        where: { userId: admin.userId },
        select: { isOnline: true, isActive: true, lastSeenAt: true },
    });
    const fresh = !!op && op.isActive && op.isOnline &&
        op.lastSeenAt && new Date(op.lastSeenAt).getTime() > Date.now() - OPERATOR_STALE_MS;
    return NextResponse.json({ available: fresh });
}

// POST { available: boolean } — toggle / heartbeat / beacon de cierre.
export async function POST(request: Request) {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    let available = false;
    try {
        const body = await request.json();
        available = body?.available === true;
    } catch {
        available = false; // sendBeacon sin JSON parseable → offline
    }

    const displayName = admin.name || admin.email || "Equipo Moovy";

    await (prisma as any).supportOperator.upsert({
        where: { userId: admin.userId },
        create: {
            userId: admin.userId,
            displayName,
            isActive: true,
            isOnline: available,
            lastSeenAt: new Date(),
        },
        update: {
            isActive: true,
            isOnline: available,
            lastSeenAt: new Date(),
        },
    });

    return NextResponse.json({ available });
}
