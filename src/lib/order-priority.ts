/**
 * Order Priority Queue — Priorización de pedidos por urgencia
 *
 * Implementa el P0 de priorización de cola: los pedidos HOT deben
 * asignarse antes que los STANDARD, independientemente del orden de llegada.
 *
 * Factores de prioridad:
 * 1. Tipo de envío (HOT=100, FRESH=80, FRAGILE=30, etc.)
 * 2. Tiempo de espera (antigüedad del pedido)
 * 3. Intentos fallidos de asignación (ya esperó demasiado)
 *
 * Se usa en processExpiredAssignments() del assignment-engine para
 * decidir qué pedido intentar asignar primero.
 */

import { getShipmentType } from "./shipment-types";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface OrderForPriority {
  id: string;
  createdAt: Date;
  /** Código del tipo de envío (HOT, FRESH, etc.) — futuro campo en Order */
  shipmentTypeCode?: string | null;
  /** Intentos de asignación ya realizados */
  assignmentAttempts: number;
  /** Es un pedido programado? */
  deliveryType?: string | null;
  /** Slot de inicio para programados */
  scheduledSlotStart?: Date | null;
}

export interface PrioritizedOrder {
  orderId: string;
  priority: number;
  /** Desglose de la prioridad (para debug y OPS) */
  breakdown: {
    shipmentTypePriority: number;
    waitTimePriority: number;
    retryPriority: number;
    scheduledPenalty: number;
  };
}

// ─── Constantes (defaults, override vía loadOrderPriorityConfig) ─────────────

/** Peso máximo que puede sumar el tiempo de espera */
const MAX_WAIT_PRIORITY = 60;

/** Minutos de espera = +2 de prioridad por minuto */
const WAIT_PRIORITY_PER_MINUTE = 2;

/** Prioridad extra por cada intento fallido de asignación */
const RETRY_PRIORITY_PER_ATTEMPT = 15;

/** Penalidad para pedidos programados (se asignan más adelante) */
const SCHEDULED_PENALTY = -50;

/**
 * Parámetros inyectables de prioridad (cargados desde MoovyConfig).
 * Si no se pasan, se usan las constantes de arriba.
 */
export interface PriorityConfigOverrides {
  maxWaitPriority?: number;
  waitPriorityPerMinute?: number;
  retryPriorityPerAttempt?: number;
  scheduledPenalty?: number;
}

// ─── Funciones ──────────────────────────────────────────────────────────────────

/**
 * Calcula la prioridad de un pedido individual.
 *
 * Mayor número = mayor prioridad = se asigna primero.
 *
 * @example
 * // Pedido HOT creado hace 5 min, primer intento
 * calculateOrderPriority({ id: "x", createdAt: 5minAgo, shipmentTypeCode: "HOT", assignmentAttempts: 0 })
 * // → { priority: 110, breakdown: { shipmentTypePriority: 100, waitTimePriority: 10, retryPriority: 0, scheduledPenalty: 0 } }
 */
export function calculateOrderPriority(
  order: OrderForPriority,
  overrides?: PriorityConfigOverrides,
): PrioritizedOrder {
  const _maxWait = overrides?.maxWaitPriority ?? MAX_WAIT_PRIORITY;
  const _waitPerMin = overrides?.waitPriorityPerMinute ?? WAIT_PRIORITY_PER_MINUTE;
  const _retryPer = overrides?.retryPriorityPerAttempt ?? RETRY_PRIORITY_PER_ATTEMPT;
  const _schedPenalty = overrides?.scheduledPenalty ?? SCHEDULED_PENALTY;

  // 1. Prioridad por tipo de envío
  const shipmentType = getShipmentType(order.shipmentTypeCode);
  const shipmentTypePriority = shipmentType.priorityWeight;

  // 2. Prioridad por tiempo de espera
  const waitMinutes = (Date.now() - order.createdAt.getTime()) / 60000;
  const waitTimePriority = Math.min(
    Math.round(waitMinutes * _waitPerMin),
    _maxWait
  );

  // 3. Prioridad por intentos fallidos
  const retryPriority = order.assignmentAttempts * _retryPer;

  // 4. Penalidad para programados (si el slot es en el futuro, no priorizar ahora)
  let scheduledPenalty = 0;
  if (order.deliveryType === "SCHEDULED" && order.scheduledSlotStart) {
    const minutesToSlot = (order.scheduledSlotStart.getTime() - Date.now()) / 60000;
    if (minutesToSlot > 30) {
      scheduledPenalty = _schedPenalty;
    }
  }

  const priority = shipmentTypePriority + waitTimePriority + retryPriority + scheduledPenalty;

  return {
    orderId: order.id,
    priority,
    breakdown: {
      shipmentTypePriority,
      waitTimePriority,
      retryPriority,
      scheduledPenalty,
    },
  };
}

/**
 * Ordena un array de pedidos por prioridad (mayor primero).
 *
 * Usar en processExpiredAssignments() para decidir qué pedido
 * intentar asignar primero cuando hay varios esperando.
 *
 * @example
 * const orders = [orderStandard, orderHot, orderFresh];
 * const sorted = prioritizeOrders(orders);
 * // sorted[0] será orderHot (prioridad más alta)
 */
export function prioritizeOrders(
  orders: OrderForPriority[],
  overrides?: PriorityConfigOverrides,
): PrioritizedOrder[] {
  return orders
    .map((o) => calculateOrderPriority(o, overrides))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Verifica si un pedido está excediendo su SLA.
 *
 * Retorna true si el tiempo transcurrido desde la creación supera
 * el maxDeliveryMinutes del ShipmentType.
 *
 * Útil para mostrar alertas en OPS y al comprador.
 */
export function isOrderExceedingSLA(order: {
  createdAt: Date;
  shipmentTypeCode?: string | null;
}): { exceeding: boolean; elapsedMinutes: number; slaMinutes: number; percentUsed: number } {
  const shipmentType = getShipmentType(order.shipmentTypeCode);
  const elapsedMinutes = (Date.now() - order.createdAt.getTime()) / 60000;
  const slaMinutes = shipmentType.maxDeliveryMinutes;
  const percentUsed = Math.round((elapsedMinutes / slaMinutes) * 100);

  return {
    exceeding: elapsedMinutes > slaMinutes,
    elapsedMinutes: Math.round(elapsedMinutes),
    slaMinutes,
    percentUsed: Math.min(percentUsed, 999), // Cap for display
  };
}

/**
 * Filtra y clasifica pedidos en categorías de urgencia.
 *
 * Útil para el dashboard OPS.
 */
export function classifyOrderUrgency(orders: OrderForPriority[]): {
  critical: PrioritizedOrder[];   // SLA excedido o >80%
  urgent: PrioritizedOrder[];     // SLA >50% o tipo HOT/FRESH
  normal: PrioritizedOrder[];     // Resto
} {
  const result = {
    critical: [] as PrioritizedOrder[],
    urgent: [] as PrioritizedOrder[],
    normal: [] as PrioritizedOrder[],
  };

  for (const order of orders) {
    const prioritized = calculateOrderPriority(order);
    const slaStatus = isOrderExceedingSLA(order);

    if (slaStatus.exceeding || slaStatus.percentUsed > 80) {
      result.critical.push(prioritized);
    } else if (
      slaStatus.percentUsed > 50 ||
      order.shipmentTypeCode === "HOT" ||
      order.shipmentTypeCode === "FRESH"
    ) {
      result.urgent.push(prioritized);
    } else {
      result.normal.push(prioritized);
    }
  }

  // Ordenar cada grupo por prioridad
  result.critical.sort((a, b) => b.priority - a.priority);
  result.urgent.sort((a, b) => b.priority - a.priority);
  result.normal.sort((a, b) => b.priority - a.priority);

  return result;
}
