// Delivery Cost Calculator — Biblia Financiera v3 (MOTOR ÚNICO de envío)
//
// Rama: fix/biblia-motor-envio-y-comisiones
//
// Esta es la ÚNICA fórmula de costo de envío de Moovy. La usan por igual:
//   - El preview del checkout (GET /api/delivery/calculate)
//   - El cobro real al crear el pedido (POST /api/orders)
//   - El simulador del panel OPS
//
// PREVIEW == COBRO: mismo input (categoría/vehículo, distancia, zona, clima,
// subtotal, config de la Biblia) → mismo número. Sin excepción.
//
// ─── FÓRMULA MAESTRA CANÓNICA (CLAUDE.md) ─────────────────────────────────────
//
//   fee_visible = max(MIN_VEHICULO, costo_km × distancia × 2.2) × zona × clima × demanda
//                 + (subtotal × operativo%)
//   costo_viaje = fee_visible − (subtotal × operativo%)   // tripCost SIN operativo
//
// Factor 2.2 = 1.0 ida + 1.0 vuelta + 0.2 espera/maniobras.
// El operativo (5% del subtotal) cubre MP 3.81% + margen y va 100% a Moovy.
// Repartidor cobra riderShare% (80% default) del costo del VIAJE (sin operativo).
//
// ─── DE DÓNDE SALE costo_km Y EL MÍNIMO (decisión de diseño — MODELO B) ───────
//
// El MÍNIMO por vehículo se lee por CATEGORÍA de paquete desde la tabla editable
// `DeliveryRate.basePriceArs` (keyed a `PackageCategory`). La categoría del pedido
// la determina `calculateOrderCategory` (assignment-engine) a partir del tamaño
// real de los items, que mapea 1:1 a vehículo vía `SIZE_METADATA`:
//   MICRO/SMALL → Bici   ·  MEDIUM → Moto  ·  LARGE → Auto  ·  XL → Pickup/Flete
//
// MODELO B (rama fix/biblia-motor-envio-y-comisiones): el costo_km YA NO es un
// valor fijo, se DERIVA del combustible global de la Biblia:
//   costo_km(vehículo) = fuelPricePerLiter × consumptionPerKm × maintenanceFactor
//   - fuelPricePerLiter, maintenanceFactor → globales (StoreSettings). Esto rescata
//     esos campos, que antes eran fantasmas (no afectaban el cobro real).
//   - consumptionPerKm → por vehículo/categoría, editable en DeliveryRate. Se eligió
//     guardarlo en DeliveryRate (no en un JSON) porque ya es la tabla per-vehículo
//     de pricing: una sola fuente, un solo lugar de edición, FK a la categoría.
//   - Seedeado calcado a los costo_km canónicos: con fuel=1591 y maint=1.35, da
//     IDÉNTICO a hoy (Bici $15, Moto $73, Auto $193, etc.).
//   - DEFENSIVO: si falta fuel/maint/consumo, se cae al costo_km canónico
//     (DeliveryRate.pricePerKmArs) para no romper el cálculo.
//
// Los multiplicadores de zona/clima/demanda, operativo%, envío gratis, distancia
// máx y riderShare se leen de la Biblia (StoreSettings). NADA hardcodeado que el
// panel diga controlar.

import { prisma } from "./prisma";

export interface DeliveryRateInput {
    /** costo_km legacy/fallback por categoría (DeliveryRate.pricePerKmArs).
     *  MODELO B: solo se usa si no se puede derivar del combustible. */
    pricePerKmArs: number;
    /** mínimo por categoría / vehículo (DeliveryRate.basePriceArs) */
    minVehicleFee: number;
    /** MODELO B (rama fix/biblia-motor-envio-y-comisiones): consumo del vehículo
     *  (DeliveryRate.consumptionPerKm). costo_km = fuel × consumo × maint. */
    consumptionPerKm?: number | null;
}

export interface DeliverySettings {
    /** Mínimo global de respaldo si la categoría no tiene rate cargado */
    baseDeliveryFee: number;
    /** Monto del pedido para envío gratis (null = no aplica) */
    freeDeliveryMinimum: number | null;
    /** Distancia máxima de delivery en km */
    maxDeliveryDistance: number;
    /** Multiplicador de zona (A=1.0, B=1.15, C=1.35) */
    zoneMultiplier?: number;
    /** Multiplicador de clima (normal=1.0, lluvia=1.15, temporal=1.30) */
    climateMultiplier?: number;
    /** Rama fix/biblia-motor-envio-y-comisiones: multiplicador de SURGE/demanda
     *  (normal=1.0, alta=1.20, pico=1.40). Multiplica el viaje, no el operativo. */
    demandMultiplier?: number;
    /** MODELO B: precio del combustible global de la Biblia (StoreSettings.fuelPricePerLiter) */
    fuelPricePerLiter?: number;
    /** MODELO B: factor de mantenimiento global de la Biblia (StoreSettings.maintenanceFactor) */
    maintenanceFactor?: number;
    /** % operativo sobre el subtotal del pedido (default 5) */
    operationalCostPercent?: number;
    /** Subtotal del pedido (para el operativo). Si no se pasa, usa orderTotal */
    orderSubtotal?: number;
    /** % del costo del viaje que cobra el repartidor (default 80) */
    riderSharePercent?: number;
    /**
     * Rate de la categoría/vehículo del pedido. Si no se pasa, el motor usa
     * baseDeliveryFee como mínimo y un costo_km de respaldo conservador.
     */
    rate?: DeliveryRateInput;
}

export interface DeliveryCostResult {
    distanceKm: number;
    /** Mínimo aplicado para la categoría/vehículo */
    baseCost: number;
    /** costo_km × distancia × 2.2 (antes de mínimo y multiplicadores) */
    distanceComponent: number;
    /** Factor de distancia aplicado (2.2) */
    distanceFactor: number;
    /** Multiplicador de zona aplicado */
    zoneMultiplier: number;
    /** Multiplicador de clima aplicado */
    climateMultiplier: number;
    /** Multiplicador de demanda/surge aplicado (rama fix/biblia-motor-envio-y-comisiones) */
    demandMultiplier: number;
    /** costo_km efectivo usado (MODELO B: derivado de fuel×consumo×maint, o fallback) */
    pricePerKmUsed: number;
    /** ¿Se aplicó el mínimo del vehículo? (el max() ganó) */
    minApplied: boolean;
    /** Costo del viaje (sin operativo) */
    tripCost: number;
    /** Costo operativo (operativo% del subtotal) */
    operationalCost: number;
    /** Total que paga el cliente del envío (tripCost + operativo) */
    totalCost: number;
    isFreeDelivery: boolean;
    isWithinRange: boolean;
    /** Ganancia del repartidor: riderShare% del costo del viaje (sin operativo) */
    riderEarnings: number;
    /** Ganancia Moovy del delivery: (100-riderShare)% del viaje + operativo */
    moovyDeliveryEarnings: number;
}

// Re-export calculateDistance from geo.ts (single source of truth)
export { calculateDistance } from "./geo";

// Factor 2.2 = 1.0 ida + 1.0 vuelta + 0.2 espera/maniobras (canónico CLAUDE.md)
const DISTANCE_FACTOR = 2.2;

// costo_km de respaldo si la categoría no tiene DeliveryRate cargado (conservador:
// el de Moto, vehículo del medio). Solo se usa como defensa — el flujo normal
// SIEMPRE pasa el rate de DeliveryRate.
const FALLBACK_PRICE_PER_KM = 73;

// MODELO B (rama fix/biblia-motor-envio-y-comisiones): defaults canónicos del
// combustible para la derivación del costo_km. Si la Biblia no tiene seteado
// fuel/maint, usamos estos (los de CLAUDE.md) para que los números no se rompan.
const FALLBACK_FUEL_PRICE = 1591;     // nafta super Ushuaia (CLAUDE.md)
const FALLBACK_MAINTENANCE = 1.35;    // factor mantenimiento (CLAUDE.md)

/**
 * Calcula el costo de envío (Biblia Financiera v3 — fórmula maestra canónica).
 *
 * fee = max(MIN_VEHICULO, costo_km × distancia × 2.2) × zona × clima
 *       + (subtotal × operativo%)
 *
 * - costo_km y MIN_VEHICULO vienen de `settings.rate` (DeliveryRate por categoría).
 * - zona, clima, operativo%, riderShare, freeDelivery, maxDistance vienen de la Biblia.
 * - Defensivo: si falta el rate, usa baseDeliveryFee como mínimo y costo_km de respaldo.
 *   Montos NUNCA negativos. Math.round para centavos.
 */
export function calculateDeliveryCost(
    distanceKm: number,
    settings: DeliverySettings,
    orderTotal: number
): DeliveryCostResult {
    const safeDistance = Math.max(0, distanceKm || 0);
    const zoneMult = settings.zoneMultiplier ?? 1.0;
    const climateMult = settings.climateMultiplier ?? 1.0;
    // Rama fix/biblia-motor-envio-y-comisiones: SURGE / demanda (espejo de clima).
    const demandMult = settings.demandMultiplier ?? 1.0;
    const opPercent = settings.operationalCostPercent ?? 5;
    const riderShare = settings.riderSharePercent ?? 80;
    const opSubtotal = settings.orderSubtotal ?? orderTotal;

    // MODELO B (rama fix/biblia-motor-envio-y-comisiones): el costo_km se DERIVA
    // del combustible global de la Biblia × consumo del vehículo × mantenimiento.
    //   costo_km = fuelPricePerLiter × consumptionPerKm × maintenanceFactor
    // Si sube la nafta, todos los vehículos se reajustan solos. DEFENSIVO: si
    // falta el consumo del vehículo, caemos al costo_km canónico de DeliveryRate
    // (pricePerKmArs); si falta ese también, al FALLBACK conservador (Moto).
    const fuelPrice = settings.fuelPricePerLiter && settings.fuelPricePerLiter > 0
        ? settings.fuelPricePerLiter
        : FALLBACK_FUEL_PRICE;
    const maintFactor = settings.maintenanceFactor && settings.maintenanceFactor > 0
        ? settings.maintenanceFactor
        : FALLBACK_MAINTENANCE;
    const consumption = settings.rate?.consumptionPerKm;

    let pricePerKm: number;
    if (consumption != null && consumption > 0) {
        // Camino normal MODELO B: derivado del combustible.
        pricePerKm = fuelPrice * consumption * maintFactor;
    } else {
        // Defensivo: sin consumo cargado, usamos el costo_km canónico de la tabla
        // (o el fallback conservador si tampoco hay rate).
        pricePerKm = settings.rate?.pricePerKmArs ?? FALLBACK_PRICE_PER_KM;
    }
    // costo_km nunca negativo; redondeo a centavos para trazabilidad.
    pricePerKm = Math.max(0, Math.round(pricePerKm * 100) / 100);

    // mínimo: del rate de la categoría, con respaldo conservador.
    const minVehicleFee = settings.rate?.minVehicleFee ?? settings.baseDeliveryFee;

    const isWithinRange = settings.maxDeliveryDistance > 0
        ? safeDistance <= settings.maxDeliveryDistance
        : true;

    // Operativo SIEMPRE se calcula (incluso en envío gratis Moovy no regala el costo MP).
    const operationalCost = Math.max(0, Math.round(opSubtotal * (opPercent / 100)));

    // Envío gratis del comercio: el cliente NO paga el viaje, pero sí el operativo.
    const isFreeDelivery = settings.freeDeliveryMinimum !== null &&
        settings.freeDeliveryMinimum > 0 &&
        orderTotal >= settings.freeDeliveryMinimum;

    if (isFreeDelivery) {
        return {
            distanceKm: safeDistance,
            baseCost: minVehicleFee,
            distanceComponent: 0,
            distanceFactor: DISTANCE_FACTOR,
            zoneMultiplier: zoneMult,
            climateMultiplier: climateMult,
            demandMultiplier: demandMult,
            pricePerKmUsed: pricePerKm,
            minApplied: false,
            tripCost: 0,
            operationalCost,
            totalCost: operationalCost,
            isFreeDelivery: true,
            isWithinRange,
            riderEarnings: 0,
            // Sin viaje, Moovy solo retiene el operativo.
            moovyDeliveryEarnings: operationalCost,
        };
    }

    // costo_km × distancia × 2.2
    const distanceComponent = pricePerKm * safeDistance * DISTANCE_FACTOR;

    // max(MIN_VEHICULO, distanceComponent)
    const minApplied = minVehicleFee >= distanceComponent;
    const beforeMultipliers = Math.max(minVehicleFee, distanceComponent);

    // × zona × clima × demanda (surge). El surge multiplica el VIAJE, no el operativo.
    let tripCost = beforeMultipliers * zoneMult * climateMult * demandMult;
    tripCost = Math.max(0, Math.round(tripCost));

    // Total = costo del viaje + operativo
    const totalCost = tripCost + operationalCost;

    // Repartidor: riderShare% del costo del viaje (sin operativo).
    const riderEarnings = Math.max(0, Math.round(tripCost * (riderShare / 100)));
    // Moovy: resto del viaje + 100% del operativo.
    const moovyDeliveryEarnings = Math.max(0, (tripCost - riderEarnings) + operationalCost);

    return {
        distanceKm: safeDistance,
        baseCost: minVehicleFee,
        distanceComponent: Math.round(distanceComponent),
        distanceFactor: DISTANCE_FACTOR,
        zoneMultiplier: zoneMult,
        climateMultiplier: climateMult,
        demandMultiplier: demandMult,
        pricePerKmUsed: pricePerKm,
        minApplied,
        tripCost,
        operationalCost,
        totalCost,
        isFreeDelivery: false,
        isWithinRange,
        riderEarnings,
        moovyDeliveryEarnings,
    };
}

// ─── Loader del rate por categoría (cache simple en proceso) ──────────────────
// El cobro y el preview leen DeliveryRate por categoría. Cacheamos en memoria
// con TTL corto para no pegarle a la DB en cada cálculo (los rates cambian poco
// y el panel los edita ocasionalmente). Fallback conservador si falta data.

interface RateCacheEntry { rate: DeliveryRateInput; at: number }
const rateCache = new Map<string, RateCacheEntry>();
const RATE_CACHE_TTL_MS = 60_000; // 1 min

/**
 * Devuelve el rate (costo_km + mínimo) para una categoría de paquete (MICRO..XL),
 * leyendo de DeliveryRate. Cache 1 min. Si no existe rate activo, devuelve
 * undefined y el caller debe usar el fallback de `calculateDeliveryCost`.
 */
export async function getDeliveryRateForCategory(
    packageCategory: string
): Promise<DeliveryRateInput | undefined> {
    const key = (packageCategory || "MEDIUM").toUpperCase();
    const cached = rateCache.get(key);
    if (cached && Date.now() - cached.at < RATE_CACHE_TTL_MS) {
        return cached.rate;
    }

    try {
        const dr = await prisma.deliveryRate.findFirst({
            where: { isActive: true, category: { name: key } },
            // Rama fix/biblia-motor-envio-y-comisiones (MODELO B): traemos también
            // consumptionPerKm para derivar el costo_km del combustible.
            select: { basePriceArs: true, pricePerKmArs: true, consumptionPerKm: true },
        });
        if (dr) {
            const rate: DeliveryRateInput = {
                pricePerKmArs: dr.pricePerKmArs,
                minVehicleFee: dr.basePriceArs,
                consumptionPerKm: dr.consumptionPerKm,
            };
            rateCache.set(key, { rate, at: Date.now() });
            return rate;
        }
    } catch {
        // Defensivo: si falla la query, dejamos que el motor use su fallback.
    }
    return undefined;
}

/** Invalida el cache de rates (llamar tras editar DeliveryRate en el panel). */
export function invalidateDeliveryRateCache(): void {
    rateCache.clear();
}

// ─── Orquestador único: preview == cobro ─────────────────────────────────────
// Tanto el preview (/api/delivery/calculate) como el cobro (/api/orders) llaman
// a ESTA función con los mismos inputs → mismo número garantizado. Es el único
// punto donde se arma DeliverySettings desde la Biblia y se aplica la fórmula.

export interface ComputeDeliveryFeeInput {
    distanceKm: number;
    /** Categoría del pedido (MICRO..XL) — determina costo_km y mínimo (vehículo) */
    packageCategory: string;
    /** Subtotal del pedido (base del operativo y del envío gratis) */
    orderSubtotal: number;
    isPickup?: boolean;
    /** Config de la Biblia (StoreSettings) ya leída por el caller */
    biblia: {
        freeDeliveryMinimum: number | null;
        maxDeliveryDistance: number;
        operationalCostPercent: number;
        riderSharePercent: number;
        baseDeliveryFee: number;
        // MODELO B (rama fix/biblia-motor-envio-y-comisiones): globales del
        // combustible para derivar costo_km. Opcionales → defensivo si faltan.
        fuelPricePerLiter?: number;
        maintenanceFactor?: number;
    };
    /** Multiplicador de zona ya resuelto (PostGIS DeliveryZone). Default 1.0 */
    zoneMultiplier?: number;
    /** Multiplicador de clima ya resuelto desde la Biblia. Default 1.0 */
    climateMultiplier?: number;
    /** Multiplicador de demanda/surge ya resuelto desde la Biblia. Default 1.0
     *  (rama fix/biblia-motor-envio-y-comisiones) */
    demandMultiplier?: number;
}

/**
 * Calcula el costo de envío leyendo el rate de la categoría desde DeliveryRate
 * y aplicando la fórmula maestra. Punto de entrada compartido preview/cobro.
 *
 * Pickup → costo 0. Defensivo ante config faltante (default conservador).
 */
export async function computeDeliveryFee(
    input: ComputeDeliveryFeeInput
): Promise<DeliveryCostResult> {
    if (input.isPickup) {
        return {
            distanceKm: 0,
            baseCost: 0,
            distanceComponent: 0,
            distanceFactor: DISTANCE_FACTOR,
            zoneMultiplier: 1.0,
            climateMultiplier: 1.0,
            demandMultiplier: 1.0,
            pricePerKmUsed: 0,
            minApplied: false,
            tripCost: 0,
            operationalCost: 0,
            totalCost: 0,
            isFreeDelivery: false,
            isWithinRange: true,
            riderEarnings: 0,
            moovyDeliveryEarnings: 0,
        };
    }

    const rate = await getDeliveryRateForCategory(input.packageCategory);

    return calculateDeliveryCost(
        input.distanceKm,
        {
            baseDeliveryFee: input.biblia.baseDeliveryFee,
            freeDeliveryMinimum: input.biblia.freeDeliveryMinimum,
            maxDeliveryDistance: input.biblia.maxDeliveryDistance,
            operationalCostPercent: input.biblia.operationalCostPercent,
            riderSharePercent: input.biblia.riderSharePercent,
            // MODELO B: globales del combustible para derivar costo_km.
            fuelPricePerLiter: input.biblia.fuelPricePerLiter,
            maintenanceFactor: input.biblia.maintenanceFactor,
            orderSubtotal: input.orderSubtotal,
            zoneMultiplier: input.zoneMultiplier ?? 1.0,
            climateMultiplier: input.climateMultiplier ?? 1.0,
            // Rama fix/biblia-motor-envio-y-comisiones: surge/demanda.
            demandMultiplier: input.demandMultiplier ?? 1.0,
            rate,
        },
        input.orderSubtotal
    );
}

/**
 * Format price in Argentine Pesos
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}
