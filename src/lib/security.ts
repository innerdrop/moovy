// Security utilities for input validation and sanitization
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [], // No HTML allowed by default
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: string): string | null {
    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Sanitize phone number (only digits and +)
 */
export function sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+\-\s]/g, "").trim();
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Mínimo 8 caracteres");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Al menos una mayúscula");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Al menos una minúscula");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Al menos un número");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

/**
 * Rate limiter — Redis como primario, in-memory como fallback automático.
 *
 * Arquitectura:
 * 1. Si Redis está conectado → INCR atómico con PEXPIRE (distribuido, persiste entre deploys)
 * 2. Si Redis no está disponible → Map<> local (se resetea con deploy, suficiente para VPS single-instance)
 * 3. La transición es transparente: si Redis cae mid-request, el siguiente request usa in-memory
 */

import { redisRateLimitIncr, redisRateLimitReset } from "@/lib/redis";

interface RateLimitEntry {
    count: number;
    resetTime: number;
    firstAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Auto-cleanup del fallback in-memory cada 60s
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of rateLimitStore.entries()) {
            if (entry.resetTime < now) {
                rateLimitStore.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`[RateLimit] In-memory cleanup: ${cleaned} expired. Active: ${rateLimitStore.size}`);
        }
    }, 60 * 1000);
}

/** Fallback in-memory (misma lógica que antes) */
function checkRateLimitInMemory(
    key: string,
    maxAttempts: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();

    // Safety valve contra DDoS
    if (rateLimitStore.size > 5000) {
        console.warn(`[RateLimit] Store size ${rateLimitStore.size} exceeds threshold. Forcing cleanup.`);
        for (const [k, v] of rateLimitStore.entries()) {
            if (v.resetTime < now) rateLimitStore.delete(k);
        }
        if (rateLimitStore.size > 5000) {
            const entries = [...rateLimitStore.entries()].sort((a, b) => a[1].firstAttempt - b[1].firstAttempt);
            const toRemove = Math.floor(entries.length / 2);
            for (let i = 0; i < toRemove; i++) {
                rateLimitStore.delete(entries[i][0]);
            }
            console.warn(`[RateLimit] Emergency cleanup: removed ${toRemove} oldest entries`);
        }
    }

    const record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs, firstAttempt: now });
        return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs };
    }

    if (record.count >= maxAttempts) {
        console.warn(`[RateLimit] Blocked: ${key} (${record.count} attempts in ${Math.round((now - record.firstAttempt) / 1000)}s)`);
        return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
    }

    record.count++;
    return { allowed: true, remaining: maxAttempts - record.count, resetIn: record.resetTime - now };
}

/**
 * Check rate limit — Redis primario, in-memory fallback.
 * ASYNC: todos los callers deben usar await.
 */
export async function checkRateLimit(
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    // Intentar Redis primero
    const redisResult = await redisRateLimitIncr(key, windowMs);

    if (redisResult !== null) {
        // Redis respondió — usar sus datos
        const { count, ttl } = redisResult;
        const allowed = count <= maxAttempts;
        if (!allowed) {
            console.warn(`[RateLimit:Redis] Blocked: ${key} (${count}/${maxAttempts})`);
        }
        return {
            allowed,
            remaining: Math.max(0, maxAttempts - count),
            resetIn: ttl,
        };
    }

    // Redis no disponible — fallback in-memory
    return checkRateLimitInMemory(key, maxAttempts, windowMs);
}

/**
 * Reset rate limit (e.g., después de login exitoso).
 * Limpia en Redis Y en in-memory para consistencia.
 */
export async function resetRateLimit(key: string): Promise<void> {
    await redisRateLimitReset(key);
    rateLimitStore.delete(key); // También limpiar local por si acaso
}

/**
 * Escape SQL special characters (additional protection, use with prepared statements)
 */
export function escapeSqlString(str: string): string {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
        switch (char) {
            case "\0": return "\\0";
            case "\x08": return "\\b";
            case "\x09": return "\\t";
            case "\x1a": return "\\z";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char;
            default: return char;
        }
    });
}

/**
 * Validate that a string is a valid UUID v4
 */
export function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) return "****";
    return data.substring(0, visibleChars) + "****";
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
    timestamp: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    ip?: string;
    userAgent?: string;
    details?: Record<string, any>;
}

/**
 * Log security-relevant actions (output to console, should go to proper logging service in production)
 */
export function auditLog(entry: AuditLogEntry): void {
    const log = {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
    };
    console.log("[AUDIT]", JSON.stringify(log));
}

