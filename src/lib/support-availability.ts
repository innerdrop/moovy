// ¿Hay soporte disponible ahora mismo? (algún operador activo, online y fresco)
// Rama: feat/chat-en-vivo-y-logo-tienda
//
// Decisión founder: el usuario solo puede ESCRIBIR a soporte si hay un operador
// conectado (OPS debe ponerse "Disponible"). Este helper es la fuente única del
// chequeo, usado por los endpoints de crear/enviar mensaje (defensa server-side).
import { prisma } from "@/lib/prisma";

const OPERATOR_STALE_MS = 2 * 60 * 1000;

export async function isSupportAvailable(): Promise<boolean> {
    try {
        const op = await (prisma as any).supportOperator.findFirst({
            where: {
                isActive: true,
                isOnline: true,
                lastSeenAt: { gte: new Date(Date.now() - OPERATOR_STALE_MS) },
            },
            select: { id: true },
        });
        return !!op;
    } catch {
        return false;
    }
}

export const SUPPORT_UNAVAILABLE_MESSAGE =
    "El soporte no está disponible en este momento. Escribinos cuando estemos en línea.";
