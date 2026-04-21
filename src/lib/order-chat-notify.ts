/**
 * Helper centralizado para disparar notificaciones cuando llega un mensaje
 * nuevo en un OrderChat. Ejecuta 3 canales en paralelo:
 *   1. Push web al destinatario (sendPushToUser) — llega aunque la app esté cerrada
 *   2. Socket event a user:<recipientId> — actualización en vivo si la app está abierta
 *   3. (Nada más) — no hay email, a propósito. El push + el badge alcanzan.
 *
 * Fire-and-forget: los errores se loguean pero no throwean para no bloquear la
 * respuesta del endpoint que guarda el mensaje en la DB.
 */

import { sendPushToUser } from "./push";
import { socketEmit } from "./socket-emit";
import type { OrderChatType } from "@/types/order-chat";

interface NotifyChatMessageParams {
    chatId: string;
    senderId: string;
    senderName: string | null;
    recipientId: string;
    orderId: string;
    orderNumber: string;
    chatType: OrderChatType;
    /** Contenido del mensaje — se trunca a 80 chars para el push body */
    content: string;
    /** URL de destino cuando el usuario toca el push */
    targetUrl: string;
}

/**
 * Label amigable para el rol del remitente, visible en el título del push.
 * Se elige en base al chatType y el rol asumido (participantA | participantB).
 */
function senderLabelFromChat(chatType: OrderChatType, senderIsA: boolean): string {
    // Convención: participantA es buyer en BUYER_*, driver en DRIVER_*
    switch (chatType) {
        case "BUYER_MERCHANT":
            return senderIsA ? "comprador" : "comercio";
        case "BUYER_DRIVER":
            return senderIsA ? "comprador" : "repartidor";
        case "BUYER_SELLER":
            return senderIsA ? "comprador" : "vendedor";
        case "DRIVER_MERCHANT":
            return senderIsA ? "repartidor" : "comercio";
        case "DRIVER_SELLER":
            return senderIsA ? "repartidor" : "vendedor";
        default:
            return "contacto";
    }
}

export async function notifyChatMessage(
    params: NotifyChatMessageParams & { senderIsA: boolean }
): Promise<void> {
    const {
        chatId,
        senderId,
        senderName,
        recipientId,
        orderId,
        orderNumber,
        chatType,
        content,
        targetUrl,
        senderIsA,
    } = params;

    const roleLabel = senderLabelFromChat(chatType, senderIsA);
    const displayName = senderName?.trim() || `tu ${roleLabel}`;
    const title = `💬 Nuevo mensaje de ${displayName}`;
    const truncated =
        content.length > 80 ? content.slice(0, 77).trimEnd() + "…" : content;
    const body = `Pedido #${orderNumber}: ${truncated}`;

    // Tag único por chat para que mensajes consecutivos del mismo chat se
    // colapsen en el sistema operativo en vez de apilar notificaciones.
    const tag = `order-chat-${chatId}`;

    // Canal 1: push web
    const pushPromise = sendPushToUser(recipientId, {
        title,
        body,
        url: targetUrl,
        tag,
        orderId,
    }).catch((err) =>
        console.error(`[order-chat-notify] push failed for ${recipientId}:`, err)
    );

    // Canal 2: socket event al room user:<recipientId>
    // El socket-server debe unir al usuario a user:<userId> al autenticar.
    const socketPromise = socketEmit({
        event: "new_chat_message",
        room: `user:${recipientId}`,
        data: {
            chatId,
            orderId,
            orderNumber,
            chatType,
            senderId,
            senderName: displayName,
            preview: truncated,
            timestamp: new Date().toISOString(),
        },
    }).catch((err) =>
        console.error(`[order-chat-notify] socket emit failed for ${recipientId}:`, err)
    );

    await Promise.allSettled([pushPromise, socketPromise]);
}

/**
 * Construye la URL de destino (deep-link) según el rol del destinatario.
 * Si el usuario toca el push, lo llevamos a la pantalla donde puede
 * responder de inmediato.
 */
export function targetUrlForRecipient(
    chatType: OrderChatType,
    recipientIsA: boolean,
    orderId: string
): string {
    // Convención: participantA es buyer/driver, participantB es la contraparte
    switch (chatType) {
        case "BUYER_MERCHANT":
            return recipientIsA
                ? `/mis-pedidos/${orderId}`
                : `/comercios/pedidos`;
        case "BUYER_DRIVER":
            return recipientIsA
                ? `/mis-pedidos/${orderId}`
                : `/repartidor/dashboard`;
        case "BUYER_SELLER":
            return recipientIsA
                ? `/mis-pedidos/${orderId}`
                : `/vendedor/pedidos`;
        case "DRIVER_MERCHANT":
            return recipientIsA
                ? `/repartidor/dashboard`
                : `/comercios/pedidos`;
        case "DRIVER_SELLER":
            return recipientIsA
                ? `/repartidor/dashboard`
                : `/vendedor/pedidos`;
        default:
            return "/";
    }
}
