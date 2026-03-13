// Buyer Push Notification Utilities
// Notifies the buyer when their order status changes

import { sendPushToUser } from './push';

/**
 * Status-to-message mapping for buyer notifications
 */
const STATUS_MESSAGES: Record<string, { title: string; body: (orderNumber: string) => string }> = {
    CONFIRMED: {
        title: '✅ Pedido confirmado',
        body: (n) => `Tu pedido ${n} fue confirmado ✅`,
    },
    PREPARING: {
        title: '👨‍🍳 Preparando tu pedido',
        body: (n) => `Tu pedido ${n} se está preparando 👨‍🍳`,
    },
    READY: {
        title: '📦 Pedido listo',
        body: (n) => `Tu pedido ${n} está listo 📦`,
    },
    IN_DELIVERY: {
        title: '🛵 En camino',
        body: (n) => `Tu pedido ${n} está en camino 🛵`,
    },
    DELIVERED: {
        title: '✅ Pedido entregado',
        body: (n) => `Tu pedido ${n} fue entregado ✅`,
    },
    CANCELLED: {
        title: '❌ Pedido cancelado',
        body: (n) => `Tu pedido ${n} fue cancelado ❌`,
    },
    SCHEDULED_CONFIRMED: {
        title: '📅 Pedido programado confirmado',
        body: (n) => `Tu pedido programado ${n} fue confirmado por el vendedor 📅`,
    },
    SCHEDULED_CANCELLED: {
        title: '❌ Pedido programado cancelado',
        body: (n) => `Tu pedido programado ${n} fue cancelado. Te reembolsamos ❌`,
    },
};

/**
 * Send a push notification to the buyer about their order status change.
 * Non-blocking: callers should use .catch() to avoid blocking the main flow.
 *
 * @param userId - The buyer's user ID
 * @param status - The new order status
 * @param orderNumber - The order number (e.g. "MOV-A1B2")
 */
export async function notifyBuyer(
    userId: string,
    status: string,
    orderNumber: string
): Promise<number> {
    const message = STATUS_MESSAGES[status];

    if (!message) {
        console.log(`[Push] No buyer notification configured for status: ${status}`);
        return 0;
    }

    return sendPushToUser(userId, {
        title: message.title,
        body: message.body(orderNumber),
        url: '/mis-pedidos',
        tag: `order-${status.toLowerCase()}`,
    });
}
