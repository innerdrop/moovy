/**
 * Shipping Cost Calculator — Calculadora unificada de costo de envío (server-side)
 *
 * Resuelve el P0 de validación server-side del deliveryFee.
 * Unifica los dos sistemas que coexistían sin conectarse:
 *   - Sistema 1 (fuel-based): delivery.ts — cobro al comprador
 *   - Sistema 2 (category-based): DeliveryRate — ganancias del driver
 *
 * Ahora el costo al comprador se basa en:
 *   1. Tarifa por PackageCategory (DeliveryRate: base + $/km)
 *   2. Recargo por ShipmentType (HOT, FRESH, FRAGILE)
 *   3. Free delivery del comercio (si corresponde)
 *
 * IMPORTANTE: Este cálculo SIEMPRE debe ejecutarse en el server al crear la orden.
 * NUNCA confiar en el deliveryFee que envía el frontend.
 *
 * Ver CAMBIOS_COMPARTIDOS_LOGISTICS.md para la integración con api/orders/route.ts.
 */

import { getShipmentType, type ShipmentTypeCode } from "./shipment-types";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ShippingCostParams {
  /** Distancia merchant → cliente en km */
  distanceKm: number;
  /** Categoría de paquete: MICRO, SMALL, MEDIUM, LARGE, XL */
  packageCategory: string;
  /** Tipo de envío: HOT, FRESH, FRAGILE, STANDARD, DOCUMENT */
  shipmentTypeCode: ShipmentTypeCode | string;
  /** Total del pedido (para evaluar free delivery) */
  orderTotal: number;
  /** Monto mínimo para envío gratis del comercio (null = no aplica) */
  freeDeliveryMinimum: number | null;
  /** Si es retiro en local */
  isPickup?: boolean;
  /** Biblia v3: % de costo operativo sobre orderTotal (default 5%) */
  operationalCostPercent?: number;
}

export interface ShippingCostResult {
  /** Costo base por categoría de paquete */
  baseCost: number;
  /** Recargo por km */
  distanceCost: number;
  /** Subtotal (base + distancia) */
  subtotal: number;
  /** Recargo por tipo de envío (FRESH, FRAGILE, etc.) */
  shipmentSurcharge: number;
  /** Total antes de descuentos */
  totalBeforeDiscounts: number;
  /** Es envío gratis? */
  isFreeDelivery: boolean;
  /** Motivo del envío gratis */
  freeDeliveryReason?: string;
  /** Total final a cobrar al comprador */
  total: number;
  /** Desglose legible */
  breakdown: ShippingBreakdownItem[];
}

export interface ShippingBreakdownItem {
  concept: string;
  amount: number;
}

// ─── Tarifas por PackageCategory ────────────────────────────────────────────────

/**
 * Tarifas base por categoría de paquete.
 *
 * En producción estos valores deberían leerse de la tabla DeliveryRate.
 * Estos defaults se usan como fallback si la tabla no tiene datos.
 */
export const DEFAULT_DELIVERY_RATES: Record<string, { basePriceArs: number; pricePerKmArs: number }> = {
  MICRO:    { basePriceArs: 400, pricePerKmArs: 150 },
  SMALL:    { basePriceArs: 500, pricePerKmArs: 200 },
  MEDIUM:   { basePriceArs: 600, pricePerKmArs: 250 },
  LARGE:    { basePriceArs: 800, pricePerKmArs: 350 },
  XL:       { basePriceArs: 1200, pricePerKmArs: 500 },
};

// ─── Calculadora principal ──────────────────────────────────────────────────────

/**
 * Calcula el costo de envío server-side.
 *
 * @param params - Parámetros del envío
 * @param deliveryRates - Tarifas por categoría (de DeliveryRate table). Si no se pasan, usa defaults.
 * @returns Resultado con desglose completo
 *
 * @example
 * const cost = calculateShippingCost({
 *   distanceKm: 3.5,
 *   packageCategory: "MEDIUM",
 *   shipmentTypeCode: "HOT",
 *   orderTotal: 5000,
 *   freeDeliveryMinimum: null,
 * });
 * // cost.total → 1475 (600 base + 875 distancia + 0 recargo HOT)
 */
export function calculateShippingCost(
  params: ShippingCostParams,
  deliveryRates?: Record<string, { basePriceArs: number; pricePerKmArs: number }>
): ShippingCostResult {
  // Retiro en local = costo 0
  if (params.isPickup) {
    return {
      baseCost: 0,
      distanceCost: 0,
      subtotal: 0,
      shipmentSurcharge: 0,
      totalBeforeDiscounts: 0,
      isFreeDelivery: false,
      total: 0,
      breakdown: [{ concept: "Retiro en local", amount: 0 }],
    };
  }

  const rates = deliveryRates ?? DEFAULT_DELIVERY_RATES;
  const category = params.packageCategory.toUpperCase();
  const rate = rates[category] ?? DEFAULT_DELIVERY_RATES.MEDIUM; // Fallback a MEDIUM

  // 1. Costo base por categoría
  const baseCost = rate.basePriceArs;

  // 2. Costo por distancia
  const distanceCost = Math.round(rate.pricePerKmArs * params.distanceKm);

  // 3. Subtotal
  const subtotal = baseCost + distanceCost;

  // 4. Recargo por tipo de envío
  const shipmentType = getShipmentType(params.shipmentTypeCode);
  const shipmentSurcharge = shipmentType.surchargeArs;

  // 5. Costo operativo (Biblia v3: 5% del subtotal del pedido, cubre MP 3.81% + margen)
  const opPercent = params.operationalCostPercent ?? 5;
  const operationalCost = Math.round(params.orderTotal * (opPercent / 100));

  // 6. Total antes de descuentos (envío + recargo + operativo)
  const totalBeforeDiscounts = subtotal + shipmentSurcharge + operationalCost;

  // 7. Evaluar envío gratis
  let isFreeDelivery = false;
  let freeDeliveryReason: string | undefined;

  if (
    params.freeDeliveryMinimum !== null &&
    params.freeDeliveryMinimum > 0 &&
    params.orderTotal >= params.freeDeliveryMinimum
  ) {
    isFreeDelivery = true;
    freeDeliveryReason = `Envío gratis por compra mayor a $${params.freeDeliveryMinimum}`;
  }

  // 8. Total final (si es gratis, solo se cobra el operativo — Moovy no puede perder el costo MP)
  const total = isFreeDelivery ? operationalCost : Math.ceil(totalBeforeDiscounts);

  // 9. Desglose
  const breakdown: ShippingBreakdownItem[] = [
    { concept: `Envío ${category}`, amount: baseCost },
    { concept: `Distancia (${params.distanceKm.toFixed(1)} km)`, amount: distanceCost },
  ];

  if (shipmentSurcharge > 0) {
    breakdown.push({ concept: `Recargo ${shipmentType.name}`, amount: shipmentSurcharge });
  }

  if (operationalCost > 0) {
    breakdown.push({ concept: `Costo operativo (${opPercent}%)`, amount: operationalCost });
  }

  if (isFreeDelivery) {
    breakdown.push({ concept: freeDeliveryReason!, amount: -(subtotal + shipmentSurcharge) });
  }

  return {
    baseCost,
    distanceCost,
    subtotal,
    shipmentSurcharge,
    totalBeforeDiscounts,
    isFreeDelivery,
    freeDeliveryReason,
    total,
    breakdown,
  };
}

/**
 * Valida que el deliveryFee enviado por el frontend sea razonable.
 *
 * Compara el fee del frontend con el cálculo server-side.
 * Si la diferencia es mayor al umbral permitido, retorna el cálculo correcto.
 *
 * @param frontendFee - Fee enviado por el frontend
 * @param serverResult - Resultado del cálculo server-side
 * @param tolerancePercent - Porcentaje de tolerancia (default 10%)
 * @returns El fee correcto a usar y si hubo discrepancia
 */
export function validateDeliveryFee(
  frontendFee: number,
  serverResult: ShippingCostResult,
  tolerancePercent: number = 10
): { correctedFee: number; wasModified: boolean; reason?: string } {
  const serverFee = serverResult.total;

  // Si es envío gratis, siempre 0
  if (serverResult.isFreeDelivery) {
    return {
      correctedFee: 0,
      wasModified: frontendFee !== 0,
      reason: frontendFee !== 0 ? "Envío gratis aplicado server-side" : undefined,
    };
  }

  // Si el frontend envió 0 pero no es gratis → corregir
  if (frontendFee === 0 && serverFee > 0) {
    return {
      correctedFee: serverFee,
      wasModified: true,
      reason: "Frontend envió $0 pero el envío no es gratis",
    };
  }

  // Calcular diferencia porcentual
  const diff = Math.abs(frontendFee - serverFee);
  const tolerance = serverFee * (tolerancePercent / 100);

  if (diff > tolerance) {
    return {
      correctedFee: serverFee,
      wasModified: true,
      reason: `Diferencia de $${diff} excede tolerancia de ${tolerancePercent}% ($${Math.round(tolerance)})`,
    };
  }

  // Dentro de tolerancia: usar el del server de todas formas (es más preciso)
  return {
    correctedFee: serverFee,
    wasModified: serverFee !== frontendFee,
    reason: serverFee !== frontendFee ? "Ajuste menor dentro de tolerancia" : undefined,
  };
}

/**
 * Calcula las ganancias estimadas del driver para un envío.
 *
 * Usa las mismas DeliveryRates pero con la fórmula de earnings:
 * earnings = basePriceArs + pricePerKmArs × distanciaKm
 *
 * Es similar al cálculo del comprador pero sin recargos de shipmentType
 * (el recargo es para MOOVY, no para el driver).
 */
export function calculateDriverEarnings(
  packageCategory: string,
  totalDistanceKm: number,
  deliveryRates?: Record<string, { basePriceArs: number; pricePerKmArs: number }>
): number {
  const rates = deliveryRates ?? DEFAULT_DELIVERY_RATES;
  const category = packageCategory.toUpperCase();
  const rate = rates[category] ?? DEFAULT_DELIVERY_RATES.MEDIUM;

  const earnings = rate.basePriceArs + rate.pricePerKmArs * totalDistanceKm;
  return Math.round(earnings);
}
