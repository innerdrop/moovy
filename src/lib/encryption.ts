/**
 * AES-256-GCM Encryption/Decryption utility for sensitive fiscal data
 *
 * Usage:
 * - encrypt(plaintext): string -> encrypted ciphertext in format "iv:tag:encrypted"
 * - decrypt(ciphertext): string -> plaintext (or original if not encrypted)
 * - isEncrypted(value): boolean -> check if value is already encrypted
 * - encryptIfNeeded(value): string -> encrypt only if not already encrypted
 *
 * Encryption Key:
 * Generate a 32-byte hex key with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Store in environment variable ENCRYPTION_KEY (example in .env.example)
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment or generate a development key
 * WARNING: Development key is NOT secure and only for local testing
 */
function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        if (process.env.NODE_ENV !== "production") {
            // Development: use a deterministic key (NOT FOR PRODUCTION)
            console.warn(
                "[Encryption] ⚠️  Using development encryption key. " +
                "For production, set ENCRYPTION_KEY env var. Generate with: " +
                'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
            );
            return scryptSync("moovy-dev-key-not-for-production", "salt", 32);
        }

        throw new Error(
            "Missing ENCRYPTION_KEY environment variable. " +
            "Generate a 32-byte hex key with: " +
            'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }

    try {
        return Buffer.from(key, "hex");
    } catch (e) {
        throw new Error(
            "ENCRYPTION_KEY must be a valid 32-byte hex string. " +
            "Generate with: " +
            'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns format: "iv:tag:ciphertext" (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext (all hex)
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string (AES-256-GCM)
 * Input format: "iv:tag:ciphertext" (hex-encoded)
 * Returns plaintext, or original value if not encrypted (backward compatible)
 */
export function decrypt(ciphertext: string): string {
    if (!ciphertext || !ciphertext.includes(":")) {
        // Not encrypted, return as-is (backward compatible with plain text)
        return ciphertext;
    }

    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
        // Malformed, return as-is
        return ciphertext;
    }

    const [ivHex, tagHex, encryptedHex] = parts;

    // Validate hex format
    if (!ivHex || !tagHex || !encryptedHex) {
        return ciphertext;
    }

    if (!/^[0-9a-f]*$/i.test(ivHex) || !/^[0-9a-f]*$/i.test(tagHex) || !/^[0-9a-f]*$/i.test(encryptedHex)) {
        return ciphertext;
    }

    try {
        const key = getKey();
        const iv = Buffer.from(ivHex, "hex");
        const tag = Buffer.from(tagHex, "hex");

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("[Encryption] Decryption failed:", error instanceof Error ? error.message : String(error));
        // If decryption fails, return original (might be plain text from before encryption)
        return ciphertext;
    }
}

/**
 * Check if a value is already encrypted
 * Returns true if value matches format "hex:hex:hex"
 */
export function isEncrypted(value: string): boolean {
    if (!value || typeof value !== "string") return false;

    const parts = value.split(":");
    if (parts.length !== 3) return false;

    // Check if all parts are valid hex strings
    return parts.every(p => /^[0-9a-f]+$/i.test(p));
}

/**
 * Encrypt only if not already encrypted
 * Safe for idempotent operations
 */
export function encryptIfNeeded(value: string): string {
    if (!value || isEncrypted(value)) return value;
    return encrypt(value);
}

/**
 * Decrypt only if encrypted, return as-is if plain text
 * Safe for backward compatibility
 */
export function decryptIfNeeded(value: string): string {
    if (!value) return value;
    return decrypt(value);
}
