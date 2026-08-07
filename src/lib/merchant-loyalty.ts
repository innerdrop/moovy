/**
 * Merchant Loyalty Program Service
 *
 * Manages merchant tiers (BRONCE, PLATA, ORO, DIAMANTE) based on monthly order volume.
 * Tiers provide reduced commission rates and visibility benefits.
 *
 * Tier thresholds (default):
 * - BRONCE: 0-30 pedidos/mes → 10% comisión
 * - PLATA: 31-80 pedidos/mes → 9% comisión
 * - ORO: 81-150 pedidos/mes → 8% comisión
 * - DIAMANTE: 151+ pedidos/mes → 7% comisión
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
 * Fecha base de la ventana de mes gratis (feat/panel-inmediato-comercio):
 * el trial arranca al APROBARSE el comercio (cuando puede vender), NO al
 * registrarse — con panel inmediato el comercio arma su tienda en PENDING y
 * sería injusto quemarle días gratis que no puede usar.
 *   - No aprobado → null (el trial todavía no empezó).
 *   - Aprobado con approvedAt → approvedAt.
 *   - Aprobado legacy sin approvedAt → createdAt (respaldo conservador).
 */
export function firstMonthFreeBaseDate(m: {
  createdAt: Date;
  approvedAt: Date | null;
  approvalStatus: string;
}): Date | null {
  if (m.approvalStatus !== "APPROVED") return null;
  return m.approvedAt ?? m.createdAt;
}

/**
 * Indica si un comercio está dentro de su ventana de mes gratis.
 *
 * @param baseDate fecha base del trial (usar firstMonthFreeBaseDate)
 * @param now reloj inyectable para tests; default Date.now()
 */
export function isInFirstMonthFree(baseDate: Date, now: Date = new Date()): boolean {
  const diffMs = now.getTime() - baseDate.getTime();
  // Si diffMs < 0 (fecha futura por clock skew), igual estamos en la ventana.
  return diffMs < FIRST_MONTH_FREE_MS;
}

/**
 * Fecha exacta de fin del mes gratis.
 * Se usa para mostrar al comercio "Tu período sin comisión vence el DD/MM/AAAA".
 */
export function getFirstMonthFreeEndDate(baseDate: Date): Date {
  return new Date(baseDate.getTime() + FIRST_MONTH_FREE_MS);
}

/**
 * Días restantes del mes gratis. 0 si ya venció.
 * Útil para mensajes urgentes tipo "Te quedan 3 días sin comisión".
 */
export function getFirstMonthFreeDaysRemaining(baseDate: Date, now: Date = new Date()): number {
  const endDate = getFirstMonthFreeEndDate(baseDate);
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
 * ALWAYS use this for commission calculations, never hardcode the rate.
 *
 * Prioridad (Biblia Financiera v3):
 *   1. commissionOverride manual del admin (convenio especial) — gana siempre.
 *   2. Mes 1 gratis: 0% durante los primeros FIRST_MONTH_FREE_DAYS desde createdAt.
 *   3. Tier del programa de fidelización (BRONCE 10%, PLATA 9%, ORO 8%, DIAMANTE 7%).
 *   4. Fallback 10% si no hay config.
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
  // Rama fix/biblia-motor-envio-y-comisiones: el FALLBACK ya NO es un número hardcodeado.
  // Lee defaultMerchantCommission de la Biblia (StoreSettings), con 10 como respaldo
  // conservador solo si la config no existe. Respeta la precedencia canónica:
  // override > first-month > tier > default Biblia.
  const fallbackRate = await getDefaultMerchantCommission();
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { loyaltyTier: true, commissionOverride: true, createdAt: true, approvedAt: true, approvalStatus: true },
    });

    if (!merchant) {
      return { rate: fallbackRate, source: "FALLBACK", tier: null };
    }

    // 1. Override admin (gana sobre todo)
    if (merchant.commissionOverride !== null && merchant.commissionOverride !== undefined) {
      return { rate: merchant.commissionOverride, source: "OVERRIDE", tier: null };
    }

    // 2. First-month-free (base = aprobación; ver firstMonthFreeBaseDate)
    const firstMonthBase = firstMonthFreeBaseDate(merchant);
    if (firstMonthBase && isInFirstMonthFree(firstMonthBase)) {
      loyaltyLogger.info(
        { merchantId, firstMonthBase },
        "Merchant in first-month-free window, commission = 0%"
      );
      return { rate: 0, source: "FIRST_MONTH", tier: null };
    }

    // 3. Tier del programa de fidelización
    const tier = merchant.loyaltyTier as MerchantTierType;
    const tierConfig = await getTierConfig(tier);

    if (!tierConfig) {
      return { rate: fallbackRate, source: "FALLBACK", tier: null };
    }

    return { rate: tierConfig.commissionRate, source: "TIER", tier };
  } catch (error) {
    loyaltyLogger.error({ error, merchantId }, "Error getting effective commission");
    return { rate: fallbackRate, source: "FALLBACK", tier: null };
  }
}

/**
 * Lee la comisión merchant por default de la Biblia (StoreSettings.defaultMerchantCommission).
 * Rama fix/biblia-motor-envio-y-comisiones. Respaldo conservador 10% si falta config
 * (regla #15: defaults conservadores). Cache 1 min para no pegarle a la DB en cada pedido.
 */
let _defaultMerchantCommissionCache: { value: number; at: number } | null = null;
const DEFAULT_COMMISSION_TTL_MS = 60_000;
export async function getDefaultMerchantCommission(): Promise<number> {
  if (_defaultMerchantCommissionCache && Date.now() - _defaultMerchantCommissionCache.at < DEFAULT_COMMISSION_TTL_MS) {
    return _defaultMerchantCommissionCache.value;
  }
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "settings" },
      select: { defaultMerchantCommission: true } as any,
    });
    const raw = (settings as any)?.defaultMerchantCommission;
    // feat/comision-10-canonica: el default de lanzamiento es 10% (el 8% quedó obsoleto).
    const value = typeof raw === "number" && raw >= 0 ? raw : 10;
    _defaultMerchantCommissionCache = { value, at: Date.now() };
    return value;
  } catch {
    return 10;
  }
}

/**
 * Todo lo que el panel necesita para hablarle de comisión al comercio, en un
 * solo objeto: qué paga hoy, hasta cuándo, y qué paga después.
 *
 * Rama fix/la-comision-que-ve-el-comercio. Existe porque el panel le mostraba
 * al comercio tres números distintos al mismo tiempo: 0% en el tablero (mes
 * gratis) y Merchant.commissionRate crudo — una columna legacy con @default(8)
 * que NO se cobra en ningún lado — en Pagos y en Configuración. La liquidación
 * real siempre salió de getEffectiveCommissionWithSource.
 *
 * Regla: ninguna pantalla del panel lee Merchant.commissionRate. Se muestra lo
 * que se cobra, y nada más.
 */
export interface CommissionForDisplay {
  /** Lo que paga HOY. Es el mismo número con el que se liquida cada pedido. */
  rate: number;
  source: CommissionSource;
  /** true mientras corre la ventana sin comisión. */
  firstMonthFree: boolean;
  /** Fin del mes gratis en ISO. null si no aplica. */
  firstMonthEndsAt: string | null;
  /** Lo que va a pagar cuando termine el mes gratis. null si no está en esa ventana. */
  rateAfterFirstMonth: number | null;
}

export async function getCommissionForDisplay(merchantId: string): Promise<CommissionForDisplay> {
  const effective = await getEffectiveCommissionWithSource(merchantId);

  // Fuera del mes gratis no hay nada que anticipar: el número de hoy es el
  // número. (Incluye OVERRIDE: si hay convenio, manda el convenio.)
  if (effective.source !== "FIRST_MONTH") {
    return {
      rate: effective.rate,
      source: effective.source,
      firstMonthFree: false,
      firstMonthEndsAt: null,
      rateAfterFirstMonth: null,
    };
  }

  // En mes gratis decir "0%" a secas es peor que no decir nada: el comercio
  // arma sus precios sobre un número que se le vence sin aviso. Va con fecha
  // de vencimiento y con el porcentaje que viene después.
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { loyaltyTier: true, createdAt: true, approvedAt: true, approvalStatus: true },
  });

  const base = merchant ? firstMonthFreeBaseDate(merchant) : null;
  const tierConfig = merchant ? await getTierConfig(merchant.loyaltyTier as MerchantTierType) : null;
  const rateAfterFirstMonth = tierConfig ? tierConfig.commissionRate : await getDefaultMerchantCommission();

  return {
    rate: effective.rate,
    source: effective.source,
    firstMonthFree: true,
    firstMonthEndsAt: base ? getFirstMonthFreeEndDate(base).toISOString() : null,
    rateAfterFirstMonth,
  };
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

// getMerchantLoyaltyWidget vivia aca. Se fue con MerchantLoyaltyWidget.tsx y
// con /api/merchant/loyalty en fix/la-comision-que-ve-el-comercio: el widget no
// estaba montado en ninguna pantalla (regla #10, endpoints huerfanos) y ademas
// mostraba el rate del tier al lado del cartel de 0% del mes gratis. Si algun
// dia hace falta un widget de niveles, esta en el historial de git.
