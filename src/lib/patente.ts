/**
 * Validación y formateo de patentes argentinas.
 *
 * Formatos soportados:
 *   - MERCOSUR (2016→): AA 123 BB   (2 letras + 3 dígitos + 2 letras)
 *   - Legacy (1995-2016): ABC 123   (3 letras + 3 dígitos)
 *
 * Motos: la patente tiene el mismo formato pero la distribución histórica
 * es distinta — igual aceptamos ambos formatos para cualquier vehículo.
 *
 * Canonical (guardado en DB): sin espacios, UPPERCASE.
 *   - "aa 123 bb"  → "AA123BB"
 *   - "abc-123"    → "ABC123"
 *   - "ab123cd"    → "AB123CD"
 *
 * Display (UI): con espacios, UPPERCASE.
 *   - "AA123BB"    → "AA 123 BB"
 *   - "ABC123"     → "ABC 123"
 *
 * Uso:
 *   - Form de registro (RepartidorRegistroClient.tsx)
 *   - Endpoints register/driver y activate-driver (validación server-side)
 *   - Admin panel (mostrar patente formateada)
 *
 * NUNCA confiar solo en la validación del cliente — siempre re-validar server-side.
 */

export type PatenteFormat = "MERCOSUR" | "LEGACY";

export interface PatenteValidationResult {
    valid: boolean;
    normalized?: string;  // Sin espacios, UPPERCASE (para DB)
    format?: PatenteFormat;
    error?: string;
}

/**
 * Limpia la entrada: solo letras y dígitos, UPPERCASE.
 * "ab 123 cd"   → "AB123CD"
 * "abc-123"     → "ABC123"
 * "  ab123  "   → "AB123"
 */
export function sanitizePatenteInput(raw: string): string {
    if (typeof raw !== "string") return "";
    return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Valida una patente argentina. Acepta ambos formatos (MERCOSUR y legacy).
 * Retorna la versión canonical (sin espacios) para guardar en DB.
 */
export function validatePatente(raw: string): PatenteValidationResult {
    const clean = sanitizePatenteInput(raw);

    if (clean.length === 0) {
        return { valid: false, error: "La patente es obligatoria." };
    }

    // MERCOSUR: 2 letras + 3 dígitos + 2 letras (7 chars total)
    if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(clean)) {
        return { valid: true, normalized: clean, format: "MERCOSUR" };
    }

    // Legacy: 3 letras + 3 dígitos (6 chars total)
    if (/^[A-Z]{3}[0-9]{3}$/.test(clean)) {
        return { valid: true, normalized: clean, format: "LEGACY" };
    }

    // Mensaje específico según longitud para orientar al usuario
    if (clean.length < 6) {
        return { valid: false, error: "Patente incompleta. Formato: AA 123 BB (MERCOSUR) o ABC 123 (vieja)." };
    }
    if (clean.length > 7) {
        return { valid: false, error: "Patente demasiado larga. Formato: AA 123 BB (MERCOSUR) o ABC 123 (vieja)." };
    }

    return {
        valid: false,
        error: "Formato de patente inválido. Usá AA 123 BB (MERCOSUR) o ABC 123 (vieja).",
    };
}

/**
 * Versión booleana simple para validación inline en la UI.
 */
export function isValidPatente(raw: string): boolean {
    return validatePatente(raw).valid;
}

/**
 * Formatea una patente canonical para mostrar con espacios.
 *   "AA123BB"  → "AA 123 BB"
 *   "ABC123"   → "ABC 123"
 *   input con formato incompleto → se formatea lo que se pueda
 */
export function formatPatenteForDisplay(raw: string): string {
    const clean = sanitizePatenteInput(raw);
    if (clean.length === 0) return "";

    // Detectar formato por las primeras 3 chars:
    //   - 2 letras + dígito → MERCOSUR
    //   - 3 letras → LEGACY
    const firstThree = clean.slice(0, 3);

    const isMercosur = /^[A-Z]{2}[0-9]/.test(firstThree);
    const isLegacy = /^[A-Z]{3}/.test(firstThree);

    if (isMercosur) {
        // AA 123 BB
        const part1 = clean.slice(0, 2);
        const part2 = clean.slice(2, 5);
        const part3 = clean.slice(5, 7);
        if (clean.length <= 2) return part1;
        if (clean.length <= 5) return `${part1} ${part2}`;
        return `${part1} ${part2} ${part3}`;
    }

    if (isLegacy) {
        // ABC 123
        const part1 = clean.slice(0, 3);
        const part2 = clean.slice(3, 6);
        if (clean.length <= 3) return part1;
        return `${part1} ${part2}`;
    }

    // Fallback: devolver lo que hay
    return clean;
}

/**
 * Helper para input mask progresivo mientras el usuario tipea.
 * Llamar en onChange con el valor crudo del input.
 * Devuelve lo que se debe setear en el state.
 *
 * Decide el formato por los primeros chars:
 *   - Si los primeros 2 son letras Y el 3ro es dígito → MERCOSUR
 *   - Si los primeros 3 son letras → LEGACY
 *   - Si es ambiguo (ej: solo 2 letras): preferir MERCOSUR (formato actual,
 *     más común para vehículos nuevos)
 *
 * Trunca a la longitud máxima del formato detectado.
 */
export function applyPatenteMask(raw: string): string {
    const clean = sanitizePatenteInput(raw);

    // Trunca a 7 (MERCOSUR es el más largo)
    const truncated = clean.slice(0, 7);

    // Si parece legacy (3 letras al principio), truncá a 6
    if (/^[A-Z]{3}/.test(truncated) && truncated.length > 3 && !/[0-9]/.test(truncated.slice(0, 3))) {
        return formatPatenteForDisplay(truncated.slice(0, 6));
    }

    return formatPatenteForDisplay(truncated);
}
