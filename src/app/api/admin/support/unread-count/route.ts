// API: Admin — cantidad de tickets con mensajes del usuario sin leer por el equipo.
// Rama: feat/chat-en-vivo-y-logo-tienda
// Alimenta el badge de "Soporte" en el sidebar de OPS.
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        // Tickets que tienen al menos un mensaje del usuario (isFromAdmin:false)
        // todavía sin leer (isRead:false). Se marca leído al abrir el ticket en OPS.
        const count = await (prisma as any).supportChat.count({
            where: { messages: { some: { isFromAdmin: false, isRead: false } } },
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error support unread-count:", error);
        return NextResponse.json({ count: 0 });
    }
}
