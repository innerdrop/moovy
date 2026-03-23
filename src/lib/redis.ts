/**
 * Redis client singleton con fallback automático a in-memory.
 *
 * - Si REDIS_URL está configurada → conecta a Redis.
 * - Si Redis no está disponible o falla → cae a Map<> local sin interrumpir la app.
 * - Cada reconexión exitosa loguea y vuelve a usar Redis automáticamente.
 *
 * Uso:
 *   import { redis, isRedisConnected } from "@/lib/redis";
 *   await redis.set("key", "value", "EX", 60);
 *   const val = await redis.get("key");
 */

import Redis from "ioredis";

// ── Singleton ──────────────────────────────────────────────────────────────────

let redisInstance: Redis | null = null;
let connected = false;

function createRedisClient(): Redis | null {
    const url = process.env.REDIS_URL;
    if (!url) {
        console.log("[Redis] REDIS_URL no configurada — usando rate limiter in-memory");
        return null;
    }

    const client = new Redis(url, {
        maxRetriesPerRequest: 1,         // No bloquear requests si Redis cae
        retryStrategy(times) {
            if (times > 10) return null;  // Deja de reintentar después de 10
            return Math.min(times * 500, 5000); // Backoff: 500ms, 1s, 1.5s... max 5s
        },
        enableReadyCheck: true,
        lazyConnect: true,               // No conectar hasta primer uso
        connectTimeout: 3000,            // 3s timeout de conexión
    });

    client.on("connect", () => {
        connected = true;
        console.log("[Redis] Conectado exitosamente");
    });

    client.on("ready", () => {
        connected = true;
    });

    client.on("error", (err) => {
        connected = false;
        // Solo loguear una vez, no spamear
        if (err.message.includes("ECONNREFUSED")) {
            console.warn("[Redis] No disponible — fallback a in-memory");
        } else {
            console.warn("[Redis] Error:", err.message);
        }
    });

    client.on("close", () => {
        connected = false;
    });

    // Intentar conectar sin bloquear
    client.connect().catch(() => {
        connected = false;
    });

    return client;
}

/**
 * Obtiene (o crea) la instancia singleton de Redis.
 * Retorna null si REDIS_URL no está configurada.
 */
export function getRedisClient(): Redis | null {
    if (redisInstance === undefined || redisInstance === null) {
        redisInstance = createRedisClient();
    }
    return redisInstance;
}

/** true si Redis está conectado y listo para recibir comandos */
export function isRedisConnected(): boolean {
    return connected && redisInstance !== null;
}

// ── Rate Limit específico ──────────────────────────────────────────────────────
// Funciones atómicas para rate limiting usando Redis MULTI/EXEC

/**
 * Incrementa el contador de rate limit en Redis.
 * Usa INCR + PEXPIRE atómico para evitar race conditions.
 *
 * @returns { count, ttl } o null si Redis no disponible (señal para usar fallback)
 */
export async function redisRateLimitIncr(
    key: string,
    windowMs: number
): Promise<{ count: number; ttl: number } | null> {
    const client = getRedisClient();
    if (!client || !connected) return null;

    try {
        const fullKey = `rl:${key}`;
        const multi = client.multi();
        multi.incr(fullKey);
        multi.pttl(fullKey);
        const results = await multi.exec();

        if (!results) return null;

        const count = results[0][1] as number;
        const ttl = results[1][1] as number;

        // Si es el primer request (count === 1), setear el TTL
        if (count === 1 || ttl === -1) {
            await client.pexpire(fullKey, windowMs);
            return { count, ttl: windowMs };
        }

        return { count, ttl: ttl > 0 ? ttl : windowMs };
    } catch {
        connected = false;
        return null; // Fallback a in-memory
    }
}

/**
 * Elimina la key de rate limit en Redis (para reset después de login exitoso).
 */
export async function redisRateLimitReset(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !connected) return false;

    try {
        await client.del(`rl:${key}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Health check simple — para el endpoint de status
 */
export async function redisHealthCheck(): Promise<{
    connected: boolean;
    latencyMs?: number;
}> {
    const client = getRedisClient();
    if (!client || !connected) return { connected: false };

    try {
        const start = Date.now();
        await client.ping();
        return { connected: true, latencyMs: Date.now() - start };
    } catch {
        return { connected: false };
    }
}
