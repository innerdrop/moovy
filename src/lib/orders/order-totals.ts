// Order Totals — Snapshot financiero por SubOrder
// Rama: refactor/separar-motor-y-finanzas
//
// PROPÓSITO
// ─────────
// Centraliza el cálculo de los 5 campos financieros que se persisten en
// SubOrder al crear una orden:
//
//   tripCost                 — costo del viaje sin operativo (Motor Logístico)
//   operationalCost          — 5% del subtotal (Reparto Financiero)
//   driverPayoutAmount       — 80% × tripCost (Reparto Financiero)
//   merchantCommissionRate   — % aplicado al cerrar (snapshot)
//   merchantCommissionSource — origen del rate (audit trail)
//
// Esta función NO recalcula. Es un agregador puro que toma inputs ya validados
// del endpoint de creación de orden y devuelve el snapshot inmutable a persistir.
//
// FILOSOFÍA
// ─────────
// Mantener el flujo actual del endpoint (calculateShippingCost + getEffectiveCommission)
// y enchufar este helper SOLO al final, antes del prisma.subOrder.create. No es un
// reemplazo del flujo, es un consolidador. El refactor mayor del orquestador
// completo (computeOrderTotals que reemplaza ambos calculadores) queda para mes 1
// post-launch cuando se unifiquen `delivery.ts` y `shipping-cost-calculator.ts`.
//
// REGLAS CANÓNICAS APLICADAS
// ──────────────────────────
// - Defaults conservadores (regla #15): si falta data crítica, prefiere undefined
//   y deja que el caller decida si bloquea o sigue (NO inventes valores).
// - Persistir, no recalcular (decisión #2 de la rama): los valores van a la DB
//   y NUNCA se recalculan retroactivamente para no romper cierres fiscales.
// - Repartidor 80% del costo del viaje SIN operativo (Biblia Financiera v3).

import { getEffectiveCommissionWithSource, type CommissionSource } from "@/lib/merchant-loyalty";

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface SubOrderFinancialSnapshotInput {
    /** Subtotal del SubOrder (ya calculado por el endpoint) */
    subtotal: number;
    /** Delivery fee total del SubOrder (incluye operativo si se cobra) */
    deliveryFee: number;
    /**
     * Costo operativo del SubOrder (5% del subtotal por default).
     * Si el endpoint no lo calculó separado, podemos derivarlo del operationalCostPercent.
     */
    operationalCost: number;
    /** Si es un SubOrder de comercio, su id; sino null */
    merchantId: string | null;
    /** Si es un SubOrder de seller marketplace, su id; sino null */
    sellerId: string | null;
    /**
     * Rate del seller cuando aplica (default 12). Solo se usa si sellerId != null.
     * El comercio usa getEffectiveCommissionWithSource(merchantId) internamente.
     */
    sellerCommissionRate?: number;
    /**
     * Rate y source del merchant ya calculados aguas arriba. Si vienen, el helper
     * los usa directo; sino consulta getEffectiveCommissionWithSource. Esto evita
     * queries duplicadas cuando el endpoint ya hizo el cálculo (ej: orders POST
     * que ya llama getEffectiveCommissionWithSource para calcular moovyCommission).
     */
    precomputedMerchantRate?: number;
    precomputedMerchantSource?: CommissionSource;
    /**
     * Porcentaje del costo del viaje que va al driver. Default 80 (Biblia v3).
     * Lo dejamos parametrizado para que panel OPS pueda editarlo en el futuro
     * (regla canónica #10 — todo parámetro editable post-launch).
     */
    riderSharePercent?: number;
    /**
     * Snapshot de zona de delivery aplicado al pedido (rama
     * feat/zonas-delivery-multiplicador). Se calcula aguas arriba con
     * getZoneSnapshotForLocation(destLat, destLng) y se persiste en SubOrder.
     *
     * El driverBonus se SUMA al driverPayoutAmount (Biblia v3: zona B +$150,
     * zona C +$350). Si la dirección no cae en ninguna zona, default
     * { zoneCode: null, zoneMultiplier: 1.0, zoneDriverBonus: 0 } y el helper
     * actúa como si no hubiera zona configurada.
     */
    zoneSnapshot?: {
        zoneCode: string | null;
        zoneMultiplier: number;
        zoneDriverBonus: number;
    };
}

export interface SubOrderFinancialSnapshot {
    tripCost: number;
    operationalCost: number;
    driverPayoutAmount: number;
    merchantCommissionRate: number | null;
    merchantCommissionSource: CommissionSource | null;
    zoneCode: string | null;
    zoneMultiplier: number;
    zoneDriverBonus: number;
}

// ─── Cálculo principal ──────────────────────────────────────────────────────

/**
 * Devuelve el snapshot de los 5 campos financieros para persistir en SubOrder.
 *
 * Esta función reemplaza la dispersión actual de cálculos a lo largo de
 * /api/orders POST y centraliza la fuente de verdad. Si en el futuro la Biblia
 * cambia (ej: rider share pasa de 80% a 75%), se modifica acá y nada más.
 *
 * NO depende de `calculateShippingCost` ni `delivery.ts` — recibe los números
 * ya calculados como inputs. Esto evita acoplarse a los dos calculadores que
 * coexisten hoy (delivery.ts + shipping-cost-calculator.ts).
 */
export async function buildSubOrderFinancialSnapshot(
    input: SubOrderFinancialSnapshotInput
): Promise<SubOrderFinancialSnapshot> {
    const {
        deliveryFee,
        operationalCost,
        merchantId,
        sellerId,
        sellerCommissionRate = 12,
        riderSharePercent = 80,
        precomputedMerchantRate,
        precomputedMerchantSource,
        zoneSnapshot,
    } = input;

    // ── Motor Logístico ─────────────────────────────────────────────────────
    // tripCost = lo que paga el cliente del envío MENOS lo operativo (que va a Moovy).
    // Defensivo: si por algún error operationalCost > deliveryFee, tripCost = 0
    // (no permitir tripCost negativo nunca).
    const tripCost = Math.max(0, deliveryFee - operationalCost);

    // ── Reparto Financiero — Driver ─────────────────────────────────────────
    // Repartidor cobra riderSharePercent% del costo del viaje SIN operativo +
    // bonus de zona si aplica (Biblia v3: zona B +$150, zona C +$350).
    // Math.round para evitar centavos fraccionarios (regla PAGOS).
    const zoneCode = zoneSnapshot?.zoneCode ?? null;
    const zoneMultiplier = zoneSnapshot?.zoneMultiplier ?? 1.0;
    const zoneDriverBonus = zoneSnapshot?.zoneDriverBonus ?? 0;
    const driverPayoutAmount = Math.round(tripCost * (riderSharePercent / 100)) + zoneDriverBonus;

    // ── Reparto Financiero — Merchant / Seller ──────────────────────────────
    // Solo merchant pasa por la cascada de getEffectiveCommissionWithSource
    // (override > first-month > tier > fallback). Seller usa el rate del Biblia
    // configurado en StoreSettings (12% por default desde día 1).
    let merchantCommissionRate: number | null = null;
    let merchantCommissionSource: CommissionSource | null = null;

    if (merchantId) {
        // Si el caller ya calculó el rate aguas arriba (orders/route.ts), reusamos
        // para evitar query duplicada. Sino, consulta canónica.
        if (precomputedMerchantRate !== undefined && precomputedMerchantSource !== undefined) {
            merchantCommissionRate = precomputedMerchantRate;
            merchantCommissionSource = precomputedMerchantSource;
        } else {
            const effective = await getEffectiveCommissionWithSource(merchantId);
            merchantCommissionRate = effective.rate;
            merchantCommissionSource = effective.source;
        }
    } else if (sellerId) {
        // Sellers no tienen tier ni first-month-free — rate plano desde StoreSettings.
        // El source queda como "FALLBACK" para distinguir del flujo merchant en audit.
        merchantCommissionRate = sellerCommissionRate;
        merchantCommissionSource = "FALLBACK";
    }

    return {
        tripCost,
        operationalCost,
        driverPayoutAmount,
        merchantCommissionRate,
        merchantCommissionSource,
        zoneCode,
        zoneMultiplier,
        zoneDriverBonus,
    };
}
