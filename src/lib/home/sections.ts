// ─── Home Builder — registry de secciones MOVIBLES del home ─────────────────
//
// Fuente de verdad de las keys VÁLIDAS + su label / descripción / orden por
// defecto. Este archivo NO importa React ni Prisma: se usa desde el server
// component de la home, desde la API de OPS y desde el script de verificación.
//
// El RENDER real de cada sección vive en `src/app/(store)/page.tsx` (necesita la
// data ya fetcheada del server component). Acá solo declaramos qué secciones
// existen y cómo se llaman.
//
// Hero + "Abiertos ahora" (arriba) y CTAs + Footer (abajo) NO están acá: son
// FIJOS y no se pueden mover ni ocultar (decisión de producto).
//
// El `enabled` que se guarda por sección en la tabla HomeSection es un candado
// ADICIONAL: cada sección conserva su propio guard de "hay datos" en el render
// (ej: Promos del Mundial solo si hay cupones vigentes), así que nada aparece
// vacío aunque una sección esté enabled.

export interface HomeSectionDef {
    key: string;
    label: string;
    description: string;
    defaultOrder: number;
}

/** Secciones movibles del home, en su orden por defecto (el de hoy). */
export const HOME_SECTIONS: HomeSectionDef[] = [
    { key: "promo-banner", label: "Banner promocional", description: "Carrusel de banners configurable desde OPS.", defaultOrder: 10 },
    { key: "promos-mundial", label: "Promos del Mundial", description: "Vitrina de cupones activos y vigentes.", defaultOrder: 20 },
    { key: "lo-mas-pedido", label: "Lo más pedido", description: "Grilla de productos destacados.", defaultOrder: 30 },
    { key: "banda-moover", label: "Banda MOOVER", description: "Invitación a crear cuenta (solo visitantes sin sesión).", defaultOrder: 40 },
    { key: "explora-mapa", label: "Explorá Ushuaia", description: "Mapa interactivo de comercios.", defaultOrder: 50 },
    { key: "nuevos", label: "Nuevos en MOOVY", description: "Comercios que se sumaron hace poco.", defaultOrder: 60 },
    { key: "marketplace", label: "Marketplace", description: "Vitrina de publicaciones del marketplace.", defaultOrder: 70 },
    { key: "hero-carousel", label: "Carrusel de banners (hero)", description: "Slides grandes configurables desde OPS.", defaultOrder: 80 },
    { key: "discovery-mas-pedidos", label: "Los más pedidos", description: "Fila de comercios con más pedidos.", defaultOrder: 90 },
    { key: "discovery-mejor-calificados", label: "Mejor calificados", description: "Fila de comercios mejor puntuados.", defaultOrder: 100 },
];

/** Solo las keys, para validaciones rápidas. */
export const HOME_SECTION_KEYS: string[] = HOME_SECTIONS.map((s) => s.key);

/** Mapa key → definición, para lookups O(1). */
export const HOME_SECTION_BY_KEY: Record<string, HomeSectionDef> = Object.fromEntries(
    HOME_SECTIONS.map((s) => [s.key, s])
);

export function isValidHomeSectionKey(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(HOME_SECTION_BY_KEY, key);
}

/**
 * Dada la lista de filas persistidas (key → {order, enabled}), devuelve el LAYOUT
 * efectivo del home: la lista de keys movibles en orden, con su estado enabled.
 *
 * - Tolera tabla vacía (usa el orden por defecto del registry, todo enabled).
 * - Tolera keys nuevas del registry que todavía no están en DB (aparecen con su
 *   default, enabled).
 * - Ignora keys en DB que ya no existen en el registry (huérfanas).
 *
 * Es una función PURA (no toca DB) — el server component le pasa lo que leyó.
 */
export function resolveHomeLayout(
    persisted: Array<{ key: string; order: number; enabled: boolean }>
): Array<{ key: string; enabled: boolean }> {
    const byKey = new Map(persisted.map((r) => [r.key, r]));
    return HOME_SECTIONS.map((def) => {
        const row = byKey.get(def.key);
        return {
            key: def.key,
            order: row?.order ?? def.defaultOrder,
            enabled: row?.enabled ?? true,
        };
    })
        .sort((a, b) => a.order - b.order)
        .map(({ key, enabled }) => ({ key, enabled }));
}
