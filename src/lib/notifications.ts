// Buyer Push Notification Utilities
// Notifies the buyer when their order status changes

import { sendPushToUser } from './push';

/** Extra context for enriched push notifications */
interface NotifyContext {
    total?: number;
    merchantName?: string;
    orderId?: string;
}

/**
 * Format currency for push messages
 */
function formatMoney(amount: number): string {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Status-to-message mapping for buyer notifications (enriched with context)
 */
type MessageBuilder = { title: string; body: (n: string, ctx: NotifyContext) => string };

const STATUS_MESSAGES: Record<string, MessageBuilder> = {
    CONFIRMED: {
        title: '✅ Pedido confirmado',
        body: (n, ctx) =>
            ctx.merchantName && ctx.total
                ? `Pedido confirmado · ${ctx.merchantName} · ${formatMoney(ctx.total)}`
                : `Tu pedido ${n} fue confirmado ✅`,
    },
    PREPARING: {
        title: '👨‍🍳 Preparando tu pedido',
        body: (n, ctx) =>
            ctx.merchantName
                ? `${ctx.merchantName} está preparando tu pedido${ctx.total ? ` de ${formatMoney(ctx.total)}` : ''}`
                : `Tu pedido ${n} se está preparando 👨‍🍳`,
    },
    READY: {
        title: '📦 Pedido listo',
        body: (n, ctx) =>
            ctx.merchantName
                ? `Tu pedido de ${ctx.merchantName} está listo para retirar 📦`
                : `Tu pedido ${n} está listo 📦`,
    },
    DRIVER_ASSIGNED: {
        title: '🏍️ Repartidor en camino',
        body: (n, ctx) =>
            ctx.merchantName
                ? `Un repartidor va en camino a ${ctx.merchantName}`
                : `Un repartidor va en camino al comercio 🏍️`,
    },
    DRIVER_ARRIVED: {
        title: '📍 Repartidor en el comercio',
        body: (n) => `El repartidor llegó al comercio para retirar tu pedido 📍`,
    },
    PICKED_UP: {
        title: '📦 Pedido retirado',
        body: (n) => `Tu pedido fue retirado y viene en camino 📦`,
    },
    IN_DELIVERY: {
        title: '🛵 En camino',
        body: (n, ctx) =>
            ctx.merchantName && ctx.total
                ? `¡Tu pedido de ${formatMoney(ctx.total)} de ${ctx.merchantName} está en camino!`
                : `Tu pedido ${n} está en camino 🛵`,
    },
    DELIVERED: {
        title: '✅ Pedido entregado',
        body: () => '¡Pedido entregado! ¿Cómo fue tu experiencia?',
    },
    CANCELLED: {
        title: '❌ Pedido cancelado',
        body: (n) => `Tu pedido ${n} fue cancelado ❌`,
    },
    SCHEDULED_CONFIRMED: {
        title: '📅 Pedido programado confirmado',
        body: (n, ctx) =>
            ctx.merchantName
                ? `${ctx.merchantName} confirmó tu pedido programado ${n} 📅`
                : `Tu pedido programado ${n} fue confirmado por el vendedor 📅`,
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
 * @param context - Optional extra context for enriched messages
 */
export async function notifyBuyer(
    userId: string,
    status: string,
    orderNumber: string,
    context?: NotifyContext
): Promise<number> {
    const message = STATUS_MESSAGES[status];

    if (!message) {
        console.log(`[Push] No buyer notification configured for status: ${status}`);
        return 0;
    }

    const ctx = context || {};
    const deepLink = ctx.orderId ? `/mis-pedidos/${ctx.orderId}` : '/mis-pedidos';

    return sendPushToUser(userId, {
        title: message.title,
        body: message.body(orderNumber, ctx),
        url: deepLink,
        tag: `order-${status.toLowerCase()}`,
    });
}
