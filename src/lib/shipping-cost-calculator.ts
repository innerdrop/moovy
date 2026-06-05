/**
 * Shipping Cost — Tarifas por categoría (LEGACY shrink).
 *
 * Rama fix/biblia-motor-envio-y-comisiones:
 * ─────────────────────────────────────────
 * Este archivo tenía un SEGUNDO motor de envío (`calculateShippingCost`) por
 * categoría con tarifas hardcodeadas, que era el que REALMENTE cobraba — en
 * conflicto con la fórmula maestra canónica de `delivery.ts`. Ese motor se
 * ELIMINÓ junto con `validateDeliveryFee` y `calculateDriverEarnings`.
 *
 * MOTOR ÚNICO de envío ahora: `calculateDeliveryCost` / `computeDeliveryFee` en
 * `src/lib/delivery.ts`, que lee costo_km + mínimo por categoría desde la tabla
 * editable `DeliveryRate` y los multiplicadores de la Biblia (StoreSettings).
 * Lo usan por igual el preview (/api/delivery/calculate) y el cobro (/api/orders).
 *
 * Se conserva SOLO `DEFAULT_DELIVERY_RATES` porque `logistics-config.ts` lo usa
 * como fallback del panel `/ops/config/shipping-defaults` (MoovyConfig
 * `shipping_cost_defaults`).
 *
 * TODO (panel): el panel `/ops/config/shipping-defaults` escribe a MoovyConfig
 * pero el motor de cobro lee de `DeliveryRate`. Unificar: el panel debería editar
 * `DeliveryRate` directamente (o leer de ahí), para que no haya dos lugares con
 * las tarifas por categoría. Hasta entonces, la FUENTE DE VERDAD del cobro es
 * `DeliveryRate` (seedeada con los valores canónicos de CLAUDE.md por vehículo).
 */

// ─── Tarifas por PackageCategory (fallback del panel logístico) ────────────────

/**
 * Tarifas base por categoría de paquete. Solo fallback de configuración del panel
 * `/ops/config/shipping-defaults`. NO es lo que cobra el motor de envío (eso sale
 * de `DeliveryRate` vía `delivery.ts`).
 */
export const DEFAULT_DELIVERY_RATES: Record<string, { basePriceArs: number; pricePerKmArs: number }> = {
  MICRO:    { basePriceArs: 400, pricePerKmArs: 150 },
  SMALL:    { basePriceArs: 500, pricePerKmArs: 200 },
  MEDIUM:   { basePriceArs: 600, pricePerKmArs: 250 },
  LARGE:    { basePriceArs: 800, pricePerKmArs: 350 },
  XL:       { basePriceArs: 1200, pricePerKmArs: 500 },
};
