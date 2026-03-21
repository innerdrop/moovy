/**
 * ETA Calculator — Estimación completa de tiempo de entrega con SLA
 *
 * Resuelve el P0 de maxDeliveryTimeMinutes / SLA diferenciado.
 *
 * El ETA actual (geo.ts) solo calcula tiempo de viaje.
 * Este módulo calcula el ETA completo:
 *   1. Tiempo de preparación del comercio
 *   2. Tiempo de espera de driver (si no hay uno asignado)
 *   3. Tiempo driver → comercio
 *   4. Tiempo en comercio (retiro)
 *   5. Tiempo comercio → destino
 *   6. Buffer de imprevistos (15%)
 *
 * Y lo cruza contra el SLA del ShipmentType para alertar si se excede.
 */

import { getVehicleSpeed } from "./vehicle-type-mapping";
import { getShipmentType, type ShipmentTypeCode } from "./shipment-types";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ETAParams {
  /** Distancia driver actual → comercio (km). 0 si no hay driver asignado. */
  distanceDriverToMerchantKm: number;
  /** Distancia comercio → cliente (km) */
  distanceMerchantToCustomerKm: number;
  /** Tipo de vehículo del driver (se normaliza internamente) */
  vehicleType?: string | null;
  /** Tiempo de preparación del comercio en minutos (Merchant.deliveryTimeMin) */
  merchantPrepTimeMin: number;
  /** Tipo de envío */
  shipmentTypeCode: ShipmentTypeCode | string;
  /** Ya hay un driver asignado? */
  hasDriverAssigned: boolean;
}

export interface ETAResult {
  /** ETA total estimado en minutos */
  totalMinutes: number;
  /** Rango inferior (optimista) */
  rangeMinMinutes: number;
  /** Rango superior (pesimista) */
  rangeMaxMinutes: number;
  /** Desglose detallado */
  breakdown: ETABreakdown;
  /** Excede el SLA del tipo de envío? */
  exceedsSLA: boolean;
  /** SLA máximo en minutos para este tipo */
  slaMinutes: number;
  /** Porcentaje del SLA usado (0-100+) */
  slaPercentUsed: number;
  /** Label para mostrar al comprador: "35-50 min" */
  displayLabel: string;
  /** Advertencia si excede SLA */
  slaWarning?: string;
}

export interface ETABreakdown {
  prepTime: number;
  driverWaitTime: number;
  driverToMerchant: number;
  pickupTime: number;
  merchantToCustomer: number;
  buffer: number;
}

// ─── Constantes ─────────────────────────────────────────────────────────────────

/** Tiempo promedio de espera si no hay driver asignado (minutos) */
const DEFAULT_DRIVER_WAIT_TIME = 5;

/** Tiempo promedio de retiro en el comercio (minutos) */
const PICKUP_TIME = 3;

/** Porcentaje de buffer sobre el tiempo de viaje */
const BUFFER_PERCENT = 0.15;

/** Margen inferior del rango (minutos menos que el estimado) */
const RANGE_MINUS = 5;

/** Margen superior del rango (minutos más que el estimado) */
const RANGE_PLUS = 10;

// ─── Funciones ──────────────────────────────────────────────────────────────────

/**
 * Calcula el ETA completo de un envío.
 *
 * @example
 * const eta = calculateFullETA({
 *   distanceDriverToMerchantKm: 1.5,
 *   distanceMerchantToCustomerKm: 3.0,
 *   vehicleType: "MOTO",
 *   merchantPrepTimeMin: 15,
 *   shipmentTypeCode: "HOT",
 *   hasDriverAssigned: true,
 * });
 * // eta.totalMinutes → ~28
 * // eta.displayLabel → "23-38 min"
 * // eta.exceedsSLA → false (45 min SLA para HOT)
 */
export function calculateFullETA(params: ETAParams): ETAResult {
  const speed = getVehicleSpeed(params.vehicleType);
  const shipmentType = getShipmentType(params.shipmentTypeCode);

  // 1. Tiempo de preparación del comercio
  const prepTime = Math.max(params.merchantPrepTimeMin, 0);

  // 2. Tiempo de espera de driver
  const driverWaitTime = params.hasDriverAssigned ? 0 : DEFAULT_DRIVER_WAIT_TIME;

  // 3. Tiempo driver → comercio
  const driverToMerchant = params.hasDriverAssigned
    ? calculateTravelMinutes(params.distanceDriverToMerchantKm, speed)
    : 0; // Si no hay driver, ya se contó en driverWaitTime

  // 4. Tiempo en comercio (retiro)
  const pickupTime = PICKUP_TIME;

  // 5. Tiempo comercio → destino
  const merchantToCustomer = calculateTravelMinutes(params.distanceMerchantToCustomerKm, speed);

  // 6. Buffer de imprevistos (sobre tiempo de viaje)
  const travelTime = driverToMerchant + merchantToCustomer;
  const buffer = Math.ceil(travelTime * BUFFER_PERCENT);

  // Total
  const totalMinutes = prepTime + driverWaitTime + driverToMerchant + pickupTime + merchantToCustomer + buffer;

  // Rango
  const rangeMinMinutes = Math.max(totalMinutes - RANGE_MINUS, 1);
  const rangeMaxMinutes = totalMinutes + RANGE_PLUS;

  // SLA check
  const slaMinutes = shipmentType.maxDeliveryMinutes;
  const exceedsSLA = totalMinutes > slaMinutes;
  const slaPercentUsed = Math.round((totalMinutes / slaMinutes) * 100);

  // Display label
  const displayLabel = formatETALabel(rangeMinMinutes, rangeMaxMinutes);

  // Warning
  let slaWarning: string | undefined;
  if (exceedsSLA) {
    slaWarning = `El tiempo estimado (${totalMinutes} min) excede el SLA de ${shipmentType.name} (${slaMinutes} min). ` +
      `Considere informar al comprador antes de confirmar.`;
  } else if (slaPercentUsed > 80) {
    slaWarning = `El tiempo estimado está al ${slaPercentUsed}% del SLA de ${shipmentType.name}.`;
  }

  return {
    totalMinutes,
    rangeMinMinutes,
    rangeMaxMinutes,
    breakdown: {
      prepTime,
      driverWaitTime,
      driverToMerchant,
      pickupTime,
      merchantToCustomer,
      buffer,
    },
    exceedsSLA,
    slaMinutes,
    slaPercentUsed,
    displayLabel,
    slaWarning,
  };
}

/**
 * Calcula un ETA simplificado para mostrar al comprador ANTES de pagar.
 *
 * Usa valores promedio para driver wait y distancia al comercio,
 * ya que no se sabe qué driver se asignará.
 */
export function calculatePreCheckoutETA(params: {
  distanceMerchantToCustomerKm: number;
  merchantPrepTimeMin: number;
  shipmentTypeCode: ShipmentTypeCode | string;
  /** Tipo de vehículo más probable para esta categoría de paquete */
  likelyVehicleType?: string;
}): ETAResult {
  return calculateFullETA({
    distanceDriverToMerchantKm: 1.0, // Promedio 1km de distancia driver-merchant
    distanceMerchantToCustomerKm: params.distanceMerchantToCustomerKm,
    vehicleType: params.likelyVehicleType ?? "MOTO",
    merchantPrepTimeMin: params.merchantPrepTimeMin,
    shipmentTypeCode: params.shipmentTypeCode,
    hasDriverAssigned: false,
  });
}

// ─── Helpers internos ───────────────────────────────────────────────────────────

/**
 * Calcula minutos de viaje basado en distancia y velocidad.
 * Mínimo 2 minutos (para distancias muy cortas).
 */
function calculateTravelMinutes(distanceKm: number, speedKmh: number): number {
  if (distanceKm <= 0) return 0;
  const minutes = Math.ceil((distanceKm / speedKmh) * 60);
  return Math.max(minutes, 2);
}

/**
 * Formatea el rango de ETA para mostrar al comprador.
 *
 * @example
 * formatETALabel(25, 40)  // "25-40 min"
 * formatETALabel(65, 90)  // "1h 5min - 1h 30min"
 */
function formatETALabel(minMinutes: number, maxMinutes: number): string {
  if (maxMinutes <= 60) {
    return `${minMinutes}-${maxMinutes} min`;
  }

  const formatTime = (m: number): string => {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return `${formatTime(minMinutes)} - ${formatTime(maxMinutes)}`;
}
