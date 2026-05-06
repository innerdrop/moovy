/**
 * Order State Machine Paralela
 * Rama: fix/state-machine-paralela-merchant-driver
 *
 * El campo legacy `status` mezclaba flujo del comercio y del driver. Los nuevos
 * campos `merchantStatus` y `driverStatus` los separan. Este helper:
 *
 *   1. Mapea legacy -> parallel (back-fill de pedidos viejos / fallback)
 *   2. Mapea parallel -> legacy (mantener `status` en sync para consumers
 *      que aún no migraron — UI legacy, dashboards externos, MP webhook)
 *
 * IMPORTANTE: El campo `status` legacy QUEDA como vista derivada. Cualquier
 * endpoint que actualice `merchantStatus` o `driverStatus` DEBE recalcular
 * `status` y actualizarlo en el mismo $transaction.
 *
 * Estados parallel:
 *
 *   merchantStatus:
 *     PREPARING            (default; comercio prepara el pedido)
 *     READY                (listo para retirar; el driver puede aplicar pickup PIN)
 *     PICKED_UP            (driver retiró; pickup PIN OK)
 *     RETURNED             (driver devolvió; re-pickup PIN OK por no-show)
 *
 *   driverStatus:
 *     ASSIGNED             (default; driver aceptó la asignación)
 *     AT_MERCHANT          (driver llegó al comercio, esperando que esté listo)
 *     ON_ROUTE_TO_CUSTOMER (driver salió del comercio con el pedido)
 *     AT_CUSTOMER          (driver llegó al domicilio del cliente)
 *     WAITING_FOR_CUSTOMER (driver tocó "Llegué", timer 10 min, GPS continuo)
 *     DELIVERED            (delivery PIN OK)
 *     RETURNING_TO_MERCHANT (cliente no apareció, driver vuelve al comercio)
 *     RETURNED             (driver entregó devolución al comercio, re-pickup PIN OK)
 */

export type MerchantStatus =
    | "PREPARING"
    | "READY"
    | "PICKED_UP"
    | "RETURNED";

export type DriverStatus =
    | "ASSIGNED"
    | "AT_MERCHANT"
    | "ON_ROUTE_TO_CUSTOMER"
    | "AT_CUSTOMER"
    | "WAITING_FOR_CUSTOMER"
    | "DELIVERED"
    | "RETURNING_TO_MERCHANT"
    | "RETURNED";

/**
 * Calcula el `status` legacy a partir de los campos parallel.
 * Mantiene compatibilidad con consumers que todavía leen `status`.
 *
 * Reglas:
 *   - Si driverStatus terminal (DELIVERED/RETURNED) -> status = ese
 *   - Si driverStatus avanzado -> status mapea al legacy más cercano
 *   - Si solo merchantStatus avanzó (driver aún ASSIGNED) -> READY
 */
export function deriveLegacyStatus(
    merchantStatus: MerchantStatus | null | undefined,
    driverStatus: DriverStatus | null | undefined
): string {
    // Estados terminales
    if (driverStatus === "DELIVERED") return "DELIVERED";
    if (driverStatus === "RETURNED" || merchantStatus === "RETURNED") return "RETURNED";

    // Driver en delivery
    if (driverStatus === "WAITING_FOR_CUSTOMER" || driverStatus === "AT_CUSTOMER") {
        return "IN_DELIVERY";
    }
    if (driverStatus === "ON_ROUTE_TO_CUSTOMER") return "IN_DELIVERY";
    if (driverStatus === "RETURNING_TO_MERCHANT") return "RETURNING";

    // Pickup hecho
    if (merchantStatus === "PICKED_UP") return "PICKED_UP";

    // Driver llegó al comercio pero pedido no listo todavía
    if (driverStatus === "AT_MERCHANT" && merchantStatus !== "READY") return "DRIVER_ARRIVED";
    if (driverStatus === "AT_MERCHANT" && merchantStatus === "READY") return "DRIVER_ARRIVED";

    // Comercio marcó listo, driver no llegó todavía
    if (merchantStatus === "READY") return "READY";

    // Driver asignado, comercio preparando
    if (driverStatus === "ASSIGNED") return "DRIVER_ASSIGNED";

    // Default
    return "PREPARING";
}

/**
 * Convierte el `status` legacy a un par {merchantStatus, driverStatus}.
 * Sirve para back-fill de pedidos viejos o fallback cuando los campos
 * paralelos están null (creación pre-rama).
 */
export function legacyStatusToParallel(legacyStatus: string | null | undefined): {
    merchantStatus: MerchantStatus;
    driverStatus: DriverStatus;
} {
    switch (legacyStatus) {
        case "PENDING":
        case "PREPARING":
            return { merchantStatus: "PREPARING", driverStatus: "ASSIGNED" };
        case "DRIVER_ASSIGNED":
            return { merchantStatus: "PREPARING", driverStatus: "ASSIGNED" };
        case "DRIVER_ARRIVED":
            return { merchantStatus: "PREPARING", driverStatus: "AT_MERCHANT" };
        case "READY":
            return { merchantStatus: "READY", driverStatus: "ASSIGNED" };
        case "PICKED_UP":
            return { merchantStatus: "PICKED_UP", driverStatus: "ON_ROUTE_TO_CUSTOMER" };
        case "IN_DELIVERY":
            return { merchantStatus: "PICKED_UP", driverStatus: "AT_CUSTOMER" };
        case "DELIVERED":
            return { merchantStatus: "PICKED_UP", driverStatus: "DELIVERED" };
        case "RETURNING":
            return { merchantStatus: "PICKED_UP", driverStatus: "RETURNING_TO_MERCHANT" };
        case "RETURNED":
            return { merchantStatus: "RETURNED", driverStatus: "RETURNED" };
        default:
            return { merchantStatus: "PREPARING", driverStatus: "ASSIGNED" };
    }
}

/**
 * Resuelve el merchantStatus efectivo de un Order/SubOrder, usando el campo
 * paralelo si existe, o derivando del legacy si es null (compat retro).
 */
export function getEffectiveMerchantStatus(o: {
    merchantStatus?: string | null;
    status?: string | null;
}): MerchantStatus {
    if (o.merchantStatus) return o.merchantStatus as MerchantStatus;
    return legacyStatusToParallel(o.status).merchantStatus;
}

/**
 * Resuelve el driverStatus efectivo. Igual que arriba pero para el flujo del driver.
 */
export function getEffectiveDriverStatus(o: {
    driverStatus?: string | null;
    status?: string | null;
}): DriverStatus {
    if (o.driverStatus) return o.driverStatus as DriverStatus;
    return legacyStatusToParallel(o.status).driverStatus;
}

/**
 * Conjuntos canonicos de estados para los filtros del dashboard del driver.
 *
 * ACTIVE: pedidos en curso (aparecen en el tab "Activo" / "En curso")
 * HISTORICAL: pedidos terminados (aparecen en "Historial")
 */
export const DRIVER_ACTIVE_STATUSES: DriverStatus[] = [
    "ASSIGNED",
    "AT_MERCHANT",
    "ON_ROUTE_TO_CUSTOMER",
    "AT_CUSTOMER",
    "WAITING_FOR_CUSTOMER",
    "RETURNING_TO_MERCHANT",
];

export const DRIVER_HISTORICAL_STATUSES: DriverStatus[] = [
    "DELIVERED",
    "RETURNED",
];

/**
 * Estados TERMINALES en el sistema legacy (Order.status / SubOrder.status).
 * Un pedido en uno de estos estados NO puede volver a ningún flujo activo.
 *
 * USO RECOMENDADO en queries de listings:
 *   // En lugar de enumerar TODOS los activos (frágil, se olvidan estados nuevos):
 *   //   status: { in: ["PENDING","CONFIRMED","PREPARING",...] }   // ❌
 *   //
 *   // Enumerar los terminales (chico, estable):
 *   status: { notIn: LEGACY_TERMINAL_STATUSES }                    // ✓
 *
 * Cuando se agregue un estado nuevo al flujo (DRIVER_ARRIVED, RETURNING, etc.),
 * cae automáticamente en "activos" sin tocar este array.
 */
export const LEGACY_TERMINAL_STATUSES = [
    "DELIVERED",
    "CANCELLED",
    "REJECTED",
    "UNASSIGNABLE",
    "REFUNDED",
    "EXPIRED",
    "RETURNED",
] as const;

/**
 * Estados ACTIVOS en el sistema legacy, enumerados explícitamente.
 *
 * Sólo usar cuando Prisma requiere `status: { in: [...] }` y `notIn` no es
 * conveniente (ej: cuando se combina con OR de campos paralelos). En la
 * mayoría de los casos preferir `notIn: LEGACY_TERMINAL_STATUSES`.
 *
 * MANTENER SINCRONIZADO con cualquier estado nuevo del flujo.
 */
export const LEGACY_ACTIVE_STATUSES = [
    "PENDING",
    "AWAITING_PAYMENT",
    "PENDING_PAYMENT",
    "SCHEDULED",
    "SCHEDULED_CONFIRMED",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVED",
    "PICKED_UP",
    "IN_DELIVERY",
    "RETURNING",
] as const;
