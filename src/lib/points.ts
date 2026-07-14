// Points System - Core Logic (Biblia Financiera v3)
// Earn: 10 pts por $1,000 (0.01 pts/$1). Valor: 1 pt = $1. Cashback ~1%.
// Niveles por pedidos DELIVERED en 90 días: MOOVER(0), SILVER(3), GOLD(10), BLACK(22) — editables OPS
// Earn rates: MOOVER ×1, SILVER ×1.25, GOLD ×1.5, BLACK ×2
import { prisma } from "@/lib/prisma";
import { sendReferralActivatedEmail } from "@/lib/email-admin-ops";

interface PointsConfig {
    pointsPerDollar: number;
    minPurchaseForPoints: number;
    pointsValue: number;
    minPointsToRedeem: number;
    maxDiscountPercent: number;
    signupBonus: number;
    referralBonus: number;
    refereeBonus: number;
    // feat/moover-bono-resena: reactivado. Puntos por dejar reseña de un pedido
    // entregado (una vez por pedido). La columna ya existía en la DB.
    reviewBonus: number;
    minPurchaseForBonus: number;      // Min 1st purchase to activate bonuses
    minReferralPurchase: number;      // Min purchase for referral to count
    // feat/moover-boost-lanzamiento: boost de earn por tiempo limitado (ej. ×2
    // los primeros 30 días del launch). Activo solo mientras now < earnBoostUntil.
    earnBoostMultiplier: number;
    earnBoostUntil: Date | null;
}

// Biblia Financiera v5 defaults (fallback de código; los valores VIVOS están en la
// DB PointsConfig y se editan desde /ops/config-biblia).
const defaultConfig: PointsConfig = {
    pointsPerDollar: 0.01,            // 10 points per $1,000 spent (0.01 pts/$1)
    minPurchaseForPoints: 0,          // No minimum for earning
    pointsValue: 1,                   // Each point = $1 ARS (1% cashback at base level)
    minPointsToRedeem: 500,           // Min 500 points to use ($500)
    maxDiscountPercent: 50,           // Max 50% discount with points (Biblia v5)
    signupBonus: 2500,                // $2.500 de bienvenida, igual para todos (Biblia v5)
    referralBonus: 3500,              // $3.500 al que invita (tras 1er pedido del referido)
    refereeBonus: 2500,               // $2.500 al invitado
    reviewBonus: 1000,                // $1.000 por dejar reseña (una vez por pedido)
    minPurchaseForBonus: 5000,        // $5,000 min 1st purchase to activate
    minReferralPurchase: 8000,        // $8,000 min for referral to count
    earnBoostMultiplier: 1,           // 1 = boost apagado (conservador)
    earnBoostUntil: null,             // sin fecha = apagado
};

/**
 * Multiplicador de boost vigente: earnBoostMultiplier si la fecha límite existe
 * y no pasó; 1 en cualquier otro caso (apagado, vencido o valor inválido).
 */
export function getActiveEarnBoost(config: PointsConfig, now: Date = new Date()): number {
    if (!config.earnBoostUntil) return 1;
    if (now >= config.earnBoostUntil) return 1;
    return config.earnBoostMultiplier > 0 ? config.earnBoostMultiplier : 1;
}

// ─── User Levels (Biblia v3) ─────────────────────────────────────────────────

export type UserLevel = "MOOVER" | "SILVER" | "GOLD" | "BLACK";

interface LevelConfig {
    name: UserLevel;
    minOrders: number;
    earnMultiplier: number; // Applied to base pointsPerDollar
}

/** Umbrales por defecto (Biblia v5: SILVER 3 / GOLD 10 / BLACK 22 — alcanzables en
 *  Ushuaia; antes 5/15/40, BLACK era inalcanzable). Editables desde OPS vía
 *  PointsConfig.tierConfigJson. Sorted highest-first for matching. */
const LEVEL_CONFIGS: LevelConfig[] = [
    { name: "BLACK", minOrders: 22, earnMultiplier: 2.0 },   // 20 pts/$1K
    { name: "GOLD", minOrders: 10, earnMultiplier: 1.5 },    // 15 pts/$1K
    { name: "SILVER", minOrders: 3, earnMultiplier: 1.25 },  // 12.5 pts/$1K
    { name: "MOOVER", minOrders: 0, earnMultiplier: 1.0 },   // 10 pts/$1K
];

/** Resuelve los umbrales efectivos: defaults + override de OPS (tierConfigJson,
 *  formato {"SILVER":3,"GOLD":10,"BLACK":22}). Los multiplicadores quedan fijos
 *  (canon). Devuelve ordenado de mayor a menor para el matching. */
function resolveLevelConfigs(tierConfigJson?: string | null): LevelConfig[] {
    const configs = LEVEL_CONFIGS.map((l) => ({ ...l }));
    if (tierConfigJson) {
        try {
            const parsed = JSON.parse(tierConfigJson);
            for (const lc of configs) {
                const v = parsed?.[lc.name];
                if (typeof v === "number" && v >= 0) lc.minOrders = v;
            }
        } catch { /* JSON inválido → defaults */ }
    }
    return configs.sort((a, b) => b.minOrders - a.minOrders);
}

/**
 * Get user level based on DELIVERED orders in the last 90 days.
 * Biblia v5: MOOVER(0), SILVER(3), GOLD(10), BLACK(22) — editables desde OPS.
 */
export async function getUserLevel(userId: string): Promise<{
    level: UserLevel;
    ordersInWindow: number;
    earnMultiplier: number;
    nextLevel: UserLevel | null;
    ordersToNextLevel: number;
}> {
    // chore/biblia-limpieza-fantasmas (2026-06-06): la ventana de niveles ahora
    // se lee de PointsConfig.tierWindowDays (columna ya existente en el schema,
    // default 90). Antes estaba hardcodeada en 90. No hay cambio de schema.
    let windowDays = 90;
    let levelConfigs = LEVEL_CONFIGS;
    try {
        const cfg = await prisma.pointsConfig.findUnique({
            where: { id: "points_config" },
            select: { tierWindowDays: true, tierConfigJson: true },
        });
        windowDays = cfg?.tierWindowDays ?? 90;
        levelConfigs = resolveLevelConfigs(cfg?.tierConfigJson);
    } catch (cfgError) {
        console.error("[Points] Error loading tier config, using defaults:", cfgError);
    }
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    try {
        const deliveredCount = await prisma.order.count({
            where: {
                userId,
                status: "DELIVERED",
                updatedAt: { gte: windowStart },
                deletedAt: null,
            },
        });

        // Find current level (configs sorted highest first)
        let currentLevel = levelConfigs[levelConfigs.length - 1]; // MOOVER default
        for (const lc of levelConfigs) {
            if (deliveredCount >= lc.minOrders) {
                currentLevel = lc;
                break;
            }
        }

        // Find next level
        const currentIdx = levelConfigs.indexOf(currentLevel);
        const nextLevelConfig = currentIdx > 0 ? levelConfigs[currentIdx - 1] : null;

        return {
            level: currentLevel.name,
            ordersInWindow: deliveredCount,
            earnMultiplier: currentLevel.earnMultiplier,
            nextLevel: nextLevelConfig?.name ?? null,
            ordersToNextLevel: nextLevelConfig
                ? Math.max(0, nextLevelConfig.minOrders - deliveredCount)
                : 0,
        };
    } catch (error) {
        console.error("[Points] Error getting user level:", error);
        return {
            level: "MOOVER",
            ordersInWindow: 0,
            earnMultiplier: 1.0,
            nextLevel: "SILVER",
            ordersToNextLevel: 3,
        };
    }
}

/**
 * Calculate points earned from a purchase.
 * Biblia v3: base 10 pts/$1,000 × level multiplier
 * @param earnMultiplier - from getUserLevel() (MOOVER=1, SILVER=1.25, GOLD=1.5, BLACK=2)
 */
export function calculatePointsEarned(
    orderTotal: number,
    config: PointsConfig = defaultConfig,
    earnMultiplier: number = 1.0
): number {
    if (orderTotal < config.minPurchaseForPoints) {
        return 0;
    }
    // feat/moover-boost-lanzamiento: el boost por tiempo limitado se aplica acá,
    // el único punto de cálculo del earn — TODOS los caminos que acreditan puntos
    // pasan por esta función, así que el boost nunca queda a medias.
    const boost = getActiveEarnBoost(config);
    return Math.floor(orderTotal * config.pointsPerDollar * earnMultiplier * boost);
}

/**
 * Calculate maximum discount when using points
 * Biblia v3: 1 pt = $1, max 20% del subtotal, min 500 pts
 */
export function calculateMaxPointsDiscount(
    orderTotal: number,
    userPointsBalance: number,
    config: PointsConfig = defaultConfig
): { pointsUsable: number; discountAmount: number } {
    // Check minimum points requirement first
    if (userPointsBalance < config.minPointsToRedeem) {
        return { pointsUsable: 0, discountAmount: 0 };
    }

    // Can't use more than max discount percent
    const maxDiscount = orderTotal * (config.maxDiscountPercent / 100);

    // Value of user's points
    const userPointsValue = userPointsBalance * config.pointsValue;

    // Actual discount is the lesser of the two
    const discountAmount = Math.min(maxDiscount, userPointsValue);

    // Points needed for this discount
    const pointsUsable = Math.ceil(discountAmount / config.pointsValue);

    return {
        pointsUsable: Math.min(pointsUsable, userPointsBalance),
        discountAmount: Math.min(discountAmount, maxDiscount)
    };
}

/**
 * Get points config from database
 */
export async function getPointsConfig(): Promise<PointsConfig> {
    try {
        const config = await prisma.pointsConfig.findUnique({
            where: { id: "points_config" }
        });

        if (!config) {
            return defaultConfig;
        }

        return {
            pointsPerDollar: config.pointsPerDollar,
            minPurchaseForPoints: config.minPurchaseForPoints,
            pointsValue: config.pointsValue,
            minPointsToRedeem: config.minPointsToRedeem,
            maxDiscountPercent: config.maxDiscountPercent,
            signupBonus: config.signupBonus,
            referralBonus: config.referralBonus,
            refereeBonus: (config as any).refereeBonus ?? defaultConfig.refereeBonus,
            reviewBonus: (config as any).reviewBonus ?? defaultConfig.reviewBonus,
            minPurchaseForBonus: (config as any).minPurchaseForBonus ?? defaultConfig.minPurchaseForBonus,
            minReferralPurchase: (config as any).minReferralPurchase ?? defaultConfig.minReferralPurchase,
            // feat/moover-boost-lanzamiento: `as any` para sobrevivir a un Prisma
            // client sin regenerar (mismo patrón que los campos de arriba).
            earnBoostMultiplier: (config as any).earnBoostMultiplier ?? defaultConfig.earnBoostMultiplier,
            earnBoostUntil: (config as any).earnBoostUntil ?? defaultConfig.earnBoostUntil,
        };
    } catch (error) {
        console.error("[Points] Error loading config:", error);
        return defaultConfig;
    }
}

/**
 * Record a points transaction
 * Uses Prisma transaction for data integrity.
 *
 * ISSUE-024: usamos `isolationLevel: Serializable` para prevenir el race
 * condition en que un mismo user gasta puntos desde dos tabs/dispositivos
 * simultáneos. Sin Serializable, ambas transacciones leen el mismo
 * `pointsBalance` y persisten dos updates con el mismo `newBalance`,
 * efectivamente regalando puntos. Con Serializable, una de las dos transacciones
 * falla con P2034 (serialization failure) y la reintentamos hasta 3 veces con
 * backoff lineal. Si después de 3 intentos sigue fallando, retornamos false y
 * el caller decide cómo manejarlo (típicamente: error al user, que reintenta).
 */
const POINTS_TX_MAX_RETRIES = 3;
const POINTS_TX_RETRY_BASE_MS = 50;

export async function recordPointsTransaction(
    userId: string,
    type: "EARN" | "REDEEM" | "BONUS" | "EXPIRE" | "ADJUSTMENT" | "REVIEW",
    amount: number,
    description: string,
    orderId?: string
): Promise<boolean> {
    for (let attempt = 1; attempt <= POINTS_TX_MAX_RETRIES; attempt++) {
        try {
            await prisma.$transaction(
                async (tx) => {
                    const user = await tx.user.findUnique({
                        where: { id: userId },
                        select: { pointsBalance: true }
                    });

                    if (!user) throw new Error("User not found");

                    const newBalance = (user.pointsBalance || 0) + amount;

                    if (newBalance < 0) throw new Error("Insufficient points");

                    // Update user
                    await tx.user.update({
                        where: { id: userId },
                        data: { pointsBalance: newBalance, updatedAt: new Date() }
                    });

                    // Create transaction record
                    await tx.pointsTransaction.create({
                        data: {
                            userId,
                            orderId: orderId || null,
                            type,
                            amount,
                            balanceAfter: newBalance,
                            description,
                        }
                    });
                },
                { isolationLevel: "Serializable" }
            );

            return true;
        } catch (error: any) {
            // Prisma serialization failure code (PostgreSQL 40001).
            // En este caso, una transacción concurrente nos pisó la lectura
            // de pointsBalance — reintentamos con backoff lineal corto.
            const isSerializationFailure =
                error?.code === "P2034" ||
                error?.meta?.code === "40001" ||
                /could not serialize/i.test(error?.message || "");

            if (isSerializationFailure && attempt < POINTS_TX_MAX_RETRIES) {
                const delay = POINTS_TX_RETRY_BASE_MS * attempt;
                console.warn(
                    `[Points] Serialization conflict for user ${userId} (attempt ${attempt}/${POINTS_TX_MAX_RETRIES}), retrying in ${delay}ms`
                );
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }

            console.error("[Points] Error recording transaction:", error);
            return false;
        }
    }

    return false;
}

/**
 * feat/moover-bono-resena: otorga el bono por reseña UNA sola vez por pedido
 * (idempotente). Un pedido tiene hasta 3 ratings (comercio/repartidor/vendedor);
 * el bono se otorga solo en el PRIMERO. La idempotencia se resuelve dentro de la
 * misma tx Serializable (chequeo del tx REVIEW previo por orderId), así dos ratings
 * casi simultáneos nunca lo duplican. Devuelve los puntos otorgados (0 si ya estaba
 * dado o el bono está en 0). Nunca throwea hacia afuera.
 */
export async function awardReviewBonus(userId: string, orderId: string): Promise<number> {
    const config = await getPointsConfig();
    const bonus = config.reviewBonus ?? 0;
    if (bonus <= 0) return 0;

    for (let attempt = 1; attempt <= POINTS_TX_MAX_RETRIES; attempt++) {
        try {
            const awarded = await prisma.$transaction(
                async (tx) => {
                    // Idempotencia: si ya existe un tx REVIEW para este pedido, no repetir.
                    const existing = await tx.pointsTransaction.findFirst({
                        where: { orderId, type: "REVIEW" },
                        select: { id: true },
                    });
                    if (existing) return 0;

                    const user = await tx.user.findUnique({
                        where: { id: userId },
                        select: { pointsBalance: true },
                    });
                    if (!user) throw new Error("User not found");

                    const newBalance = (user.pointsBalance || 0) + bonus;
                    await tx.user.update({
                        where: { id: userId },
                        data: { pointsBalance: newBalance, updatedAt: new Date() },
                    });
                    await tx.pointsTransaction.create({
                        data: {
                            userId,
                            orderId,
                            type: "REVIEW",
                            amount: bonus,
                            balanceAfter: newBalance,
                            description: "Bono por dejar tu reseña",
                        },
                    });
                    return bonus;
                },
                { isolationLevel: "Serializable" }
            );
            return awarded;
        } catch (error: any) {
            const isSerializationFailure =
                error?.code === "P2034" ||
                error?.meta?.code === "40001" ||
                /could not serialize/i.test(error?.message || "");
            if (isSerializationFailure && attempt < POINTS_TX_MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, POINTS_TX_RETRY_BASE_MS * attempt));
                continue;
            }
            console.error("[Points] Error awarding review bonus:", error);
            return 0;
        }
    }
    return 0;
}

/**
 * Get user's points balance
 */
export async function getUserPointsBalance(userId: string): Promise<number> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { pointsBalance: true }
        });
        return user?.pointsBalance || 0;
    } catch (error) {
        console.error("[Points] Error getting balance:", error);
        return 0;
    }
}

/**
 * Get user's points transaction history
 */
export async function getPointsHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
        return await prisma.pointsTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit
        });
    } catch (error) {
        console.error("[Points] Error getting history:", error);
        return [];
    }
}

/**
 * Set pending signup bonus (NOT immediately awarded)
 * Bonus will be activated after first qualifying purchase
 */
export async function setPendingSignupBonus(userId: string): Promise<boolean> {
    const config = await getPointsConfig();
    if (config.signupBonus <= 0) return true;

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                pendingBonusPoints: config.signupBonus,
                bonusActivated: false
            }
        });
        return true;
    } catch (error) {
        console.error("[Points] Error setting pending bonus:", error);
        return false;
    }
}

/**
 * Activate pending bonuses after qualifying purchase
 */
export async function activatePendingBonuses(
    userId: string,
    orderTotal: number,
    orderId: string
): Promise<{ activated: boolean; bonusAwarded: number }> {
    const config = await getPointsConfig();

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                bonusActivated: true,
                pendingBonusPoints: true,
                referredById: true
            }
        });

        if (!user || user.bonusActivated) {
            return { activated: false, bonusAwarded: 0 };
        }

        // Check if order meets minimum
        if (orderTotal < config.minPurchaseForBonus) {
            return { activated: false, bonusAwarded: 0 };
        }

        let totalBonus = 0;

        // Activate pending signup bonus
        if (user.pendingBonusPoints > 0) {
            await recordPointsTransaction(
                userId,
                "BONUS",
                user.pendingBonusPoints,
                "🎉 ¡Bono de bienvenida activado!",
                orderId
            );
            totalBonus += user.pendingBonusPoints;
        }

        // If user was referred, award bonus to referrer
        if (user.referredById && orderTotal >= config.minReferralPurchase) {
            // Award to referrer
            await recordPointsTransaction(
                user.referredById,
                "BONUS",
                config.referralBonus,
                "🤝 Tu amigo hizo su primera compra",
                orderId
            );

            // Award extra bonus to referee
            await recordPointsTransaction(
                userId,
                "BONUS",
                config.refereeBonus,
                "🎁 Bono por usar código de referido",
                orderId
            );
            totalBonus += config.refereeBonus;

            // Mark referral as COMPLETED with actual awarded amounts
            await prisma.referral.updateMany({
                where: {
                    refereeId: userId,
                    status: "PENDING"
                },
                data: {
                    status: "COMPLETED",
                    referrerPoints: config.referralBonus,
                    refereePoints: config.refereeBonus
                }
            });

            // Email al referidor: "tu amigo hizo su primer pedido + sumaste X pts"
            // Fire-and-forget. Fetch post-award para incluir el nuevo balance y
            // los nombres de ambos users.
            try {
                const [referrer, referee] = await Promise.all([
                    prisma.user.findUnique({
                        where: { id: user.referredById },
                        select: {
                            email: true,
                            firstName: true,
                            name: true,
                            pointsBalance: true,
                        },
                    }),
                    prisma.user.findUnique({
                        where: { id: userId },
                        select: { firstName: true, name: true },
                    }),
                ]);
                if (referrer?.email) {
                    const referrerName =
                        referrer.firstName || referrer.name || "Amigo";
                    const refereeName =
                        referee?.firstName || referee?.name || "Tu referido";
                    sendReferralActivatedEmail({
                        referrerEmail: referrer.email,
                        referrerName,
                        refereeName,
                        pointsAwarded: config.referralBonus,
                        newBalance: referrer.pointsBalance,
                    }).catch((err) => {
                        console.error(
                            "[activatePendingBonuses] Failed to send referral activated email:",
                            err
                        );
                    });
                }
            } catch (err) {
                console.error(
                    "[activatePendingBonuses] Failed to fetch referrer/referee for email:",
                    err
                );
            }
        }

        // Mark bonuses as activated
        await prisma.user.update({
            where: { id: userId },
            data: {
                bonusActivated: true,
                pendingBonusPoints: 0
            }
        });

        return { activated: true, bonusAwarded: totalBonus };
    } catch (error) {
        console.error("[Points] Error activating bonuses:", error);
        return { activated: false, bonusAwarded: 0 };
    }
}

/**
 * Award points when order is DELIVERED. Idempotent: if Order.pointsEarned is already set,
 * returns without doing anything. Sets Order.pointsEarned to the amount awarded so that
 * cancel/reject/refund paths can revert correctly.
 *
 * Only awards EARN (the REDEEM of pointsUsed is recorded at order creation by the caller,
 * so user sees discount immediately when paying).
 */
export async function awardOrderPointsIfDelivered(
    orderId: string
): Promise<{ awarded: number; skipped: boolean; reason?: string }> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true, subtotal: true, status: true, pointsEarned: true },
        });

        if (!order) return { awarded: 0, skipped: true, reason: "order_not_found" };
        if (order.status !== "DELIVERED") return { awarded: 0, skipped: true, reason: "not_delivered" };
        if (order.pointsEarned !== null) return { awarded: 0, skipped: true, reason: "already_awarded" };

        const config = await getPointsConfig();
        const { level, earnMultiplier } = await getUserLevel(order.userId);
        const earned = calculatePointsEarned(order.subtotal, config, earnMultiplier);

        if (earned <= 0) {
            // Marcar como otorgado (con 0) para no reintentar
            await prisma.order.update({
                where: { id: orderId },
                data: { pointsEarned: 0 },
            });
            return { awarded: 0, skipped: true, reason: "zero_earn" };
        }

        await recordPointsTransaction(
            order.userId,
            "EARN",
            earned,
            `Ganaste ${earned} puntos por tu compra (nivel ${level})`,
            orderId
        );

        await prisma.order.update({
            where: { id: orderId },
            data: { pointsEarned: earned },
        });

        // Reset del flag del cron de puntos por vencer: el user acaba de completar
        // un pedido, así que si estaba marcado como "aviso enviado" ya no aplica
        // — su próxima inactividad ≥5 meses arrancará un ciclo nuevo.
        try {
            await prisma.user.update({
                where: { id: order.userId },
                data: { pointsExpiryNotifiedAt: null },
            });
        } catch (err) {
            console.error("[Points] Error resetting pointsExpiryNotifiedAt:", err);
        }

        // Try to activate signup/referral bonuses now that the user completed a DELIVERED order
        try {
            await activatePendingBonuses(order.userId, order.subtotal, orderId);
        } catch (bonusError) {
            console.error("[Points] Error activating bonuses after DELIVERED:", bonusError);
        }

        return { awarded: earned, skipped: false };
    } catch (error) {
        console.error("[Points] Error awarding order points:", error);
        return { awarded: 0, skipped: true, reason: "error" };
    }
}

/**
 * Reverse points transactions for an order (cancel/reject/refund paths).
 * - If EARN was awarded (Order.pointsEarned > 0), create an ADJUSTMENT with the negative amount.
 * - If REDEEM was recorded at creation (Order.pointsUsed > 0), create an ADJUSTMENT with the positive amount
 *   to give back to the user the points they used.
 *
 * Idempotent: after reversing, sets Order.pointsEarned = 0 and Order.pointsUsed = 0 to prevent duplicate reversals.
 */
export async function reverseOrderPoints(
    orderId: string,
    reason: string
): Promise<{ earnReverted: number; redeemReverted: number }> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true, pointsEarned: true, pointsUsed: true },
        });

        if (!order) return { earnReverted: 0, redeemReverted: 0 };

        let earnReverted = 0;
        let redeemReverted = 0;

        if (order.pointsEarned && order.pointsEarned > 0) {
            await recordPointsTransaction(
                order.userId,
                "ADJUSTMENT",
                -order.pointsEarned,
                `Reversion de puntos por ${reason}`,
                orderId
            );
            earnReverted = order.pointsEarned;
        }

        if (order.pointsUsed && order.pointsUsed > 0) {
            await recordPointsTransaction(
                order.userId,
                "ADJUSTMENT",
                order.pointsUsed,
                `Devolucion de puntos canjeados por ${reason}`,
                orderId
            );
            redeemReverted = order.pointsUsed;
        }

        if (earnReverted > 0 || redeemReverted > 0) {
            await prisma.order.update({
                where: { id: orderId },
                data: { pointsEarned: 0, pointsUsed: 0 },
            });
        }

        return { earnReverted, redeemReverted };
    } catch (error) {
        console.error("[Points] Error reversing order points:", error);
        return { earnReverted: 0, redeemReverted: 0 };
    }
}

/**
 * Process points for a completed order (Biblia v3)
 * Now considers user level for earn rate multiplier.
 * Points are awarded ONLY when order is DELIVERED.
 *
 * @deprecated Usar awardOrderPointsIfDelivered() (para EARN) + recordPointsTransaction(REDEEM)
 * al crear la orden por separado. Esta funci\u00f3n queda para compatibilidad con callers viejos
 * pero no debe usarse en c\u00f3digo nuevo.
 */
export async function processOrderPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
    pointsUsed: number = 0
): Promise<{ earned: number; spent: number; bonusActivated: number; level: UserLevel }> {
    const config = await getPointsConfig();

    // Get user level for earn rate multiplier
    const { level, earnMultiplier } = await getUserLevel(userId);

    // Deduct points used (if any)
    if (pointsUsed > 0) {
        await recordPointsTransaction(
            userId,
            "REDEEM",
            -pointsUsed,
            `Canjeaste ${pointsUsed} puntos en tu pedido`,
            orderId
        );
    }

    // Add points earned (with level multiplier)
    const earned = calculatePointsEarned(orderTotal, config, earnMultiplier);
    if (earned > 0) {
        await recordPointsTransaction(
            userId,
            "EARN",
            earned,
            `Ganaste ${earned} puntos por tu compra (nivel ${level})`,
            orderId
        );
    }

    // Try to activate pending bonuses
    const { bonusAwarded } = await activatePendingBonuses(userId, orderTotal, orderId);

    return { earned, spent: pointsUsed, bonusActivated: bonusAwarded, level };
}

/**
 * Update points configuration
 */
export async function updatePointsConfig(newConfig: Partial<PointsConfig>): Promise<PointsConfig> {
    try {
        const config = await prisma.pointsConfig.upsert({
            where: { id: "points_config" },
            update: newConfig as any,
            create: {
                id: "points_config",
                ...defaultConfig,
                ...newConfig
            } as any
        });

        return {
            pointsPerDollar: config.pointsPerDollar,
            minPurchaseForPoints: config.minPurchaseForPoints,
            pointsValue: config.pointsValue,
            minPointsToRedeem: config.minPointsToRedeem,
            maxDiscountPercent: config.maxDiscountPercent,
            signupBonus: config.signupBonus,
            referralBonus: config.referralBonus,
            refereeBonus: (config as any).refereeBonus ?? defaultConfig.refereeBonus,
            reviewBonus: (config as any).reviewBonus ?? defaultConfig.reviewBonus,
            minPurchaseForBonus: (config as any).minPurchaseForBonus ?? defaultConfig.minPurchaseForBonus,
            minReferralPurchase: (config as any).minReferralPurchase ?? defaultConfig.minReferralPurchase,
            earnBoostMultiplier: (config as any).earnBoostMultiplier ?? defaultConfig.earnBoostMultiplier,
            earnBoostUntil: (config as any).earnBoostUntil ?? defaultConfig.earnBoostUntil,
        };
    } catch (error) {
        console.error("[Points] Error updating config:", error);
        throw error;
    }
}

export { defaultConfig, LEVEL_CONFIGS };
export type { PointsConfig };
