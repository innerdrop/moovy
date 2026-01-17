// Points System - Core Logic (Optimized Strategy)
// This module handles all points calculations and transactions
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

// Optimized config - 1.5% return rate with activation requirements
const defaultConfig: PointsConfig = {
    pointsPerDollar: 1,               // 1 point per $1 spent
    minPurchaseForPoints: 0,          // No minimum for earning
    pointsValue: 0.015,               // Each point = $0.015 (1.5% cashback)
    minPointsToRedeem: 500,           // Min 500 points to use ($7.50)
    maxDiscountPercent: 15,           // Max 15% discount with points
    signupBonus: 250,                 // 250 points for signing up (after activation)
    referralBonus: 500,               // 500 points for referring (after referral buys)
    refereeBonus: 250,                // 250 points bonus for being referred
    reviewBonus: 25,                  // 25 points per review
    minPurchaseForBonus: 5000,        // $5,000 min 1st purchase to activate
    minReferralPurchase: 8000,        // $8,000 min for referral to count
};

/**
 * Calculate points earned from a purchase
 */
export function calculatePointsEarned(
    orderTotal: number,
    config: PointsConfig = defaultConfig
): number {
    if (orderTotal < config.minPurchaseForPoints) {
        return 0;
    }
    return Math.floor(orderTotal * config.pointsPerDollar);
}

/**
 * Calculate maximum discount when using points
 */
export function calculateMaxPointsDiscount(
    orderTotal: number,
    userPointsBalance: number,
    config: PointsConfig = defaultConfig
): { pointsUsable: number; discountAmount: number } {
    // Can't use more than max discount percent
    const maxDiscount = orderTotal * (config.maxDiscountPercent / 100);

    // Value of user's points
    const userPointsValue = userPointsBalance * config.pointsValue;

    // Actual discount is the lesser of the two
    const discountAmount = Math.min(maxDiscount, userPointsValue);

    // Points needed for this discount
    const pointsUsable = Math.ceil(discountAmount / config.pointsValue);

    // Check minimum points requirement
    if (userPointsBalance < config.minPointsToRedeem) {
        return { pointsUsable: 0, discountAmount: 0 };
    }

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
 * Process points for a completed order
 */
export async function processOrderPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
    pointsUsed: number = 0
): Promise<{ earned: number; spent: number; bonusActivated: number }> {
    const config = await getPointsConfig();

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

    // Add points earned
    const earned = calculatePointsEarned(orderTotal, config);
    if (earned > 0) {
        await recordPointsTransaction(
            userId,
            "EARN",
            earned,
            `Ganaste ${earned} puntos por tu compra`,
            orderId
        );
    }

    // Try to activate pending bonuses
    const { bonusAwarded } = await activatePendingBonuses(userId, orderTotal, orderId);

    return { earned, spent: pointsUsed, bonusActivated: bonusAwarded };
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

export { defaultConfig };
export type { PointsConfig };
