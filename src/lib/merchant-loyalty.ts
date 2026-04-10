/**
 * Merchant Loyalty Program Service
 *
 * Manages merchant tiers (BRONCE, PLATA, ORO, DIAMANTE) based on monthly order volume.
 * Tiers provide reduced commission rates and visibility benefits.
 *
 * Tier thresholds (default):
 * - BRONCE: 0-30 pedidos/mes → 8% comisión
 * - PLATA: 31-80 pedidos/mes → 7% comisión
 * - ORO: 81-150 pedidos/mes → 6% comisión
 * - DIAMANTE: 151+ pedidos/mes → 5% comisión
 */

import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const loyaltyLogger = logger.child({ context: "merchant-loyalty" });

export type MerchantTierType = "BRONCE" | "PLATA" | "ORO" | "DIAMANTE";

export interface MerchantTierInfo {
  tier: MerchantTierType;
  commissionRate: number;
  badgeText: string;
  badgeColor: string;
  minOrdersPerMonth: number;
  benefits: string[];
}

/**
 * Get the default tier configuration.
 * In production, this should be read from MerchantLoyaltyConfig.
 * But we provide defaults for initial setup.
 */
export async function getTierConfig(tier: MerchantTierType): Promise<MerchantTierInfo | null> {
  try {
    const config = await prisma.merchantLoyaltyConfig.findUnique({
      where: { tier },
    });

    if (!config) {
      return null;
    }

    return {
      tier,
      commissionRate: config.commissionRate,
      badgeText: config.badgeText,
      badgeColor: config.badgeColor,
      minOrdersPerMonth: config.minOrdersPerMonth,
      benefits: config.benefitsJson ? JSON.parse(config.benefitsJson) : [],
    };
  } catch (error) {
    loyaltyLogger.error({ error, tier }, "Error reading tier config");
    return null;
  }
}

/**
 * Calculate the tier based on delivered orders in the last 30 days.
 * Returns the new tier, or null if calculation fails.
 */
export async function calculateMerchantTier(merchantId: string): Promise<MerchantTierType | null> {
  try {
    // Count DELIVERED orders from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orderCount = await prisma.order.count({
      where: {
        merchantId,
        status: "DELIVERED",
        deliveredAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
    });

    loyaltyLogger.info({ merchantId, orderCount }, "Calculated merchant order count");

    // Determine tier based on order count
    // Reading from database allows dynamic configuration
    const tiers = await prisma.merchantLoyaltyConfig.findMany({
      orderBy: { minOrdersPerMonth: "desc" },
    });

    if (tiers.length === 0) {
      // Fallback if no config exists
      loyaltyLogger.warn({ merchantId }, "No loyalty tier config found, defaulting to BRONCE");
      return "BRONCE";
    }

    for (const tierConfig of tiers) {
      if (orderCount >= tierConfig.minOrdersPerMonth) {
        return tierConfig.tier as MerchantTierType;
      }
    }

    // Default to BRONCE if below lowest threshold
    return "BRONCE";
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error calculating merchant tier");
    return null;
  }
}

/**
 * Get the effective commission rate for a merchant based on their current tier.
 * This is the critical function used during order creation.
 * ALWAYS use this for commission calculations, never hardcode 8%.
 */
export async function getEffectiveCommission(merchantId: string): Promise<number> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { loyaltyTier: true, commissionOverride: true },
    });

    if (!merchant) {
      // Merchant not found, return default
      return 8;
    }

    // Special agreement override takes priority over loyalty tier
    if (merchant.commissionOverride !== null && merchant.commissionOverride !== undefined) {
      return merchant.commissionOverride;
    }

    const tierConfig = await getTierConfig(merchant.loyaltyTier as MerchantTierType);

    if (!tierConfig) {
      // Config not found, return default
      return 8;
    }

    return tierConfig.commissionRate;
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error getting effective commission");
    return 8; // Fallback to default
  }
}

/**
 * Recalculate merchant tier and update if changed.
 * Returns { changed: boolean, oldTier?: string, newTier: string }
 */
export async function updateMerchantTier(merchantId: string): Promise<{
  changed: boolean;
  oldTier?: string;
  newTier: string;
}> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, loyaltyTier: true, email: true, ownerId: true, loyaltyTierLocked: true },
    });

    if (!merchant) {
      return { changed: false, newTier: "BRONCE" };
    }

    // If admin locked the tier, skip automatic recalculation
    if (merchant.loyaltyTierLocked) {
      loyaltyLogger.info({ merchantId, tier: merchant.loyaltyTier }, "Tier locked by admin, skipping recalculation");
      return { changed: false, newTier: merchant.loyaltyTier };
    }

    const oldTier = merchant.loyaltyTier;
    const newTier = await calculateMerchantTier(merchantId);

    if (!newTier) {
      return { changed: false, newTier: oldTier };
    }

    // Update if changed
    if (oldTier !== newTier) {
      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          loyaltyTier: newTier,
          loyaltyUpdatedAt: new Date(),
        },
      });

      loyaltyLogger.info(
        { merchantId, oldTier, newTier, ownerId: merchant.ownerId },
        "Merchant tier updated"
      );

      return { changed: true, oldTier, newTier };
    }

    return { changed: false, newTier };
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error updating merchant tier");
    return { changed: false, newTier: "BRONCE" };
  }
}

/**
 * Bulk update all merchant tiers.
 * Should be called once daily via cron job.
 * Returns count of merchants whose tier changed.
 */
export async function updateAllMerchantTiers(): Promise<number> {
  try {
    // Get all active merchants
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true, approvalStatus: "APPROVED", loyaltyTierLocked: false },
      select: { id: true },
    });

    let changedCount = 0;

    for (const merchant of merchants) {
      const result = await updateMerchantTier(merchant.id);
      if (result.changed) {
        changedCount++;
      }
    }

    loyaltyLogger.info({ changedCount, totalMerchants: merchants.length }, "Bulk tier update completed");

    return changedCount;
  } catch (error) {
    loyaltyLogger.error({ error }, "Error bulk updating merchant tiers");
    return 0;
  }
}

/**
 * Get loyalty widget data for a merchant dashboard.
 */
export async function getMerchantLoyaltyWidget(merchantId: string) {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        loyaltyTier: true,
        loyaltyOrderCount: true,
        loyaltyUpdatedAt: true,
      },
    });

    if (!merchant) {
      return null;
    }

    // Get current tier config
    const currentTierConfig = await getTierConfig(merchant.loyaltyTier as MerchantTierType);

    // Get all tiers sorted by min orders
    const allTiers = await prisma.merchantLoyaltyConfig.findMany({
      orderBy: { minOrdersPerMonth: "asc" },
    });

    if (!allTiers || allTiers.length === 0) {
      return null;
    }

    // Get next tier info
    const currentMinOrders = currentTierConfig?.minOrdersPerMonth || 0;
    const nextTierConfig = allTiers.find((t: any) => t.minOrdersPerMonth > currentMinOrders);

    // Count orders in last 30 days for progress
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrderCount = await prisma.order.count({
      where: {
        merchantId,
        status: "DELIVERED",
        deliveredAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
    });

    return {
      currentTier: merchant.loyaltyTier,
      currentTierInfo: currentTierConfig,
      recentOrderCount,
      nextTier: nextTierConfig
        ? {
            tier: nextTierConfig.tier,
            minOrders: nextTierConfig.minOrdersPerMonth,
            ordersNeeded: Math.max(0, nextTierConfig.minOrdersPerMonth - recentOrderCount),
            commission: nextTierConfig.commissionRate,
            badgeText: nextTierConfig.badgeText,
            benefits: nextTierConfig.benefitsJson ? JSON.parse(nextTierConfig.benefitsJson) : [],
          }
        : null,
      lastUpdatedAt: merchant.loyaltyUpdatedAt,
    };
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error getting loyalty widget data");
    return null;
  }
}
