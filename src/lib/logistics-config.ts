/**
 * Logistics Config Loaders — Lectura centralizada de configuración logística
 *
 * Todos los módulos P0 (shipment-types, order-priority, eta-calculator,
 * vehicle-type-mapping, shipping-cost-calculator) usan este módulo para
 * leer su configuración desde MoovyConfig.
 *
 * Patrón: cada loader intenta leer de la DB y si falla usa el fallback hardcodeado.
 * Esto garantiza que el sistema funciona incluso sin config en la DB.
 *
 * Las funciones server-side leen directamente de Prisma (no fetch HTTP).
 */

import { prisma } from "./prisma";
import { SHIPMENT_TYPES, type ShipmentTypeCode, type ShipmentTypeDefinition } from "./shipment-types";
import { VEHICLE_SPEEDS, type VehicleTypeEnum } from "./vehicle-type-mapping";
import { DEFAULT_DELIVERY_RATES } from "./shipping-cost-calculator";

// ─── MoovyConfig Keys ───────────────────────────────────────────────────────────

export const CONFIG_KEYS = {
  SHIPMENT_TYPES: "shipment_types_config",
  VEHICLE_SPEEDS: "vehicle_speeds_config",
  ORDER_PRIORITY: "order_priority_config",
  ETA_CALCULATOR: "eta_calculator_config",
  SHIPPING_DEFAULTS: "shipping_cost_defaults",
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface OrderPriorityConfig {
  maxWaitPriority: number;
  waitPriorityPerMinute: number;
  retryPriorityPerAttempt: number;
  scheduledPenalty: number;
}

export interface ETACalculatorConfig {
  defaultDriverWaitTimeMin: number;
  pickupTimeMin: number;
  bufferPercent: number;
  rangeMinus: number;
  rangePlus: number;
}

export type VehicleSpeedsConfig = Record<VehicleTypeEnum, number>;

export type ShippingDefaultsConfig = Record<string, { basePriceArs: number; pricePerKmArs: number }>;

export type ShipmentTypesConfig = Record<ShipmentTypeCode, ShipmentTypeDefinition>;

// ─── Defaults (fallbacks) ───────────────────────────────────────────────────────

export const DEFAULT_ORDER_PRIORITY_CONFIG: OrderPriorityConfig = {
  maxWaitPriority: 60,
  waitPriorityPerMinute: 2,
  retryPriorityPerAttempt: 15,
  scheduledPenalty: -50,
};

export const DEFAULT_ETA_CONFIG: ETACalculatorConfig = {
  defaultDriverWaitTimeMin: 5,
  pickupTimeMin: 3,
  bufferPercent: 0.15,
  rangeMinus: 5,
  rangePlus: 10,
};

// ─── Generic reader ─────────────────────────────────────────────────────────────

async function readConfigJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    if (!config?.value) return fallback;
    const parsed = JSON.parse(config.value);
    return { ...fallback, ...parsed };
  } catch (err) {
    console.warn(`[LogisticsConfig] Error reading "${key}", using defaults:`, err);
    return fallback;
  }
}

async function writeConfigJSON(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.moovyConfig.upsert({
    where: { key },
    update: { value: json },
    create: { key, value: json, description: key },
  });
}

// ─── Loaders (server-side, read from Prisma) ────────────────────────────────────

/**
 * Carga los tipos de envío desde MoovyConfig.
 * Merge con los defaults hardcodeados para no perder propiedades si la config está incompleta.
 */
export async function loadShipmentTypesConfig(): Promise<ShipmentTypesConfig> {
  try {
    const config = await prisma.moovyConfig.findUnique({
      where: { key: CONFIG_KEYS.SHIPMENT_TYPES },
    });
    if (!config?.value) return { ...SHIPMENT_TYPES };

    const saved = JSON.parse(config.value) as Partial<ShipmentTypesConfig>;
    const merged = { ...SHIPMENT_TYPES };

    for (const code of Object.keys(saved) as ShipmentTypeCode[]) {
      if (merged[code]) {
        merged[code] = { ...merged[code], ...saved[code] };
      }
    }

    return merged;
  } catch (err) {
    console.warn("[LogisticsConfig] Error loading shipment types:", err);
    return { ...SHIPMENT_TYPES };
  }
}

/**
 * Carga las velocidades de vehículos desde MoovyConfig.
 */
export async function loadVehicleSpeedsConfig(): Promise<VehicleSpeedsConfig> {
  return readConfigJSON(CONFIG_KEYS.VEHICLE_SPEEDS, { ...VEHICLE_SPEEDS });
}

/**
 * Carga la configuración de prioridad de cola desde MoovyConfig.
 */
export async function loadOrderPriorityConfig(): Promise<OrderPriorityConfig> {
  return readConfigJSON(CONFIG_KEYS.ORDER_PRIORITY, { ...DEFAULT_ORDER_PRIORITY_CONFIG });
}

/**
 * Carga la configuración del calculador de ETA desde MoovyConfig.
 */
export async function loadETACalculatorConfig(): Promise<ETACalculatorConfig> {
  return readConfigJSON(CONFIG_KEYS.ETA_CALCULATOR, { ...DEFAULT_ETA_CONFIG });
}

/**
 * Carga las tarifas de envío por defecto desde MoovyConfig.
 */
export async function loadShippingDefaultsConfig(): Promise<ShippingDefaultsConfig> {
  return readConfigJSON(CONFIG_KEYS.SHIPPING_DEFAULTS, { ...DEFAULT_DELIVERY_RATES });
}

// ─── Writers (server-side, write to Prisma) ─────────────────────────────────────

export async function saveShipmentTypesConfig(config: ShipmentTypesConfig): Promise<void> {
  await writeConfigJSON(CONFIG_KEYS.SHIPMENT_TYPES, config);
}

export async function saveVehicleSpeedsConfig(config: VehicleSpeedsConfig): Promise<void> {
  await writeConfigJSON(CONFIG_KEYS.VEHICLE_SPEEDS, config);
}

export async function saveOrderPriorityConfig(config: OrderPriorityConfig): Promise<void> {
  await writeConfigJSON(CONFIG_KEYS.ORDER_PRIORITY, config);
}

export async function saveETACalculatorConfig(config: ETACalculatorConfig): Promise<void> {
  await writeConfigJSON(CONFIG_KEYS.ETA_CALCULATOR, config);
}

export async function saveShippingDefaultsConfig(config: ShippingDefaultsConfig): Promise<void> {
  await writeConfigJSON(CONFIG_KEYS.SHIPPING_DEFAULTS, config);
}

// ─── Info texts (for OPS UI info buttons) ────────────────────────────────────────

/**
 * Textos de ayuda para cada campo configurable.
 * Cada entrada tiene: label, description, example (opcional), range (opcional).
 */
export const LOGISTICS_INFO_TEXTS = {
  // ── Shipment Types ──
  shipmentType_maxDeliveryMinutes: {
    label: "SLA máximo (minutos)",
    description: "Tiempo máximo permitido para completar la entrega desde que se crea el pedido. Si se excede, el pedido aparece como CRÍTICO en el dashboard.",
    example: "HOT = 45 min (comida caliente), STANDARD = 480 min (mismo día)",
  },
  shipmentType_priorityWeight: {
    label: "Peso de prioridad",
    description: "Cuántos puntos de prioridad aporta este tipo en la cola de asignación. Mayor número = se asigna primero. Un pedido HOT (100) se asigna antes que uno STANDARD (0) aunque haya llegado después.",
    example: "HOT = 100, FRESH = 80, FRAGILE = 30, STANDARD = 0",
  },
  shipmentType_surchargeArs: {
    label: "Recargo (ARS)",
    description: "Monto extra que se suma al costo de envío por la naturaleza especial del producto. Se cobra al comprador.",
    example: "FRESH = $200 (cadena de frío), FRAGILE = $150 (manipulación cuidadosa)",
  },
  shipmentType_allowedVehicles: {
    label: "Vehículos permitidos",
    description: "Tipos de vehículo que pueden transportar este envío. Se intersecta con los vehículos permitidos por la categoría de paquete (MICRO→XL).",
    example: "HOT permite BIKE, MOTO, CAR (no TRUCK). FRAGILE solo CAR y TRUCK.",
  },
  shipmentType_requiresThermalBag: {
    label: "Requiere bolsa térmica",
    description: "Si está activo, solo se asignan repartidores que tengan declarada una bolsa térmica. Importante para comida caliente.",
  },
  shipmentType_requiresColdChain: {
    label: "Requiere cadena de frío",
    description: "Si está activo, solo se asignan repartidores con equipamiento de frío. Para perecederos y congelados.",
  },
  shipmentType_requiresCarefulHandle: {
    label: "Requiere manipulación cuidadosa",
    description: "Indica que el paquete es frágil y necesita cuidado especial durante el transporte.",
  },

  // ── Vehicle Speeds ──
  vehicleSpeed: {
    label: "Velocidad promedio (km/h)",
    description: "Velocidad promedio en zona urbana usada para calcular el ETA. Afecta directamente el tiempo estimado de entrega que ve el comprador.",
    example: "MOTO = 25 km/h en ciudad con tráfico, BIKE = 12 km/h",
  },

  // ── Order Priority ──
  priority_maxWaitPriority: {
    label: "Prioridad máxima por espera",
    description: "Tope máximo de puntos que un pedido puede acumular solo por el tiempo que lleva esperando. Evita que pedidos viejos monopolicen la cola.",
    example: "Con valor 60, un pedido nunca gana más de 60 puntos por espera.",
  },
  priority_waitPriorityPerMinute: {
    label: "Puntos por minuto de espera",
    description: "Cuántos puntos de prioridad gana un pedido por cada minuto que pasa sin ser asignado. Mayor valor = los pedidos viejos suben más rápido en la cola.",
    example: "Con valor 2, un pedido de 10 min tiene +20 puntos.",
  },
  priority_retryPriorityPerAttempt: {
    label: "Puntos por reintento fallido",
    description: "Puntos extra que gana un pedido cada vez que un repartidor rechaza o no responde. Pedidos que ya fueron rechazados suben en prioridad.",
    example: "Con valor 15, un pedido rechazado 3 veces tiene +45 puntos.",
  },
  priority_scheduledPenalty: {
    label: "Penalidad para programados",
    description: "Puntos que se RESTAN a pedidos programados cuyo horario de entrega es en más de 30 minutos. Los pedidos inmediatos tienen prioridad.",
    example: "Con valor -50, un pedido programado para dentro de 1 hora pierde 50 puntos.",
  },

  // ── ETA Calculator ──
  eta_defaultDriverWaitTimeMin: {
    label: "Espera de repartidor (min)",
    description: "Tiempo promedio que tarda en asignarse un repartidor cuando no hay uno asignado todavía. Se suma al ETA que ve el comprador antes de pagar.",
    example: "Con valor 5, el ETA incluye 5 min de espera por repartidor.",
  },
  eta_pickupTimeMin: {
    label: "Tiempo de retiro (min)",
    description: "Tiempo promedio que el repartidor tarda en retirar el pedido una vez que llega al comercio (estacionar, entrar, recibir paquete).",
    example: "Con valor 3, se suman 3 min al ETA por el retiro en el local.",
  },
  eta_bufferPercent: {
    label: "Buffer de imprevistos (%)",
    description: "Porcentaje extra que se agrega al tiempo de viaje para cubrir imprevistos (tráfico, semáforos, desvíos). Se aplica solo sobre el tiempo de traslado, no sobre la preparación.",
    example: "Con 0.15, un viaje de 20 min se estima en 23 min (20 + 15%).",
  },
  eta_rangeMinus: {
    label: "Margen inferior del rango (min)",
    description: "Minutos que se restan al ETA estimado para dar el extremo optimista del rango. El comprador ve un rango, no un número exacto.",
    example: "ETA 35 min con margen 5 = comprador ve '30-45 min'.",
  },
  eta_rangePlus: {
    label: "Margen superior del rango (min)",
    description: "Minutos que se suman al ETA estimado para dar el extremo pesimista del rango.",
    example: "ETA 35 min con margen 10 = comprador ve '30-45 min'.",
  },

  // ── Shipping Defaults ──
  shipping_basePriceArs: {
    label: "Tarifa base (ARS)",
    description: "Costo fijo mínimo de envío para esta categoría de paquete, sin contar la distancia. Se usa como fallback si la tabla DeliveryRate no tiene datos.",
    example: "MICRO = $400 (sobre), XL = $1200 (mueble grande)",
  },
  shipping_pricePerKmArs: {
    label: "Precio por km (ARS)",
    description: "Costo adicional por cada kilómetro de distancia entre el comercio y el destino. Se usa como fallback si la tabla DeliveryRate no tiene datos.",
    example: "MICRO = $150/km, XL = $500/km",
  },
} as const;
