// Points System - Core Logic
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
    reviewBonus: number;
}

// Default config - 2% return rate
const defaultConfig: PointsConfig = {
    pointsPerDollar: 1,           // 1 point per $1 spent
    minPurchaseForPoints: 0,      // No minimum
    pointsValue: 0.02,            // Each point = $0.02 (2% cashback equivalent)
    minPointsToRedeem: 100,       // Min 100 points to use
    maxDiscountPercent: 50,       // Max 50% discount with points
    signupBonus: 500,             // 500 points ($10) for signing up
    referralBonus: 1000,          // 1000 points ($20) for referring
    reviewBonus: 50,              // 50 points ($1) per review
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
            reviewBonus: config.reviewBonus,
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
            // Get user with lock (faked here since Prisma doesn't have easy row lock for all providers, 
            // but transaction ensures consistency)
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
 * Award signup bonus to new user
 */
export async function awardSignupBonus(userId: string): Promise<boolean> {
    const config = await getPointsConfig();
    if (config.signupBonus <= 0) return true;

    return recordPointsTransaction(
        userId,
        "BONUS",
        config.signupBonus,
        "Bono de bienvenida por registrarte"
    );
}

/**
 * Process points for a completed order
 */
export async function processOrderPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
    pointsUsed: number = 0
): Promise<{ earned: number; spent: number }> {
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

    return { earned, spent: pointsUsed };
}

/**
 * Update points configuration
 */
export async function updatePointsConfig(newConfig: Partial<PointsConfig>): Promise<PointsConfig> {
    try {
        // Upsert the config
        const config = await prisma.pointsConfig.upsert({
            where: { id: "points_config" },
            update: newConfig,
            create: {
                id: "points_config",
                ...defaultConfig,
                ...newConfig
            }
        });

        return {
            pointsPerDollar: config.pointsPerDollar,
            minPurchaseForPoints: config.minPurchaseForPoints,
            pointsValue: config.pointsValue,
            minPointsToRedeem: config.minPointsToRedeem,
            maxDiscountPercent: config.maxDiscountPercent,
            signupBonus: config.signupBonus,
            referralBonus: config.referralBonus,
            reviewBonus: config.reviewBonus,
        };
    } catch (error) {
        console.error("[Points] Error updating config:", error);
        throw error;
    }
}

export { defaultConfig };
export type { PointsConfig };

