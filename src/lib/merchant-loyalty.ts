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
 *
 * MES 1 GRATIS (Biblia Financiera v3):
 * Todo comercio nuevo paga 0% de comisión durante sus primeros
 * FIRST_MONTH_FREE_DAYS días corridos desde createdAt. Es inversión
 * de adquisición, no un beneficio opcional. Se aplica siempre salvo
 * que el admin haya configurado un commissionOverride explícito.
 */

import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const loyaltyLogger = logger.child({ context: "merchant-loyalty" });

/**
 * Duración del período sin comisión para comercios nuevos.
 * Biblia v3: 30 días corridos desde Merchant.createdAt.
 * Exportado como constante para que la UI y los tests compartan el valor.
 */
export const FIRST_MONTH_FREE_DAYS = 30;
const FIRST_MONTH_FREE_MS = FIRST_MONTH_FREE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Indica si un comercio está dentro de su ventana de mes gratis.
 * Usa la fecha de creación del comercio (no la de aprobación) para
 * coincidir con la promesa pública: "primer mes en MOOVY = 0%".
 *
 * @param createdAt DateTime del Merchant.createdAt
 * @param now reloj inyectable para tests; default Date.now()
 */
export function isInFirstMonthFree(createdAt: Date, now: Date = new Date()): boolean {
  const diffMs = now.getTime() - createdAt.getTime();
  // Si diffMs < 0 (fecha futura por clock skew), igual estamos en la ventana.
  return diffMs < FIRST_MONTH_FREE_MS;
}

/**
 * Fecha exacta de fin del mes gratis.
 * Se usa para mostrar al comercio "Tu período sin comisión vence el DD/MM/AAAA".
 */
export function getFirstMonthFreeEndDate(createdAt: Date): Date {
  return new Date(createdAt.getTime() + FIRST_MONTH_FREE_MS);
}

/**
 * Días restantes del mes gratis. 0 si ya venció.
 * Útil para mensajes urgentes tipo "Te quedan 3 días sin comisión".
 */
export function getFirstMonthFreeDaysRemaining(createdAt: Date, now: Date = new Date()): number {
  const endDate = getFirstMonthFreeEndDate(createdAt);
  const diffMs = endDate.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

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
 *
 * Prioridad (Biblia Financiera v3):
 *   1. commissionOverride manual del admin (convenio especial) — gana siempre.
 *   2. Mes 1 gratis: 0% durante los primeros FIRST_MONTH_FREE_DAYS desde createdAt.
 *   3. Tier del programa de fidelización (BRONCE 8%, PLATA 7%, ORO 6%, DIAMANTE 5%).
 *   4. Fallback 8% si no hay config.
 *
 * El override gana al mes gratis porque puede existir un acuerdo firmado
 * (ej: "Convenio especial lanzamiento 5% desde el día uno") que un admin
 * quiere respetar aunque implique cobrar más que 0.
 */
export async function getEffectiveCommission(merchantId: string): Promise<number> {
  const result = await getEffectiveCommissionWithSource(merchantId);
  return result.rate;
}

/**
 * Origen del rate de comisión efectivo, persistido en SubOrder.merchantCommissionSource
 * para auditoría AAIP/AFIP y debugging. Misma precedencia que getEffectiveCommission.
 *
 * Rama: refactor/separar-motor-y-finanzas
 */
export type CommissionSource = "OVERRIDE" | "FIRST_MONTH" | "TIER" | "FALLBACK";

export interface EffectiveCommissionResult {
  rate: number;
  source: CommissionSource;
  /** Tier consultado (cuando source === "TIER"), null en otros casos */
  tier?: MerchantTierType | null;
}

/**
 * Versión enriquecida de getEffectiveCommission que devuelve también el origen
 * del rate (override / first-month-free / tier / fallback). El source se persiste
 * en SubOrder.merchantCommissionSource al crear la orden.
 *
 * NUNCA recalcular este valor sobre orders cerradas — los reportes fiscales
 * dependen de que el rate aplicado al cerrar quede inmutable.
 */
export async function getEffectiveCommissionWithSource(merchantId: string): Promise<EffectiveCommissionResult> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { loyaltyTier: true, commissionOverride: true, createdAt: true },
    });

    if (!merchant) {
      return { rate: 8, source: "FALLBACK", tier: null };
    }

    // 1. Override admin (gana sobre todo)
    if (merchant.commissionOverride !== null && merchant.commissionOverride !== undefined) {
      return { rate: merchant.commissionOverride, source: "OVERRIDE", tier: null };
    }

    // 2. First-month-free
    if (isInFirstMonthFree(merchant.createdAt)) {
      loyaltyLogger.info(
        { merchantId, createdAt: merchant.createdAt },
        "Merchant in first-month-free window, commission = 0%"
      );
      return { rate: 0, source: "FIRST_MONTH", tier: null };
    }

    // 3. Tier del programa de fidelización
    const tier = merchant.loyaltyTier as MerchantTierType;
    const tierConfig = await getTierConfig(tier);

    if (!tierConfig) {
      return { rate: 8, source: "FALLBACK", tier: null };
    }

    return { rate: tierConfig.commissionRate, source: "TIER", tier };
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error getting effective commission");
    return { rate: 8, source: "FALLBACK", tier: null };
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
        createdAt: true,
        commissionOverride: true,
      },
    });

    if (!merchant) {
      return null;
    }

    // Info del mes gratis para que el dashboard muestre el banner y la fecha de vencimiento.
    // Si hay commissionOverride, el mes gratis NO aplica (el override gana).
    const hasOverride = merchant.commissionOverride !== null && merchant.commissionOverride !== undefined;
    const firstMonthActive = !hasOverride && isInFirstMonthFree(merchant.createdAt);
    const firstMonthFree = {
      active: firstMonthActive,
      endDate: getFirstMonthFreeEndDate(merchant.createdAt),
      daysRemaining: firstMonthActive ? getFirstMonthFreeDaysRemaining(merchant.createdAt) : 0,
    };

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
      firstMonthFree,
    };
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error getting loyalty widget data");
    return null;
  }
}
