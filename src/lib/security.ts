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
 * Rate limiter store (in-memory for development, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for an IP/key
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [k, v] of rateLimitStore.entries()) {
            if (v.resetTime < now) rateLimitStore.delete(k);
        }
    }

    if (!record || record.resetTime < now) {
        // New window
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxAttempts - 1, resetIn: windowMs };
    }

    if (record.count >= maxAttempts) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: record.resetTime - now,
        };
    }

    record.count++;
    return {
        allowed: true,
        remaining: maxAttempts - record.count,
        resetIn: record.resetTime - now,
    };
}

/**
 * Reset rate limit for a key (e.g., after successful login)
 */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
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

