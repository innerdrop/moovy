/**
 * Fiscal Data Encryption Helper
 *
 * Handles encryption/decryption of sensitive Argentine fiscal data:
 * - CUIT (Código Único de Identificación Tributaria)
 * - CBU (Código Bancario Uniforme)
 *
 * Used in Merchant and SellerProfile models to ensure at-rest encryption
 * before database storage and transparent decryption on retrieval.
 */

import { encrypt, decrypt, encryptIfNeeded, isEncrypted } from "./encryption";

// Fields to encrypt in Merchant model
const MERCHANT_ENCRYPTED_FIELDS = ["cuit", "bankAccount", "cuil", "ownerDni"] as const;

// Fields to encrypt in SellerProfile model
const SELLER_ENCRYPTED_FIELDS = ["cuit", "bankCbu", "bankAlias"] as const;

// Fields to encrypt in Driver model
const DRIVER_ENCRYPTED_FIELDS = ["cuit"] as const;

/**
 * Encrypt fiscal fields before saving Merchant to DB
 */
export function encryptMerchantData(data: any): any {
    if (!data) return data;

    const result = { ...data };
    for (const field of MERCHANT_ENCRYPTED_FIELDS) {
        if (result[field] && typeof result[field] === "string") {
            result[field] = encryptIfNeeded(result[field]);
        }
    }
    return result;
}

/**
 * Decrypt fiscal fields after reading Merchant from DB
 */
export function decryptMerchantData(data: any): any {
    if (!data) return data;

    const result = { ...data };
    for (const field of MERCHANT_ENCRYPTED_FIELDS) {
        if (result[field] && typeof result[field] === "string") {
            result[field] = decrypt(result[field]);
        }
    }
    return result;
}

/**
 * Encrypt fiscal fields before saving SellerProfile to DB
 */
export function encryptSellerData(data: any): any {
    if (!data) return data;

    const result = { ...data };
    for (const field of SELLER_ENCRYPTED_FIELDS) {
        if (result[field] && typeof result[field] === "string") {
            result[field] = encryptIfNeeded(result[field]);
        }
    }
    return result;
}

/**
 * Decrypt fiscal fields after reading SellerProfile from DB
 */
export function decryptSellerData(data: any): any {
    if (!data) return data;

    const result = { ...data };
    for (const field of SELLER_ENCRYPTED_FIELDS) {
        if (result[field] && typeof result[field] === "string") {
            result[field] = decrypt(result[field]);
        }
    }
    return result;
}

/**
 * Encrypt fiscal fields before saving Driver to DB
 */
export function encryptDriverData(data: any): any {
    if (!data) return data;

    const result = { ...data };
    for (const field of DRIVER_ENCRYPTED_FIELDS) {
        if (result[field] && typeof result[field] === "string") {
            result[field] = encryptIfNeeded(result[field]);
        }
    }
    return result;
}

/**
 * Decrypt fiscal fields after reading Driver from DB
 */
export function decryptDriverData(data: any): any {
    if (!data) return data;

    const result = { ...data };
    for (const field of DRIVER_ENCRYPTED_FIELDS) {
        if (result[field] && typeof result[field] === "string") {
            result[field] = decrypt(result[field]);
        }
    }
    return result;
}

/**
 * Mask sensitive fiscal data for logging (show last 4 chars only)
 */
export function maskCuit(cuit: string | null | undefined): string {
    if (!cuit) return "****";
    return `****${cuit.slice(-4)}`;
}

export function maskCbu(cbu: string | null | undefined): string {
    if (!cbu) return "****";
    return `****${cbu.slice(-4)}`;
}

/**
 * Check if merchant data contains encrypted fields
 */
export function merchantHasEncryptedFields(data: Record<string, any>): boolean {
    return MERCHANT_ENCRYPTED_FIELDS.some(field => isEncrypted(data[field]));
}

/**
 * Check if seller data contains encrypted fields
 */
export function sellerHasEncryptedFields(data: Record<string, any>): boolean {
    return SELLER_ENCRYPTED_FIELDS.some(field => isEncrypted(data[field]));
}

/**
 * Check if driver data contains encrypted fields
 */
export function driverHasEncryptedFields(data: Record<string, any>): boolean {
    return DRIVER_ENCRYPTED_FIELDS.some(field => isEncrypted(data[field]));
}
