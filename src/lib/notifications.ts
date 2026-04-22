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
    PAYMENT_REJECTED: {
        title: '❌ Pago rechazado',
        body: (n) => `Tu pago para el pedido ${n} fue rechazado. Por favor intentá nuevamente.`,
    },
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

/**
 * ISSUE-001: PIN doble — push dedicado con el código de entrega.
 *
 * Se dispara junto con el push de PICKED_UP cuando el driver ya retiró el pedido,
 * para que el comprador tenga el código visible en el lock screen antes de que el
 * repartidor toque timbre. El tag es distinto de `order-picked_up` para no
 * colapsar con el push genérico.
 *
 * No incluimos el PIN completo en la URL de profundidad — el comprador lo ve en
 * el cuerpo de la notificación y también en la pantalla de detalle del pedido.
 */
export async function notifyBuyerDeliveryPin(
    userId: string,
    orderNumber: string,
    deliveryPin: string,
    orderId?: string
): Promise<number> {
    const deepLink = orderId ? `/mis-pedidos/${orderId}` : '/mis-pedidos';

    return sendPushToUser(userId, {
        title: '🔐 Tu código de entrega',
        body: `Decíselo al repartidor al recibir el pedido ${orderNumber}: ${deliveryPin}`,
        url: deepLink,
        tag: `order-pin-${orderNumber}`,
    });
}

/**
 * ISSUE-013: Push "tu repartidor está cerca".
 *
 * Se dispara UNA sola vez cuando el driver entra en un radio de 300m del destino
 * mientras el pedido está en fase PICKED_UP / IN_DELIVERY. El helper también
 * recuerda el PIN de entrega en el body, para que el buyer lo tenga a mano sin
 * entrar a la app. Idempotencia: el caller debe setear `nearDestinationNotified`
 * atómicamente antes de invocar esta función — si el update atómico no afecta
 * filas, no llamamos al push.
 *
 * Tag distinto de `order-pin-*` y `order-in_delivery` para no colapsar con
 * notifications previas: queremos que aparezca como un push nuevo en el lock
 * screen (el último, pero no reemplazando los anteriores de contexto).
 */
export async function notifyBuyerDriverNear(
    userId: string,
    orderNumber: string,
    orderId: string,
    deliveryPin?: string | null
): Promise<number> {
    const deepLink = `/mis-pedidos/${orderId}`;

    // Si tenemos el PIN (pedido ya PICKED_UP), lo recordamos en el body.
    // Si no (caso raro: push se disparó antes del PICKED_UP), body genérico.
    const body = deliveryPin
        ? `Tené listo el código de entrega: ${deliveryPin}`
        : `Tu pedido ${orderNumber} está por llegar. Revisá la app.`;

    return sendPushToUser(userId, {
        title: '🏍️ Tu repartidor está cerca',
        body,
        url: deepLink,
        tag: `order-near-${orderNumber}`,
    });
}
