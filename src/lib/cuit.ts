/**
 * Validación de CUIT/CUIL argentino (algoritmo AFIP).
 *
 * Un CUIT/CUIL es un número de 11 dígitos con formato XX-XXXXXXXX-X:
 *   - Los primeros 2 dígitos indican el tipo de persona:
 *       20, 23, 24, 27 → persona física
 *       30, 33, 34     → persona jurídica
 *   - Los 8 dígitos del medio son el DNI (para físicas) o número asignado
 *     (para jurídicas).
 *   - El último dígito es el verificador (checksum).
 *
 * Algoritmo del checksum (oficial AFIP):
 *   pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
 *   sum = Σ (dígito[i] × peso[i]) para i en 0..9
 *   resto = sum mod 11
 *   verificador esperado:
 *     - resto == 0 → 0
 *     - resto == 1 → CUIT inválido (no se usa 10 como dígito)
 *     - resto  > 1 → 11 - resto
 *
 * Uso:
 *   - Registro de driver (src/app/api/auth/register/driver/route.ts)
 *   - Activate driver (src/app/api/auth/activate-driver/route.ts)
 *   - Actualización de documentos (src/app/api/driver/profile/route.ts)
 *   - UI live validation (src/app/repartidor/registro/RepartidorRegistroClient.tsx)
 *
 * NUNCA confiar en la validación del cliente — siempre re-validar server-side.
 */

export type CuitPersonType = "FISICA" | "JURIDICA";

export interface CuitValidationResult {
    valid: boolean;
    normalized: string; // 11 dígitos sin separadores
    personType: CuitPersonType | null;
    error?: string;
}

const VALID_PREFIXES_FISICA = ["20", "23", "24", "27"] as const;
const VALID_PREFIXES_JURIDICA = ["30", "33", "34"] as const;
const CUIT_LENGTH = 11;
const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Normaliza input del usuario: remueve guiones, puntos, espacios.
 * Devuelve solo los dígitos.
 */
export function normalizeCuit(raw: string): string {
    if (!raw || typeof raw !== "string") return "";
    return raw.replace(/[^\d]/g, "");
}

/**
 * Detecta el tipo de persona según prefijo. Retorna null si el prefijo es inválido.
 */
export function detectCuitPersonType(raw: string): CuitPersonType | null {
    const normalized = normalizeCuit(raw);
    if (normalized.length < 2) return null;
    const prefix = normalized.substring(0, 2);
    if ((VALID_PREFIXES_FISICA as readonly string[]).includes(prefix)) return "FISICA";
    if ((VALID_PREFIXES_JURIDICA as readonly string[]).includes(prefix)) return "JURIDICA";
    return null;
}

/**
 * Validación completa: longitud, prefijo y checksum AFIP.
 */
export function validateCuit(raw: string): CuitValidationResult {
    if (!raw || typeof raw !== "string") {
        return {
            valid: false,
            normalized: "",
            personType: null,
            error: "El CUIT/CUIL es obligatorio",
        };
    }

    const normalized = normalizeCuit(raw);

    if (normalized.length !== CUIT_LENGTH) {
        return {
            valid: false,
            normalized,
            personType: null,
            error: `El CUIT/CUIL debe tener 11 dígitos (ingresaste ${normalized.length}).`,
        };
    }

    const personType = detectCuitPersonType(normalized);
    if (!personType) {
        const prefix = normalized.substring(0, 2);
        return {
            valid: false,
            normalized,
            personType: null,
            error: `Prefijo "${prefix}" inválido. Debe empezar con 20/23/24/27 (persona física) o 30/33/34 (persona jurídica).`,
        };
    }

    // Checksum AFIP
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(normalized[i], 10) * WEIGHTS[i];
    }
    const remainder = sum % 11;
    let expectedDigit: number;
    if (remainder === 0) {
        expectedDigit = 0;
    } else if (remainder === 1) {
        // El algoritmo AFIP no usa 10 como verificador.
        // Un CUIT con resto 1 es inválido.
        return {
            valid: false,
            normalized,
            personType,
            error: "CUIT/CUIL inválido: el número no cumple con el algoritmo de verificación AFIP.",
        };
    } else {
        expectedDigit = 11 - remainder;
    }

    const actualDigit = parseInt(normalized[10], 10);
    if (expectedDigit !== actualDigit) {
        return {
            valid: false,
            normalized,
            personType,
            error: "CUIT/CUIL inválido: el dígito verificador no coincide. Revisá los 11 dígitos.",
        };
    }

    return { valid: true, normalized, personType };
}

/**
 * Extrae el DNI de un CUIT/CUIL de persona física.
 * Para prefijos 20/23/24/27, los dígitos 2-9 (0-indexed) son el DNI.
 * Ej: "20-12345678-9" → "12345678"
 * Retorna null si no es persona física o si el CUIT es inválido.
 */
export function extractDniFromCuit(raw: string): string | null {
    const result = validateCuit(raw);
    if (!result.valid || result.personType !== "FISICA") return null;
    return result.normalized.substring(2, 10);
}

/**
 * Construye un CUIT/CUIL persona física a partir de un DNI y sexo.
 * Usado en UI para autocompletar el CUIT desde el DNI del driver.
 *
 * Heurística (no es garantía — el usuario debe confirmar):
 *   - Masculino: prefijo "20"
 *   - Femenino: prefijo "27"
 *   - No especificado: devuelve las 2 opciones más comunes
 *
 * Retorna null si el DNI no tiene 7 u 8 dígitos.
 */
export function buildCuitFromDni(
    dni: string,
    sex: "M" | "F" | null = null
): string | null {
    const normalized = dni.replace(/[^\d]/g, "");
    if (normalized.length !== 7 && normalized.length !== 8) return null;

    // Padding a 8 dígitos si viene con 7
    const dni8 = normalized.padStart(8, "0");

    const prefix = sex === "F" ? "27" : "20";
    const body = prefix + dni8;

    // Calcular dígito verificador
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(body[i], 10) * WEIGHTS[i];
    }
    const remainder = sum % 11;
    let checkDigit: number;
    if (remainder === 0) {
        checkDigit = 0;
    } else if (remainder === 1) {
        // Probamos con prefijo alternativo (23/24 para masculino, 24 para femenino
        // son los fallbacks oficiales cuando 20/27 dan resto 1).
        const fallbackPrefix = sex === "F" ? "23" : "23";
        const fallbackBody = fallbackPrefix + dni8;
        let fallbackSum = 0;
        for (let i = 0; i < 10; i++) {
            fallbackSum += parseInt(fallbackBody[i], 10) * WEIGHTS[i];
        }
        const fallbackRemainder = fallbackSum % 11;
        if (fallbackRemainder === 0) return fallbackBody + "0";
        if (fallbackRemainder === 1) return null; // raro, pero no se puede
        return fallbackBody + (11 - fallbackRemainder).toString();
    } else {
        checkDigit = 11 - remainder;
    }

    return body + checkDigit.toString();
}

/**
 * feat/registro-simplificado (2026-04-27): para el registro de comercio NO pedimos
 * sexo (a diferencia del driver). El comercio puede ser persona física (prefix 20 o
 * 27) o persona jurídica (prefix 30). Esta función devuelve las 3 opciones de CUIT
 * que validan checksum AFIP a partir de un DNI/número.
 *
 * @returns array con label legible + cuit normalizado de cada opción válida.
 *          Vacío si el input no es DNI (7-8 dígitos) o ninguna opción valida.
 */
export interface CuitOption {
    label: string; // "Persona física (M)" | "Persona física (F)" | "Empresa / SRL / SA"
    prefix: string; // "20" | "27" | "30"
    cuit: string;  // CUIT con dígito verificador, sin guiones
}

export function getCuitOptionsFromDni(dni: string): CuitOption[] {
    const normalized = dni.replace(/[^\d]/g, "");
    if (normalized.length !== 7 && normalized.length !== 8) return [];
    const dni8 = normalized.padStart(8, "0");

    const options: Array<{ prefix: string; label: string }> = [
        { prefix: "20", label: "Persona física (M)" },
        { prefix: "27", label: "Persona física (F)" },
        { prefix: "30", label: "Empresa / SRL / SA" },
    ];

    const results: CuitOption[] = [];
    for (const { prefix, label } of options) {
        const body = prefix + dni8;
        let sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(body[i], 10) * WEIGHTS[i];
        }
        const remainder = sum % 11;
        let checkDigit: number;
        if (remainder === 0) checkDigit = 0;
        else if (remainder === 1) continue; // este prefijo no aplica para este DNI
        else checkDigit = 11 - remainder;
        results.push({ label, prefix, cuit: body + checkDigit.toString() });
    }
    return results;
}

/**
 * Formato display: XX-XXXXXXXX-X.
 */
export function formatCuitForDisplay(value: string | null | undefined): string {
    if (!value) return "";
    const normalized = normalizeCuit(value);
    if (normalized.length !== CUIT_LENGTH) return value;
    return `${normalized.substring(0, 2)}-${normalized.substring(2, 10)}-${normalized.substring(10, 11)}`;
}
