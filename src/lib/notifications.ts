// Push Notification Utilities
// Notifies buyers, merchants, and sellers when order events happen

import { sendPushToUser } from './push';
import { prisma } from './prisma';

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
/**
 * Send push notification to merchant owner when a new order arrives.
 * Resolves the merchant's owner userId internally.
 */
export async function notifyMerchant(
    merchantId: string,
    orderNumber: string,
    total: number,
    buyerName?: string
): Promise<number> {
    const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { ownerId: true, name: true },
    });

    if (!merchant) return 0;

    return sendPushToUser(merchant.ownerId, {
        title: '🔔 ¡Nuevo pedido!',
        body: `Pedido ${orderNumber} — ${formatMoney(total)}${buyerName ? ` de ${buyerName}` : ''}`,
        url: '/comercios/pedidos',
        tag: 'new-order',
    });
}

/**
 * Send push notification to marketplace seller when a new order arrives.
 * Resolves the seller's userId internally.
 */
export async function notifySeller(
    sellerId: string,
    orderNumber: string,
    total: number,
    buyerName?: string
): Promise<number> {
    const seller = await prisma.sellerProfile.findUnique({
        where: { id: sellerId },
        select: { userId: true, displayName: true },
    });

    if (!seller) return 0;

    return sendPushToUser(seller.userId, {
        title: '🛍️ ¡Nueva venta!',
        body: `Pedido ${orderNumber} — ${formatMoney(total)}${buyerName ? ` de ${buyerName}` : ''}`,
        url: '/vendedor/pedidos',
        tag: 'new-order',
    });
}

/**
 * Send push notification to driver when order is ready for pickup.
 * Resolves the driver's userId internally.
 */
export async function notifyDriver(
    driverId: string,
    orderNumber: string,
    merchantName?: string,
    orderId?: string
): Promise<number> {
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { userId: true },
    });

    if (!driver) return 0;

    return sendPushToUser(driver.userId, {
        title: '📦 Pedido listo para retirar',
        body: `Pedido ${orderNumber}${merchantName ? ` en ${merchantName}` : ''} está listo. ¡Andá a buscarlo!`,
        url: orderId ? `/repartidor/pedidos/${orderId}` : '/repartidor/dashboard',
        tag: 'order-ready',
    });
}

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
