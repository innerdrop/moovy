// Push Notification Utilities
// Server-side utilities for sending Web Push notifications

import webpush from 'web-push';
import { prisma } from './prisma';

// Configure web-push with VAPID details
const vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
const vapidPrivateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
const vapidEmail = (process.env.VAPID_EMAIL || 'mailto:soporte@moovy.com').trim();

let vapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
    try {
        webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
        vapidConfigured = true;
        console.log('[Push] VAPID configured successfully');
    } catch (error) {
        console.warn('[Push] Invalid VAPID keys, push notifications disabled:', error);
    }
}

interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    orderId?: string;
    actions?: Array<{ action: string; title: string }>;
}

/**
 * Send push notification to a specific user
 * @param userId - User ID to send notification to
 * @param payload - Notification payload
 * @returns Number of successful sends
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!vapidConfigured) {
        console.warn('[Push] VAPID not configured, skipping push notification');
        return 0;
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        if (subscriptions.length === 0) {
            console.log(`[Push] No subscriptions found for user ${userId}`);
            return 0;
        }

        let successCount = 0;
        const failedEndpoints: string[] = [];

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    },
                    JSON.stringify(payload)
                );
                successCount++;
                console.log(`[Push] Sent to ${sub.endpoint.slice(-20)}`);
            } catch (error: any) {
                console.error(`[Push] Failed to send to ${sub.endpoint.slice(-20)}:`, error.message);

                // If subscription is invalid/expired, remove it
                if (error.statusCode === 404 || error.statusCode === 410) {
                    failedEndpoints.push(sub.endpoint);
                }
            }
        }

        // Clean up invalid subscriptions
        if (failedEndpoints.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: { endpoint: { in: failedEndpoints } }
            });
            console.log(`[Push] Cleaned up ${failedEndpoints.length} invalid subscriptions`);
        }

        return successCount;
    } catch (error) {
        console.error('[Push] Error sending push notification:', error);
        return 0;
    }
}

/**
 * Send push notification about new delivery offer
 */
export async function sendNewOfferNotification(
    userId: string,
    merchantName: string,
    estimatedEarnings: number,
    orderId: string
): Promise<number> {
    return sendPushToUser(userId, {
        title: '🚀 ¡Nueva oferta de entrega!',
        body: `${merchantName} - Ganancia estimada: $${estimatedEarnings}`,
        url: '/repartidor/dashboard',
        tag: 'new-offer',
        orderId,
        actions: [
            { action: 'view', title: 'Ver oferta' },
            { action: 'dismiss', title: 'Ignorar' }
        ]
    });
}

/**
 * Send push notification when order is ready for pickup
 */
export async function sendOrderReadyNotification(
    driverUserId: string,
    merchantName: string,
    orderNumber: string,
    orderId: string
): Promise<number> {
    return sendPushToUser(driverUserId, {
        title: '📦 ¡Pedido listo para recoger!',
        body: `${merchantName} tiene listo el pedido #${orderNumber}. ¡Ve a buscarlo!`,
        url: '/repartidor/dashboard',
        tag: 'order-ready',
        orderId,
        actions: [
            { action: 'navigate', title: 'Ir al comercio' }
        ]
    });
}
