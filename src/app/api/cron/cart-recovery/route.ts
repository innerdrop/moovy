/**
 * Cron: Recuperación de carritos abandonados
 *
 * Detecta carritos con items que no se modificaron en X horas
 * y envía recordatorios por email + push. Máximo 2 recordatorios
 * por carrito (1h y 24h después del abandono).
 *
 * Frecuencia recomendada: cada 30 minutos
 * Protected by CRON_SECRET
 *
 * Config (MoovyConfig):
 *   cart_recovery_enabled: "true" | "false"
 *   cart_recovery_first_reminder_hours: "2"    (horas desde última actividad)
 *   cart_recovery_second_reminder_hours: "24"
 *   cart_recovery_max_reminders: "2"
 *   cart_recovery_min_cart_value: "5000"        (valor mínimo en ARS para enviar)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { sendCartAbandonmentEmail } from "@/lib/email-p0";
import { sendPushToUser } from "@/lib/push";

const cronLogger = logger.child({ context: "cron-cart-recovery" });

/** Read a MoovyConfig value by key with default fallback */
async function getConfigValue(key: string, defaultValue: string): Promise<string> {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    return config?.value ?? defaultValue;
}

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET timing-safe comparison
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            cronLogger.warn({}, "Unauthorized cron request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if cart recovery is enabled
        const enabled = await getConfigValue("cart_recovery_enabled", "true");
        if (enabled !== "true") {
            return NextResponse.json({
                success: true,
                message: "Cart recovery is disabled",
                processed: 0
            });
        }

        // Read config values
        const firstReminderHours = parseFloat(await getConfigValue("cart_recovery_first_reminder_hours", "2"));
        const secondReminderHours = parseFloat(await getConfigValue("cart_recovery_second_reminder_hours", "24"));
        const maxReminders = parseInt(await getConfigValue("cart_recovery_max_reminders", "2"), 10);
        const minCartValue = parseFloat(await getConfigValue("cart_recovery_min_cart_value", "5000"));

        const now = new Date();

        // Find abandoned carts: items non-empty, not recently modified, under max reminders
        const abandonedCarts = await prisma.savedCart.findMany({
            where: {
                reminderCount: { lt: maxReminders },
                cartValue: { gte: minCartValue },
                // updatedAt old enough for at least 1st reminder
                updatedAt: {
                    lt: new Date(now.getTime() - firstReminderHours * 60 * 60 * 1000)
                }
            },
            take: 50, // Process in batches to avoid OOM
            orderBy: { updatedAt: "asc" } // Oldest first
        });

        let emailsSent = 0;
        let pushSent = 0;
        let skipped = 0;

        for (const cart of abandonedCarts) {
            try {
                // Parse items and validate cart has actual items
                const items = cart.items as Array<{
                    id?: string;
                    name?: string;
                    price?: number;
                    quantity?: number;
                    image?: string;
                }>;

                if (!Array.isArray(items) || items.length === 0) {
                    skipped++;
                    continue;
                }

                // Determine which reminder to send based on reminderCount
                const hoursSinceUpdate = (now.getTime() - cart.updatedAt.getTime()) / (1000 * 60 * 60);

                // For 2nd reminder: needs enough time since last reminder
                if (cart.reminderCount === 1) {
                    if (hoursSinceUpdate < secondReminderHours) {
                        skipped++;
                        continue;
                    }
                }

                // Check if user placed an order since cart was last updated
                // (they may have checked out through another flow)
                const recentOrder = await prisma.order.findFirst({
                    where: {
                        userId: cart.userId,
                        createdAt: { gt: cart.updatedAt }
                    },
                    select: { id: true }
                });

                if (recentOrder) {
                    // User already ordered — clean up the abandoned state
                    await prisma.savedCart.update({
                        where: { id: cart.id },
                        data: { recoveredAt: now, reminderCount: maxReminders }
                    });
                    skipped++;
                    continue;
                }

                // Get user info for email
                const user = await prisma.user.findUnique({
                    where: { id: cart.userId, deletedAt: null, isSuspended: false },
                    select: { id: true, email: true, firstName: true, name: true }
                });

                if (!user || !user.email) {
                    skipped++;
                    continue;
                }

                const userName = user.firstName || user.name?.split(" ")[0] || "Usuario";
                const isSecondReminder = cart.reminderCount === 1;

                // Build items summary for the email (max 5 items shown)
                const topItems = items.slice(0, 5).map(item => ({
                    name: item.name || "Producto",
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    image: item.image
                }));
                const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const totalValue = items.reduce((sum, item) =>
                    sum + ((item.price || 0) * (item.quantity || 1)), 0);

                // Send email
                const emailSent = await sendCartAbandonmentEmail({
                    email: user.email,
                    userName,
                    items: topItems,
                    totalItems,
                    totalValue,
                    isSecondReminder,
                    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://somosmoovy.com"}/checkout`
                });

                if (emailSent) emailsSent++;

                // Send push notification
                const pushTitle = isSecondReminder
                    ? "¡Tu carrito te espera! 🛒"
                    : "Olvidaste algo en tu carrito 🛒";
                const pushBody = isSecondReminder
                    ? `${userName}, tenés ${totalItems} producto${totalItems > 1 ? "s" : ""} esperándote. ¡No te los pierdas!`
                    : `${userName}, dejaste ${totalItems} producto${totalItems > 1 ? "s" : ""} en tu carrito. ¿Completamos tu pedido?`;

                sendPushToUser(user.id, {
                    title: pushTitle,
                    body: pushBody,
                    url: "/checkout",
                    tag: "cart-recovery"
                }).then(sent => { if (sent > 0) pushSent++; })
                  .catch(err => cronLogger.error({ userId: user.id, error: err }, "Push error cart recovery"));

                // Update reminder tracking
                await prisma.savedCart.update({
                    where: { id: cart.id },
                    data: {
                        reminderCount: { increment: 1 },
                        lastRemindedAt: now
                    }
                });

                cronLogger.info({
                    userId: user.id,
                    cartId: cart.id,
                    reminderNumber: cart.reminderCount + 1,
                    cartValue: totalValue,
                    itemCount: totalItems
                }, "Cart recovery reminder sent");

            } catch (cartError) {
                cronLogger.error({ cartId: cart.id, error: cartError }, "Error processing abandoned cart");
                // Continue with next cart
            }
        }

        const result = {
            success: true,
            timestamp: now.toISOString(),
            found: abandonedCarts.length,
            emailsSent,
            pushSent,
            skipped
        };

        cronLogger.info(result, "Cart recovery cron completed");
        return NextResponse.json(result);

    } catch (error) {
        cronLogger.error({ error }, "Cart recovery cron failed");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
