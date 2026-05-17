// feat/feature-flags-ops (2026-05-13): helper canonico para leer feature flags.
//
// FILOSOFIA:
// - Los flags son toggles de la tabla FeatureFlag (ver prisma/schema.prisma).
// - El admin los togglea desde /ops/feature-flags sin redeploy.
// - El codigo de la app consulta isFeatureEnabled(key) en server components,
//   route handlers, y middleware. Para client components hay un hook aparte.
// - Cache in-memory de 30s para no quemar queries en cada request. Stale
//   tolerable porque cambios de flag son raros (admin toca un toggle y
//   espera resultados; 30s de delay es aceptable).
//
// CONVENCION DE KEYS:
//   scope.feature  → ej: "merchant.publicidad", "buyer.marketplace"
//
// IMPORTANTE:
// - NUNCA renombrar una key una vez deployada. Si quisieras renombrar,
//   crear flag nuevo y migrar. Como las keys viven en codigo (acá y en
//   integraciones) y en DB (rows), un rename rompe la consistencia.
// - Defaults conservadores: si el flag NO existe en DB o falla la query,
//   devolvemos `false`. Mejor mostrar una UI mas pobre que mostrar una
//   feature rota.

import { prisma } from "@/lib/prisma";

// ─── Keys canonicas (single source of truth) ────────────────────────────────
//
// Todos los lugares que consumen flags deben importar las keys de aca.
// NO hardcodear strings sueltos en el codigo — usar las constantes para
// que renombrar/refactorizar sea seguro.
export const FEATURE_FLAGS = {
    // Scope MERCHANT — afecta el panel/menu del comercio
    MERCHANT_PUBLICIDAD: "merchant.publicidad",
    MERCHANT_PAQUETES: "merchant.paquetes",
    MERCHANT_TRACKING_EN_VIVO: "merchant.tracking-en-vivo",

    // Scope SELLER — afecta el panel/menu del vendedor marketplace
    SELLER_PAQUETES: "seller.paquetes",

    // Scope BUYER — afecta el panel/menu del comprador (tienda)
    BUYER_MARKETPLACE: "buyer.marketplace",
    BUYER_SCHEDULED_DELIVERY: "buyer.scheduled-delivery",
    BUYER_CASH_PAYMENT: "buyer.cash-payment",
    BUYER_PUNTOS_MOOVER: "buyer.puntos-moover",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

// ─── Cache in-memory ────────────────────────────────────────────────────────
//
// Map de key → { isActive, expiresAt }. expiresAt es timestamp para
// invalidacion automatica. Se popula lazily en isFeatureEnabled().
// Cuando el admin togglea un flag (PATCH endpoint), invalidamos toda la cache
// llamando clearFeatureFlagCache() para no servir stale.

interface CacheEntry {
    isActive: boolean;
    expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const cache: Map<string, CacheEntry> = new Map();

/**
 * Lee un feature flag desde la DB (con cache 30s). Devuelve `false` si el
 * flag no existe o si la query falla — defaults conservadores.
 */
export async function isFeatureEnabled(key: FeatureFlagKey | string): Promise<boolean> {
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
        return cached.isActive;
    }

    try {
        const flag = await prisma.featureFlag.findUnique({
            where: { key },
            select: { isActive: true },
        });
        const isActive = flag?.isActive ?? false;
        cache.set(key, { isActive, expiresAt: now + CACHE_TTL_MS });
        return isActive;
    } catch (err) {
        // Si la query falla (DB caida, schema desactualizado, etc.) NO crasheamos
        // el render. Devolvemos false para que la UI esconda la feature, lo cual
        // es el comportamiento mas seguro (Better safe than sorry).
        console.error("[feature-flags] error leyendo flag", key, err);
        return false;
    }
}

/**
 * Lee multiples flags en paralelo. Util cuando una pagina necesita 3-4 flags
 * para condicionar varios renders — hace 1 sola query en vez de 4.
 */
export async function getFeatureFlags<K extends string>(
    keys: K[]
): Promise<Record<K, boolean>> {
    const now = Date.now();

    // Cache hits primero
    const result: Record<string, boolean> = {};
    const missing: K[] = [];
    for (const k of keys) {
        const cached = cache.get(k);
        if (cached && cached.expiresAt > now) {
            result[k] = cached.isActive;
        } else {
            missing.push(k);
        }
    }

    if (missing.length === 0) return result as Record<K, boolean>;

    try {
        const flags = await prisma.featureFlag.findMany({
            where: { key: { in: missing } },
            select: { key: true, isActive: true },
        });
        const byKey = new Map(flags.map((f) => [f.key, f.isActive]));
        for (const k of missing) {
            const isActive = byKey.get(k) ?? false;
            cache.set(k, { isActive, expiresAt: now + CACHE_TTL_MS });
            result[k] = isActive;
        }
    } catch (err) {
        console.error("[feature-flags] error leyendo flags", missing, err);
        for (const k of missing) result[k] = false;
    }

    return result as Record<K, boolean>;
}

/**
 * Invalida toda la cache. Se llama desde el endpoint admin de toggle para
 * que el cambio sea visible en el proximo request (no esperar 30s).
 */
export function clearFeatureFlagCache(): void {
    cache.clear();
}
