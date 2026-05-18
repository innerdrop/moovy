"use client";

// feat/feature-flags-ops (2026-05-13): hook cliente para leer feature flags
// desde client components. Fetcha /api/features/list una vez al montar y
// cachea en module-level Map para que multiples componentes en la misma
// pagina no hagan requests duplicados.
//
// Uso:
//   const { flag } = useFeatureFlag("merchant.publicidad");
//   if (!flag) return null; // ocultar la feature
//
//   const { flags, loading } = useFeatureFlags(["merchant.publicidad", "merchant.paquetes"]);
//   // flags["merchant.publicidad"] -> boolean
//
// IMPORTANTE: para no parpadear (flash de contenido visible que luego
// desaparece cuando carga el flag), los componentes que consumen estos
// hooks deben renderizar con `loading === false` como gate o usar el
// default mas seguro (false) durante loading.

import { useEffect, useState } from "react";

const TTL_MS = 30_000;

interface CacheEntry {
    flags: Record<string, boolean>;
    expiresAt: number;
}

let cache: CacheEntry | null = null;
let inflightFetch: Promise<Record<string, boolean>> | null = null;
const subscribers: Set<(flags: Record<string, boolean>) => void> = new Set();

async function fetchAllFlags(): Promise<Record<string, boolean>> {
    if (cache && cache.expiresAt > Date.now()) {
        return cache.flags;
    }
    if (inflightFetch) {
        return inflightFetch;
    }
    inflightFetch = (async () => {
        try {
            const res = await fetch("/api/features/list");
            const data = await res.json();
            const flags: Record<string, boolean> = data.flags || {};
            cache = { flags, expiresAt: Date.now() + TTL_MS };
            // Notificar a subscribers vivos.
            subscribers.forEach((cb) => cb(flags));
            return flags;
        } catch {
            // Fallback: devolvemos vacio (todos los flags consultados van a
            // resolver a false). El componente esconde la feature.
            const empty = {};
            if (!cache) cache = { flags: empty, expiresAt: Date.now() + TTL_MS };
            return cache.flags;
        } finally {
            inflightFetch = null;
        }
    })();
    return inflightFetch;
}

/**
 * Hook para leer un solo flag.
 *
 * @returns { flag, loading }
 *   - flag: boolean. Default false durante loading o si el flag no existe.
 *   - loading: true hasta que termina el primer fetch.
 */
export function useFeatureFlag(key: string): { flag: boolean; loading: boolean } {
    const [flag, setFlag] = useState<boolean>(() => cache?.flags[key] ?? false);
    const [loading, setLoading] = useState<boolean>(!cache);

    useEffect(() => {
        let cancelled = false;

        fetchAllFlags().then((flags) => {
            if (cancelled) return;
            setFlag(flags[key] ?? false);
            setLoading(false);
        });

        // Subscribe para que si otro componente refrescha la cache, este
        // tambien se actualice.
        const onUpdate = (flags: Record<string, boolean>) => {
            if (cancelled) return;
            setFlag(flags[key] ?? false);
        };
        subscribers.add(onUpdate);

        return () => {
            cancelled = true;
            subscribers.delete(onUpdate);
        };
    }, [key]);

    return { flag, loading };
}

/**
 * Hook para leer multiples flags. Util en componentes que condicionan varios
 * items (ej: un menu con 4 items y 2 flags).
 *
 * @returns { flags, loading }
 *   - flags: Record<string, boolean>. Devuelve false para keys no encontradas.
 *   - loading: true hasta que termina el primer fetch.
 */
export function useFeatureFlags<K extends string>(keys: K[]): {
    flags: Record<K, boolean>;
    loading: boolean;
} {
    const [flags, setFlags] = useState<Record<K, boolean>>(() => {
        const result = {} as Record<K, boolean>;
        for (const k of keys) result[k] = cache?.flags[k] ?? false;
        return result;
    });
    const [loading, setLoading] = useState<boolean>(!cache);

    // Estabilizar el array por valor para que el effect no se dispare en cada render.
    const keysSerialized = keys.join(",");

    useEffect(() => {
        let cancelled = false;
        const ks = keysSerialized.split(",") as K[];

        fetchAllFlags().then((allFlags) => {
            if (cancelled) return;
            const result = {} as Record<K, boolean>;
            for (const k of ks) result[k] = allFlags[k] ?? false;
            setFlags(result);
            setLoading(false);
        });

        const onUpdate = (allFlags: Record<string, boolean>) => {
            if (cancelled) return;
            const result = {} as Record<K, boolean>;
            for (const k of ks) result[k] = allFlags[k] ?? false;
            setFlags(result);
        };
        subscribers.add(onUpdate);

        return () => {
            cancelled = true;
            subscribers.delete(onUpdate);
        };
    }, [keysSerialized]);

    return { flags, loading };
}

/**
 * Fuerza re-fetch de los flags (invalida cache). Para usar despues de toggle
 * desde el panel OPS si quisieramos propagar al cliente sin esperar 30s.
 * No se llama desde la app de produccion normal — solo desde OPS si quisieramos.
 */
export function invalidateFeatureFlagsCache(): void {
    cache = null;
}
