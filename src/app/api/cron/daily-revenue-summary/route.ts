/**
 * Cron: Daily Revenue Summary
 * Rama: feat/sentry-revenue-error-pages
 *
 * Corre cada día a las 9 AM ART (12:00 UTC). Calcula KPIs del día anterior y
 * envía un email matutino al CEO/admin con el resumen.
 *
 * KPIs incluidos:
 *   - Pedidos DELIVERED ayer + delta % vs el día previo
 *   - GMV (suma de subtotales)
 *   - Revenue Moovy = sum(moovyCommission) + sum(operationalCost)
 *   - Pagos a comercios (sum(merchantPayout))
 *   - Pagos a repartidores (sum(driverPayoutAmount) — fallback a tripCost × 0.8)
 *   - Pedidos cancelados ayer
 *   - No-shows reportados ayer
 *   - Drivers/comercios activos
 *   - Top 3 comercios por pedidos
 *   - Drivers con fraudScore >= 2 (alerta — 3 = auto-suspend)
 *   - Pedidos AWAITING_PAYMENT acumulados (señal de cron stale)
 *
 * Idempotente: usa AuditLog con eventDate como key. Si ya se mandó hoy,
 * no re-envía. Re-trigger manual desde /ops/crons también respeta esto.
 *
 * Protected: CRON_SECRET vía verifyBearerToken.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordCronRun } from "@/lib/cron-health";
import { verifyBearerToken } from "@/lib/env-validation";
import { sendDailyRevenueSummaryEmail } from "@/lib/email-admin-ops";
import logger from "@/lib/logger";

const cronLogger = logger.child({ context: "cron-daily-revenue-summary" });

/**
 * Calcula los rangos de "ayer" y "anteayer" en horario ART (UTC-3).
 * Ushuaia y Buenos Aires comparten timezone (no DST).
 *
 * Devuelve fechas en UTC para queries Prisma. La labelDate se renderiza en
 * timezone local Argentina con `toLocaleDateString("es-AR")`.
 */
function getYesterdayWindow(now = new Date()): {
    start: Date;
    end: Date;
    prevStart: Date;
    prevEnd: Date;
    labelDate: string;
} {
    // Convertir "now" a hora local AR. Argentina = UTC-3 fijo (no DST).
    const ART_OFFSET_MS = -3 * 60 * 60 * 1000;
    const nowAR = new Date(now.getTime() + ART_OFFSET_MS);

    // Inicio del día actual en AR (00:00 AR)
    const todayARStart = new Date(Date.UTC(
        nowAR.getUTCFullYear(),
        nowAR.getUTCMonth(),
        nowAR.getUTCDate(),
        0, 0, 0,
    ));

    // En UTC equivale a 03:00 UTC del día actual AR
    const todayUTC = new Date(todayARStart.getTime() - ART_OFFSET_MS);

    // Ayer = desde 1 día antes hasta inicio de hoy
    const yesterdayUTC = new Date(todayUTC.getTime() - 24 * 3_600_000);
    const dayBeforeUTC = new Date(yesterdayUTC.getTime() - 24 * 3_600_000);

    // Label en español argentino: "lunes 5 de mayo de 2026"
    const labelDate = yesterdayUTC.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Argentina/Buenos_Aires",
    });

    return {
        start: yesterdayUTC,
        end: todayUTC,
        prevStart: dayBeforeUTC,
        prevEnd: yesterdayUTC,
        labelDate,
    };
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            cronLogger.warn({}, "Unauthorized cron request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return await recordCronRun<NextResponse>("daily-revenue-summary", async () => {
            const win = getYesterdayWindow();
            cronLogger.info(
                { start: win.start, end: win.end, label: win.labelDate },
                "Computing daily revenue summary",
            );

            // ── Idempotencia: si ya mandamos el mail de este día, no re-mandar ──
            // Usamos AuditLog con un actionKey específico. Esto vale tanto para el
            // cron auto-disparado como para retriggers manuales desde /ops/crons.
            const idempotencyKey = `daily-revenue-summary-${win.start.toISOString().slice(0, 10)}`;
            const alreadySent = await prisma.auditLog.findFirst({
                where: { action: idempotencyKey },
                select: { id: true },
            });
            if (alreadySent) {
                cronLogger.info({ idempotencyKey }, "Already sent for this date, skipping");
                return {
                    result: NextResponse.json({
                        success: true,
                        skipped: true,
                        reason: "already_sent_today",
                        date: win.labelDate,
                    }) as NextResponse,
                    itemsProcessed: 0,
                };
            }

            // ── Pedidos DELIVERED ayer (incluyendo single + multi-vendor) ──
            const deliveredOrders = await prisma.order.findMany({
                where: {
                    status: "DELIVERED",
                    deliveredAt: { gte: win.start, lt: win.end },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    subtotal: true,
                    deliveryFee: true,
                    merchantPayout: true,
                    moovyCommission: true,
                    driverId: true,
                    merchantId: true,
                    merchant: { select: { businessName: true } },
                    isMultiVendor: true,
                    subOrders: {
                        select: {
                            subtotal: true,
                            // SubOrder usa sellerPayout como pago al merchant/seller (un solo campo).
                            // No existe SubOrder.merchantPayout — eso vive solo en Order.
                            sellerPayout: true,
                            moovyCommission: true,
                            tripCost: true,
                            operationalCost: true,
                            driverPayoutAmount: true,
                            driverId: true,
                            merchantId: true,
                            merchant: { select: { businessName: true } },
                        },
                    },
                },
            });

            const ordersDelivered = deliveredOrders.length;

            // ── Pedidos DELIVERED día anterior (para delta %) ──
            const prevDelivered = await prisma.order.count({
                where: {
                    status: "DELIVERED",
                    deliveredAt: { gte: win.prevStart, lt: win.prevEnd },
                    deletedAt: null,
                },
            });

            const ordersDeltaPct =
                prevDelivered === 0
                    ? null
                    : ((ordersDelivered - prevDelivered) / prevDelivered) * 100;

            // ── Cálculos financieros ──
            // GMV = suma de subtotales (productos vendidos sin delivery fee)
            // moovyRevenue = comisiones + costo operativo embebido (5%)
            // merchantPayouts / driverPayouts según los snapshots de SubOrder
            let gmv = 0;
            let moovyRevenue = 0;
            let merchantPayouts = 0;
            let driverPayouts = 0;
            const merchantStats = new Map<string, { name: string; orders: number; revenue: number }>();
            const activeDriverIds = new Set<string>();
            const activeMerchantIds = new Set<string>();

            for (const o of deliveredOrders) {
                if (o.isMultiVendor && o.subOrders.length > 0) {
                    // Multi-vendor: usar SubOrders como fuente de verdad
                    for (const so of o.subOrders) {
                        gmv += so.subtotal || 0;
                        moovyRevenue += (so.moovyCommission || 0) + (so.operationalCost || 0);
                        // SubOrder.sellerPayout cubre tanto merchants como sellers
                        // (un solo campo, según la entidad asociada).
                        merchantPayouts += so.sellerPayout || 0;
                        // Driver payout: snapshot si existe, fallback al 80% de tripCost
                        const driverPay = so.driverPayoutAmount ?? (so.tripCost ? so.tripCost * 0.8 : 0);
                        driverPayouts += driverPay;
                        if (so.driverId) activeDriverIds.add(so.driverId);
                        if (so.merchantId) {
                            activeMerchantIds.add(so.merchantId);
                            const name = so.merchant?.businessName || "Comercio";
                            const key = so.merchantId;
                            const cur = merchantStats.get(key) || { name, orders: 0, revenue: 0 };
                            cur.orders += 1;
                            cur.revenue += so.subtotal || 0;
                            merchantStats.set(key, cur);
                        }
                    }
                } else {
                    // Single-vendor (Order directo, sin SubOrder)
                    gmv += o.subtotal || 0;
                    moovyRevenue += o.moovyCommission || 0;
                    merchantPayouts += o.merchantPayout || 0;
                    // Para single-vendor sin SubOrder snapshot, aproximamos driver payout
                    // como 80% del deliveryFee (que ya tiene el operativo embebido).
                    // Mejor approximation: deliveryFee × 0.8 — el 5% operativo va a Moovy.
                    const inferredDriverPay = (o.deliveryFee || 0) * 0.8;
                    driverPayouts += inferredDriverPay;
                    // Para single-vendor, el costo operativo NO está separado en el schema
                    // de Order — se incluye en deliveryFee. Aproximamos: 5% del subtotal.
                    moovyRevenue += (o.subtotal || 0) * 0.05;
                    if (o.driverId) activeDriverIds.add(o.driverId);
                    if (o.merchantId) {
                        activeMerchantIds.add(o.merchantId);
                        const name = o.merchant?.businessName || "Comercio";
                        const cur = merchantStats.get(o.merchantId) || { name, orders: 0, revenue: 0 };
                        cur.orders += 1;
                        cur.revenue += o.subtotal || 0;
                        merchantStats.set(o.merchantId, cur);
                    }
                }
            }

            const topMerchants = Array.from(merchantStats.values())
                .sort((a, b) => b.orders - a.orders)
                .slice(0, 3);

            // ── Cancelados ayer ──
            // Order no tiene cancelledAt, usamos updatedAt como proxy temporal.
            // Aceptable: una vez cancelado, raramente se actualiza por otra razón.
            const ordersCancelled = await prisma.order.count({
                where: {
                    status: "CANCELLED",
                    updatedAt: { gte: win.start, lt: win.end },
                },
            });

            // ── No-shows reportados ayer ──
            const noShows = await prisma.order.count({
                where: {
                    noShowReportedAt: { gte: win.start, lt: win.end },
                },
            });

            // ── fraudScore alto (>=2 en drivers activos no suspendidos) ──
            // Driver no tiene deletedAt — solo isActive + isSuspended
            const fraudDrivers = await prisma.driver.findMany({
                where: {
                    fraudScore: { gte: 2 },
                    isActive: true,
                    isSuspended: false,
                },
                select: {
                    fraudScore: true,
                    user: { select: { name: true } },
                },
                take: 5,
            });
            const fraudAlerts = fraudDrivers.map((d) => ({
                name: d.user?.name || "Repartidor sin nombre",
                score: d.fraudScore || 0,
            }));

            // ── Pedidos en AWAITING_PAYMENT acumulados (señal de cron stale) ──
            const pendingPaymentsStuck = await prisma.order.count({
                where: {
                    paymentStatus: { in: ["AWAITING_PAYMENT", "PENDING"] },
                    createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }, // > 1h
                    deletedAt: null,
                },
            });

            cronLogger.info(
                {
                    ordersDelivered,
                    gmv,
                    moovyRevenue,
                    activeMerchants: activeMerchantIds.size,
                    activeDrivers: activeDriverIds.size,
                    fraudAlertCount: fraudAlerts.length,
                },
                "Computed daily KPIs, sending email",
            );

            // ── Enviar email — fire and forget si falla SMTP ──
            const emailSent = await sendDailyRevenueSummaryEmail({
                reportDateLabel: win.labelDate,
                ordersDelivered,
                ordersDeltaPct,
                gmv,
                moovyRevenue,
                merchantPayouts,
                driverPayouts,
                ordersCancelled,
                noShows,
                activeDrivers: activeDriverIds.size,
                activeMerchants: activeMerchantIds.size,
                topMerchants,
                fraudAlerts,
                pendingPaymentsStuck,
            }).catch((err) => {
                cronLogger.error({ err: String(err) }, "Failed to send daily revenue summary email");
                return false;
            });

            // ── Audit log idempotency ──
            // Buscar primer admin activo para audit log. UserRole es relación,
            // no enum, por eso usamos `some` en vez de `has`.
            const auditUser = await prisma.user.findFirst({
                where: { roles: { some: { role: "ADMIN", isActive: true } } },
                select: { id: true },
            });
            if (auditUser) {
                await prisma.auditLog.create({
                    data: {
                        action: idempotencyKey,
                        entityType: "CronRun",
                        entityId: idempotencyKey,
                        userId: auditUser.id,
                        // AuditLog.details es String? (JSON serializado), no Json
                        details: JSON.stringify({
                            ordersDelivered,
                            gmv: Math.round(gmv),
                            moovyRevenue: Math.round(moovyRevenue),
                            emailSent,
                        }),
                    },
                });
            }

            return {
                result: NextResponse.json({
                    success: true,
                    date: win.labelDate,
                    ordersDelivered,
                    gmv: Math.round(gmv),
                    moovyRevenue: Math.round(moovyRevenue),
                    emailSent,
                }) as NextResponse,
                itemsProcessed: ordersDelivered,
            };
        });
    } catch (error) {
        cronLogger.error({ err: String(error) }, "Error in daily revenue summary");
        return NextResponse.json({ error: "Error processing summary" }, { status: 500 });
    }
}
