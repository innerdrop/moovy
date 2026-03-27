// src/lib/ops-config.ts
// Centralized OPS configuration reader/writer
// Reads from StoreSettings, PointsConfig, MoovyConfig, and MerchantLoyaltyConfig

import { prisma } from "./prisma";

// Types for the full configuration
export interface DeliveryConfig {
  baseDeliveryFee: number;
  fuelPricePerLiter: number;
  fuelConsumptionPerKm: number;
  maintenanceFactor: number;
  maxDeliveryDistance: number;
  freeDeliveryMinimum: number | null;
  riderCommissionPercent: number;
  operationalCostPercent: number;
  zoneMultipliers: Record<string, number>;  // parsed from JSON
  climateMultipliers: Record<string, number>;  // parsed from JSON
  activeClimateCondition: string;
}

export interface CommissionConfig {
  defaultMerchantCommission: number;
  defaultSellerCommission: number;
  riderCommissionPercent: number;
}

export interface PointsMooverConfig {
  pointsPerDollar: number;
  minPurchaseForPoints: number;
  pointsValue: number;
  minPointsToRedeem: number;
  maxDiscountPercent: number;
  signupBonus: number;
  referralBonus: number;
  refereeBonus: number;
  reviewBonus: number;
  minPurchaseForBonus: number;
  minReferralPurchase: number;
  tierWindowDays: number;
  tierConfigJson: string | null;
}

export interface CashProtocolConfig {
  cashMpOnlyDeliveries: number;
  cashLimitL1: number;
  cashLimitL2: number;
  cashLimitL3: number;
}

export interface ScheduledDeliveryConfig {
  maxOrdersPerSlot: number;
  slotDurationMinutes: number;
  minAnticipationHours: number;
  maxAnticipationHours: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
}

export interface TimeoutConfig {
  merchantConfirmTimeoutSec: number;
  driverResponseTimeoutSec: number;
}

export interface AdvertisingConfig {
  adPricePlatino: number;
  adPriceDestacado: number;
  adPricePremium: number;
  adPriceHeroBanner: number;
  adPriceBannerPromo: number;
  adPriceProducto: number;
  adLaunchDiscountPercent: number;
  adMaxHeroBannerSlots: number;
  adMaxDestacadosSlots: number;
  adMaxProductosSlots: number;
  adMinDurationDays: number;
  adDiscount3Months: number;
  adDiscount6Months: number;
  adPaymentMethods: string;
  adCancellation48hFullRefund: boolean;
  adCancellationAdminFeePercent: number;
}

export interface MerchantTierConfig {
  tier: string;
  minOrdersPerMonth: number;
  commissionRate: number;
  badgeText: string;
  badgeColor: string;
  benefitsJson: string;
  displayOrder: number;
}

export interface FullOpsConfig {
  delivery: DeliveryConfig;
  commissions: CommissionConfig;
  points: PointsMooverConfig;
  cashProtocol: CashProtocolConfig;
  scheduledDelivery: ScheduledDeliveryConfig;
  timeouts: TimeoutConfig;
  advertising: AdvertisingConfig;
  merchantTiers: MerchantTierConfig[];
}

// DEFAULTS matching Biblia Financiera
const DEFAULTS = {
  zoneMultipliers: { ZONA_A: 1.0, ZONA_B: 1.15, ZONA_C: 1.35 },
  climateMultipliers: { normal: 1.0, lluvia: 1.10, nieve: 1.15, extremo: 1.25 },
};

// Safe JSON parse with fallback
function safeParseJSON<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Reads ALL OPS config from database in a single call.
 * Used by the OPS panel to show current values.
 * Uses defaults from Biblia Financiera if DB values not set.
 */
export async function getFullOpsConfig(): Promise<FullOpsConfig> {
  // Parallel reads for performance
  const [settings, pointsConfig, loyaltyTiers] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: "settings" } }),
    prisma.pointsConfig.findUnique({ where: { id: "points_config" } }),
    prisma.merchantLoyaltyConfig.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return {
    delivery: {
      baseDeliveryFee: settings?.baseDeliveryFee ?? 500,
      fuelPricePerLiter: settings?.fuelPricePerLiter ?? 1200,
      fuelConsumptionPerKm: settings?.fuelConsumptionPerKm ?? 0.06,
      maintenanceFactor: settings?.maintenanceFactor ?? 1.35,
      maxDeliveryDistance: settings?.maxDeliveryDistance ?? 15,
      freeDeliveryMinimum: settings?.freeDeliveryMinimum ?? null,
      riderCommissionPercent: settings?.riderCommissionPercent ?? 80,
      operationalCostPercent: (settings as any)?.operationalCostPercent ?? 5,
      zoneMultipliers: safeParseJSON(
        (settings as any)?.zoneMultipliersJson,
        DEFAULTS.zoneMultipliers,
      ),
      climateMultipliers: safeParseJSON(
        (settings as any)?.climateMultipliersJson,
        DEFAULTS.climateMultipliers,
      ),
      activeClimateCondition: (settings as any)?.activeClimateCondition ?? "normal",
    },
    commissions: {
      defaultMerchantCommission: (settings as any)?.defaultMerchantCommission ?? 8,
      defaultSellerCommission: (settings as any)?.defaultSellerCommission ?? 12,
      riderCommissionPercent: settings?.riderCommissionPercent ?? 80,
    },
    points: {
      pointsPerDollar: pointsConfig?.pointsPerDollar ?? 1,
      minPurchaseForPoints: pointsConfig?.minPurchaseForPoints ?? 0,
      pointsValue: pointsConfig?.pointsValue ?? 0.015,
      minPointsToRedeem: pointsConfig?.minPointsToRedeem ?? 500,
      maxDiscountPercent: pointsConfig?.maxDiscountPercent ?? 15,
      signupBonus: pointsConfig?.signupBonus ?? 250,
      referralBonus: pointsConfig?.referralBonus ?? 200,
      refereeBonus: (pointsConfig as any)?.refereeBonus ?? 100,
      reviewBonus: pointsConfig?.reviewBonus ?? 25,
      minPurchaseForBonus: (pointsConfig as any)?.minPurchaseForBonus ?? 5000,
      minReferralPurchase: (pointsConfig as any)?.minReferralPurchase ?? 8000,
      tierWindowDays: (pointsConfig as any)?.tierWindowDays ?? 90,
      tierConfigJson: (pointsConfig as any)?.tierConfigJson ?? null,
    },
    cashProtocol: {
      cashMpOnlyDeliveries: (settings as any)?.cashMpOnlyDeliveries ?? 10,
      cashLimitL1: (settings as any)?.cashLimitL1 ?? 15000,
      cashLimitL2: (settings as any)?.cashLimitL2 ?? 25000,
      cashLimitL3: (settings as any)?.cashLimitL3 ?? 40000,
    },
    scheduledDelivery: {
      maxOrdersPerSlot: (settings as any)?.maxOrdersPerSlot ?? 15,
      slotDurationMinutes: (settings as any)?.slotDurationMinutes ?? 120,
      minAnticipationHours: (settings as any)?.minAnticipationHours ?? 1.5,
      maxAnticipationHours: (settings as any)?.maxAnticipationHours ?? 48,
      operatingHoursStart: (settings as any)?.operatingHoursStart ?? "09:00",
      operatingHoursEnd: (settings as any)?.operatingHoursEnd ?? "22:00",
    },
    timeouts: {
      merchantConfirmTimeoutSec: (settings as any)?.merchantConfirmTimeoutSec ?? 300,
      driverResponseTimeoutSec: (settings as any)?.driverResponseTimeoutSec ?? 60,
    },
    advertising: {
      adPricePlatino: (settings as any)?.adPricePlatino ?? 150000,
      adPriceDestacado: (settings as any)?.adPriceDestacado ?? 95000,
      adPricePremium: (settings as any)?.adPricePremium ?? 55000,
      adPriceHeroBanner: (settings as any)?.adPriceHeroBanner ?? 250000,
      adPriceBannerPromo: (settings as any)?.adPriceBannerPromo ?? 180000,
      adPriceProducto: (settings as any)?.adPriceProducto ?? 25000,
      adLaunchDiscountPercent: (settings as any)?.adLaunchDiscountPercent ?? 50,
      adMaxHeroBannerSlots: (settings as any)?.adMaxHeroBannerSlots ?? 3,
      adMaxDestacadosSlots: (settings as any)?.adMaxDestacadosSlots ?? 8,
      adMaxProductosSlots: (settings as any)?.adMaxProductosSlots ?? 12,
      adMinDurationDays: (settings as any)?.adMinDurationDays ?? 7,
      adDiscount3Months: (settings as any)?.adDiscount3Months ?? 10,
      adDiscount6Months: (settings as any)?.adDiscount6Months ?? 20,
      adPaymentMethods: (settings as any)?.adPaymentMethods ?? '["mercadopago","transferencia"]',
      adCancellation48hFullRefund: (settings as any)?.adCancellation48hFullRefund ?? true,
      adCancellationAdminFeePercent: (settings as any)?.adCancellationAdminFeePercent ?? 10,
    },
    merchantTiers: loyaltyTiers.map((t) => ({
      tier: t.tier,
      minOrdersPerMonth: t.minOrdersPerMonth,
      commissionRate: t.commissionRate,
      badgeText: t.badgeText,
      badgeColor: t.badgeColor,
      benefitsJson: t.benefitsJson,
      displayOrder: t.displayOrder,
    })),
  };
}

/**
 * Update delivery config section
 */
export async function updateDeliveryConfig(
  data: Partial<DeliveryConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.baseDeliveryFee !== undefined)
    updateData.baseDeliveryFee = data.baseDeliveryFee;
  if (data.fuelPricePerLiter !== undefined)
    updateData.fuelPricePerLiter = data.fuelPricePerLiter;
  if (data.fuelConsumptionPerKm !== undefined)
    updateData.fuelConsumptionPerKm = data.fuelConsumptionPerKm;
  if (data.maintenanceFactor !== undefined)
    updateData.maintenanceFactor = data.maintenanceFactor;
  if (data.maxDeliveryDistance !== undefined)
    updateData.maxDeliveryDistance = data.maxDeliveryDistance;
  if (data.freeDeliveryMinimum !== undefined)
    updateData.freeDeliveryMinimum = data.freeDeliveryMinimum;
  if (data.riderCommissionPercent !== undefined)
    updateData.riderCommissionPercent = data.riderCommissionPercent;
  if (data.operationalCostPercent !== undefined)
    updateData.operationalCostPercent = data.operationalCostPercent;
  if (data.zoneMultipliers !== undefined)
    updateData.zoneMultipliersJson = JSON.stringify(data.zoneMultipliers);
  if (data.climateMultipliers !== undefined)
    updateData.climateMultipliersJson = JSON.stringify(data.climateMultipliers);
  if (data.activeClimateCondition !== undefined)
    updateData.activeClimateCondition = data.activeClimateCondition;

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: updateData,
    create: { id: "settings", ...updateData },
  });
}

/**
 * Update commission config section
 */
export async function updateCommissionConfig(
  data: Partial<CommissionConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.defaultMerchantCommission !== undefined)
    updateData.defaultMerchantCommission = data.defaultMerchantCommission;
  if (data.defaultSellerCommission !== undefined)
    updateData.defaultSellerCommission = data.defaultSellerCommission;
  if (data.riderCommissionPercent !== undefined)
    updateData.riderCommissionPercent = data.riderCommissionPercent;

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: updateData,
    create: { id: "settings", ...updateData },
  });

  // Sync commission fields to MoovyConfig for any legacy consumers
  const syncMap: Record<string, number | undefined> = {
    seller_commission_pct: data.defaultSellerCommission,
    driver_commission_pct: data.riderCommissionPercent !== undefined
      ? Math.round((100 - data.riderCommissionPercent) * 100) / 100
      : undefined,
  };
  for (const [key, value] of Object.entries(syncMap)) {
    if (value === undefined) continue;
    await prisma.moovyConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), description: `Synced from Biblia Financiera` },
    });
  }
}

/**
 * Update points/MOOVER config
 */
export async function updatePointsConfig(
  data: Partial<PointsMooverConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.pointsPerDollar !== undefined)
    updateData.pointsPerDollar = data.pointsPerDollar;
  if (data.minPurchaseForPoints !== undefined)
    updateData.minPurchaseForPoints = data.minPurchaseForPoints;
  if (data.pointsValue !== undefined) updateData.pointsValue = data.pointsValue;
  if (data.minPointsToRedeem !== undefined)
    updateData.minPointsToRedeem = data.minPointsToRedeem;
  if (data.maxDiscountPercent !== undefined)
    updateData.maxDiscountPercent = data.maxDiscountPercent;
  if (data.signupBonus !== undefined) updateData.signupBonus = data.signupBonus;
  if (data.referralBonus !== undefined)
    updateData.referralBonus = data.referralBonus;
  if (data.refereeBonus !== undefined) updateData.refereeBonus = data.refereeBonus;
  if (data.reviewBonus !== undefined) updateData.reviewBonus = data.reviewBonus;
  if (data.minPurchaseForBonus !== undefined)
    updateData.minPurchaseForBonus = data.minPurchaseForBonus;
  if (data.minReferralPurchase !== undefined)
    updateData.minReferralPurchase = data.minReferralPurchase;
  if (data.tierWindowDays !== undefined)
    updateData.tierWindowDays = data.tierWindowDays;
  if (data.tierConfigJson !== undefined)
    updateData.tierConfigJson = data.tierConfigJson;

  await prisma.pointsConfig.upsert({
    where: { id: "points_config" },
    update: updateData,
    create: { id: "points_config", ...updateData },
  });
}

/**
 * Update cash protocol config
 */
export async function updateCashProtocolConfig(
  data: Partial<CashProtocolConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.cashMpOnlyDeliveries !== undefined)
    updateData.cashMpOnlyDeliveries = data.cashMpOnlyDeliveries;
  if (data.cashLimitL1 !== undefined) updateData.cashLimitL1 = data.cashLimitL1;
  if (data.cashLimitL2 !== undefined) updateData.cashLimitL2 = data.cashLimitL2;
  if (data.cashLimitL3 !== undefined) updateData.cashLimitL3 = data.cashLimitL3;

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: updateData,
    create: { id: "settings", ...updateData },
  });
}

/**
 * Update scheduled delivery config
 */
export async function updateScheduledDeliveryConfig(
  data: Partial<ScheduledDeliveryConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.maxOrdersPerSlot !== undefined)
    updateData.maxOrdersPerSlot = data.maxOrdersPerSlot;
  if (data.slotDurationMinutes !== undefined)
    updateData.slotDurationMinutes = data.slotDurationMinutes;
  if (data.minAnticipationHours !== undefined)
    updateData.minAnticipationHours = data.minAnticipationHours;
  if (data.maxAnticipationHours !== undefined)
    updateData.maxAnticipationHours = data.maxAnticipationHours;
  if (data.operatingHoursStart !== undefined)
    updateData.operatingHoursStart = data.operatingHoursStart;
  if (data.operatingHoursEnd !== undefined)
    updateData.operatingHoursEnd = data.operatingHoursEnd;

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: updateData,
    create: { id: "settings", ...updateData },
  });
}

/**
 * Update timeout config
 */
export async function updateTimeoutConfig(
  data: Partial<TimeoutConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.merchantConfirmTimeoutSec !== undefined)
    updateData.merchantConfirmTimeoutSec = data.merchantConfirmTimeoutSec;
  if (data.driverResponseTimeoutSec !== undefined)
    updateData.driverResponseTimeoutSec = data.driverResponseTimeoutSec;

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: updateData,
    create: { id: "settings", ...updateData },
  });

  // Sync timeout fields to MoovyConfig for assignment-engine and cron consumers
  const syncMap: Record<string, number | undefined> = {
    merchant_confirm_timeout_seconds: data.merchantConfirmTimeoutSec,
    driver_response_timeout_seconds: data.driverResponseTimeoutSec,
  };
  for (const [key, value] of Object.entries(syncMap)) {
    if (value === undefined) continue;
    await prisma.moovyConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), description: `Synced from Biblia Financiera` },
    });
  }
}

/**
 * Update advertising config
 */
export async function updateAdvertisingConfig(
  data: Partial<AdvertisingConfig>,
): Promise<void> {
  const updateData: any = {};

  if (data.adPricePlatino !== undefined)
    updateData.adPricePlatino = data.adPricePlatino;
  if (data.adPriceDestacado !== undefined)
    updateData.adPriceDestacado = data.adPriceDestacado;
  if (data.adPricePremium !== undefined)
    updateData.adPricePremium = data.adPricePremium;
  if (data.adPriceHeroBanner !== undefined)
    updateData.adPriceHeroBanner = data.adPriceHeroBanner;
  if (data.adPriceBannerPromo !== undefined)
    updateData.adPriceBannerPromo = data.adPriceBannerPromo;
  if (data.adPriceProducto !== undefined)
    updateData.adPriceProducto = data.adPriceProducto;
  if (data.adLaunchDiscountPercent !== undefined)
    updateData.adLaunchDiscountPercent = data.adLaunchDiscountPercent;
  if (data.adMaxHeroBannerSlots !== undefined)
    updateData.adMaxHeroBannerSlots = data.adMaxHeroBannerSlots;
  if (data.adMaxDestacadosSlots !== undefined)
    updateData.adMaxDestacadosSlots = data.adMaxDestacadosSlots;
  if (data.adMaxProductosSlots !== undefined)
    updateData.adMaxProductosSlots = data.adMaxProductosSlots;
  if (data.adMinDurationDays !== undefined)
    updateData.adMinDurationDays = data.adMinDurationDays;
  if (data.adDiscount3Months !== undefined)
    updateData.adDiscount3Months = data.adDiscount3Months;
  if (data.adDiscount6Months !== undefined)
    updateData.adDiscount6Months = data.adDiscount6Months;
  if (data.adPaymentMethods !== undefined)
    updateData.adPaymentMethods = data.adPaymentMethods;
  if (data.adCancellation48hFullRefund !== undefined)
    updateData.adCancellation48hFullRefund = data.adCancellation48hFullRefund;
  if (data.adCancellationAdminFeePercent !== undefined)
    updateData.adCancellationAdminFeePercent = data.adCancellationAdminFeePercent;

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: updateData,
    create: { id: "settings", ...updateData },
  });
}

/**
 * Log a config change to audit log
 */
export async function logConfigChange(
  adminUserId: string,
  adminEmail: string,
  configType: string,
  fieldChanged: string,
  oldValue: unknown,
  newValue: unknown,
): Promise<void> {
  try {
    await prisma.configAuditLog.create({
      data: {
        adminUserId,
        adminEmail,
        configType,
        fieldChanged,
        oldValue: JSON.stringify(oldValue),
        newValue: JSON.stringify(newValue),
      },
    });
  } catch (err) {
    console.error("[OpsConfig] Error logging config change:", err);
  }
}

/**
 * Get recent config audit logs
 */
export async function getConfigAuditLogs(limit: number = 50): Promise<any[]> {
  return prisma.configAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Calculate delivery fee with zone and climate multipliers (Biblia Financiera formula)
 * This is the NEW formula that replaces the old fuel-based calculation.
 *
 * fee = max(minimum, base + costPerKm × distance × distanceFactor) × zoneMultiplier × climateMultiplier + (subtotal × operationalCostPercent/100)
 */
export function calculateDeliveryFeeWithConfig(
  distanceKm: number,
  zone: string,
  subtotal: number,
  config: DeliveryConfig,
): {
  fee: number;
  breakdown: { concept: string; amount: number }[];
  riderEarnings: number;
  moovyEarnings: number;
} {
  const zoneKey = zone || "ZONA_A";
  const zoneMult = config.zoneMultipliers[zoneKey] ?? 1.0;
  const climateMult =
    config.climateMultipliers[config.activeClimateCondition] ?? 1.0;

  // Cost per km = fuelPrice × consumption × 2 (round trip factor from Biblia: Factor 2.2 = ida + vuelta + margen)
  const costPerKm = config.fuelPricePerLiter * config.fuelConsumptionPerKm * 2;

  // Base fee + distance cost
  const basePlusDistance = config.baseDeliveryFee + costPerKm * distanceKm;

  // Apply maintenance factor
  const withMaintenance = basePlusDistance * config.maintenanceFactor;

  // Apply zone & climate multipliers
  const withMultipliers = withMaintenance * zoneMult * climateMult;

  // Operational cost (5% of subtotal, embedded in delivery fee)
  const operationalCost = subtotal * (config.operationalCostPercent / 100);

  // Final fee
  const fee = Math.ceil(withMultipliers + operationalCost);

  const breakdown = [
    { concept: "Tarifa base", amount: Math.round(config.baseDeliveryFee) },
    {
      concept: `Distancia (${distanceKm.toFixed(1)} km)`,
      amount: Math.round(costPerKm * distanceKm),
    },
    {
      concept: `Factor mantenimiento (×${config.maintenanceFactor})`,
      amount: Math.round(
        basePlusDistance * (config.maintenanceFactor - 1),
      ),
    },
  ];

  if (zoneMult !== 1.0) {
    breakdown.push({
      concept: `Zona ${zoneKey.replace("ZONA_", "")} (×${zoneMult})`,
      amount: Math.round(withMaintenance * (zoneMult - 1)),
    });
  }

  if (climateMult !== 1.0) {
    breakdown.push({
      concept: `Clima (×${climateMult})`,
      amount: Math.round(withMaintenance * zoneMult * (climateMult - 1)),
    });
  }

  if (operationalCost > 0) {
    breakdown.push({
      concept: `Costo operacional (${config.operationalCostPercent}% sobre $${subtotal})`,
      amount: Math.round(operationalCost),
    });
  }

  breakdown.push({
    concept: "TOTAL tarifa delivery",
    amount: fee,
  });

  // Rider earnings: 80% of final fee (default from StoreSettings.riderCommissionPercent)
  const riderEarnings = Math.round(fee * 0.8);
  // Moovy earnings: remaining 20%
  const moovyEarnings = fee - riderEarnings;

  return {
    fee,
    breakdown,
    riderEarnings,
    moovyEarnings,
  };
}