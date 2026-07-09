// Notificación en tiempo real de mensajes de soporte (Socket.io).
// Rama: feat/chat-en-vivo-y-logo-tienda
//
// Espejo de order-chat-notify.ts pero para soporte. Emite `new_support_message`
// al room del destinatario usando el auto-join `user:<userId>` del socket-server
// (no hace falta tocar el socket-server). Fire-and-forget: nunca rompe el endpoint.
//
//   - Mensaje del STAFF (isFromAdmin) → al usuario dueño del chat.
//   - Mensaje del USUARIO → a todos los operadores disponibles (incluye al admin
//     que se puso "Disponible" en OPS, que también es un SupportOperator online).
import { prisma } from "@/lib/prisma";
import { socketEmit } from "@/lib/socket-emit";

const OPERATOR_STALE_MS = 2 * 60 * 1000;

export async function notifySupportMessage(opts: {
    chatId: string;
    chatUserId: string;
    isFromAdmin: boolean;
    message: unknown;
}): Promise<void> {
    try {
        const data = { chatId: opts.chatId, message: opts.message };
        if (opts.isFromAdmin) {
            // Respuesta del equipo → al usuario dueño del chat.
            socketEmit({ event: "new_support_message", room: `user:${opts.chatUserId}`, data }).catch(() => {});
        } else {
            // Mensaje del usuario → a todos los operadores disponibles (frescos).
            const ops = await (prisma as any).supportOperator.findMany({
                where: {
                    isActive: true,
                    isOnline: true,
                    lastSeenAt: { gte: new Date(Date.now() - OPERATOR_STALE_MS) },
                },
                select: { userId: true },
            });
            for (const op of ops as { userId: string }[]) {
                socketEmit({ event: "new_support_message", room: `user:${op.userId}`, data }).catch(() => {});
            }
        }
    } catch (err) {
        console.error("[support-notify] fallo emitiendo:", err);
    }
}
