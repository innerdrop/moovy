// Points System - Core Logic (Biblia Financiera v3)
// Earn: 10 pts por $1,000 (0.01 pts/$1). Valor: 1 pt = $1. Cashback ~1%.
// Niveles por pedidos DELIVERED en 90 días: MOOVER(0), SILVER(5), GOLD(15), BLACK(40)
// Earn rates: MOOVER ×1, SILVER ×1.25, GOLD ×1.5, BLACK ×2
import { prisma } from "@/lib/prisma";

interface PointsConfig {
    pointsPerDollar: number;
    minPurchaseForPoints: number;
    pointsValue: number;
    minPointsToRedeem: number;
    maxDiscountPercent: number;
    signupBonus: number;
    referralBonus: number;
    refereeBonus: number;
    reviewBonus: number;
    minPurchaseForBonus: number;      // Min 1st purchase to activate bonuses
    minReferralPurchase: number;      // Min purchase for referral to count
}

// Biblia Financiera v3 defaults
const defaultConfig: PointsConfig = {
    pointsPerDollar: 0.01,            // 10 points per $1,000 spent (0.01 pts/$1)
    minPurchaseForPoints: 0,          // No minimum for earning
    pointsValue: 1,                   // Each point = $1 ARS (1% cashback at base level)
    minPointsToRedeem: 500,           // Min 500 points to use ($500)
    maxDiscountPercent: 20,           // Max 20% discount with points
    signupBonus: 1000,                // 1,000 points signup (boost month: doubled)
    referralBonus: 1000,              // 1,000 points for referring (after referral's 1st DELIVERED order)
    refereeBonus: 500,                // 500 points bonus for being referred
    reviewBonus: 25,                  // 25 points per review
    minPurchaseForBonus: 5000,        // $5,000 min 1st purchase to activate
    minReferralPurchase: 8000,        // $8,000 min for referral to count
};

// ─── User Levels (Biblia v3) ─────────────────────────────────────────────────

export type UserLevel = "MOOVER" | "SILVER" | "GOLD" | "BLACK";

interface LevelConfig {
    name: UserLevel;
    minOrders: number;
    earnMultiplier: number; // Applied to base pointsPerDollar
}

/** Sorted highest-first for matching */
const LEVEL_CONFIGS: LevelConfig[] = [
    { name: "BLACK", minOrders: 40, earnMultiplier: 2.0 },   // 20 pts/$1K
    { name: "GOLD", minOrders: 15, earnMultiplier: 1.5 },    // 15 pts/$1K
    { name: "SILVER", minOrders: 5, earnMultiplier: 1.25 },   // 12.5 pts/$1K
    { name: "MOOVER", minOrders: 0, earnMultiplier: 1.0 },    // 10 pts/$1K
];

/**
 * Get user level based on DELIVERED orders in the last 90 days.
 * Biblia v3: MOOVER(0), SILVER(5), GOLD(15), BLACK(40)
 */
export async function getUserLevel(userId: string): Promise<{
    level: UserLevel;
    ordersInWindow: number;
    earnMultiplier: number;
    nextLevel: UserLevel | null;
    ordersToNextLevel: number;
}> {
    const windowDays = 90;
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
        let currentLevel = LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1]; // MOOVER default
        for (const lc of LEVEL_CONFIGS) {
            if (deliveredCount >= lc.minOrders) {
                currentLevel = lc;
                break;
            }
        }

        // Find next level
        const currentIdx = LEVEL_CONFIGS.indexOf(currentLevel);
        const nextLevelConfig = currentIdx > 0 ? LEVEL_CONFIGS[currentIdx - 1] : null;

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
            ordersToNextLevel: 5,
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
    return Math.floor(orderTotal * config.pointsPerDollar * earnMultiplier);
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
            reviewBonus: config.reviewBonus,
            minPurchaseForBonus: (config as any).minPurchaseForBonus ?? defaultConfig.minPurchaseForBonus,
            minReferralPurchase: (config as any).minReferralPurchase ?? defaultConfig.minReferralPurchase,
        };
    } catch (error) {
        console.error("[Points] Error loading config:", error);
        return defaultConfig;
    }
}

/**
 * Record a points transaction
 * Uses Prisma transaction for data integrity
 */
export async function recordPointsTransaction(
    userId: string,
    type: "EARN" | "REDEEM" | "BONUS" | "EXPIRE" | "ADJUSTMENT",
    amount: number,
    description: string,
    orderId?: string
): Promise<boolean> {
    try {
        // Use a transaction to update balance and create record atomically
        await prisma.$transaction(async (tx) => {
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
        });

        return true;
    } catch (error) {
        console.error("[Points] Error recording transaction:", error);
        return false;
    }
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
            reviewBonus: config.reviewBonus,
            minPurchaseForBonus: (config as any).minPurchaseForBonus ?? defaultConfig.minPurchaseForBonus,
            minReferralPurchase: (config as any).minReferralPurchase ?? defaultConfig.minReferralPurchase,
        };
    } catch (error) {
        console.error("[Points] Error updating config:", error);
        throw error;
    }
}

export { defaultConfig, LEVEL_CONFIGS };
export type { PointsConfig };
