/**
 * Validación de cuentas bancarias argentinas.
 *
 * Aceptamos dos formatos (BCRA):
 * - CBU: 22 dígitos numéricos con dos checksums (posiciones 7 y 21).
 * - Alias: 6-20 caracteres. Sólo letras, dígitos, puntos y guiones.
 *
 * Helpers de alto nivel:
 * - `detectBankAccountType(value)` devuelve "CBU" | "ALIAS" | null según heurística.
 * - `validateCbu(value)` implementa el algoritmo BCRA completo (bloque 1 de 8 + bloque 2 de 14).
 * - `validateAlias(value)` chequea el rango + charset permitido.
 * - `validateBankAccount(value)` es el entrypoint del formulario: normaliza,
 *   autodetecta el tipo y devuelve un error humano si no valida.
 *
 * El formulario de registro de comercio (src/app/comercio/registro/page.tsx)
 * llama a `validateBankAccount` en el step 2. El endpoint de registro
 * (src/app/api/auth/register/merchant/route.ts) lo usa server-side como
 * defense in depth — nunca confiamos que el front validó.
 */

export type BankAccountType = "CBU" | "ALIAS";

export interface BankAccountValidationResult {
    valid: boolean;
    type: BankAccountType | null;
    normalized: string; // el valor saneado (espacios y guiones removidos en CBU, trim en alias)
    error?: string;
}

const ALIAS_MIN_LENGTH = 6;
const ALIAS_MAX_LENGTH = 20;
const CBU_LENGTH = 22;

/**
 * Normaliza el input:
 * - Para CBU (solo dígitos detectados): remueve espacios, guiones y puntos.
 * - Para alias: trim externo, el interior se respeta (puntos/guiones son válidos).
 * Devuelve el mismo string en caso ambiguo.
 */
export function normalizeBankAccountInput(raw: string): string {
    const trimmed = raw.trim();
    // Si solo tiene dígitos + separadores comunes → tratarlo como CBU
    if (/^[\d\s\-.]+$/.test(trimmed)) {
        return trimmed.replace(/[\s\-.]/g, "");
    }
    return trimmed;
}

/**
 * Heurística de tipo. Se usa para elegir el validador y para mostrar badge en UI.
 * Reglas:
 * - Si son 22 dígitos exactos → CBU.
 * - Si tiene alguna letra o puntuación (alfanumérico mixto) y está en rango → ALIAS.
 * - En cualquier otro caso → null (input inválido).
 */
export function detectBankAccountType(raw: string): BankAccountType | null {
    const normalized = normalizeBankAccountInput(raw);
    if (!normalized) return null;

    if (/^\d{22}$/.test(normalized)) return "CBU";

    // Si contiene algún carácter no-dígito y cumple el charset del alias
    if (
        /[a-zA-Z.\-]/.test(normalized) &&
        /^[a-zA-Z0-9.\-]+$/.test(normalized) &&
        normalized.length >= ALIAS_MIN_LENGTH &&
        normalized.length <= ALIAS_MAX_LENGTH
    ) {
        return "ALIAS";
    }
    return null;
}

/**
 * Validación de alias: 6-20 caracteres, letras/dígitos/puntos/guiones.
 * No puede empezar ni terminar con separador (criterio BCRA).
 */
export function validateAlias(raw: string): boolean {
    const alias = raw.trim();
    if (alias.length < ALIAS_MIN_LENGTH || alias.length > ALIAS_MAX_LENGTH) return false;
    if (!/^[a-zA-Z0-9.\-]+$/.test(alias)) return false;
    if (/^[.\-]|[.\-]$/.test(alias)) return false;
    return true;
}

/**
 * Validación completa de CBU con los dos dígitos verificadores del BCRA.
 *
 * Un CBU de 22 dígitos se compone así:
 *   [0..2]  código banco (3)
 *   [3..6]  código sucursal (4)
 *   [7]     verificador bloque 1 (del 0..6)
 *   [8..20] cuenta (13)
 *   [21]    verificador bloque 2 (del 8..20)
 *
 * Los pesos van rotando: 3-1-7-9-3-1-7-9... desde la derecha.
 * El dígito verificador es (10 - (suma % 10)) % 10.
 */
export function validateCbu(raw: string): boolean {
    const cbu = normalizeBankAccountInput(raw);
    if (!/^\d{22}$/.test(cbu)) return false;

    const block1 = cbu.substring(0, 8);
    const block2 = cbu.substring(8, 22);
    const weights1 = [7, 1, 3, 9, 7, 1, 3, 9]; // posiciones 0..7 de izquierda a derecha
    const weights2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3, 9];

    function checkDigit(segment: string, weights: number[]): boolean {
        const n = segment.length;
        const checkPos = n - 1;
        let sum = 0;
        for (let i = 0; i < checkPos; i++) {
            sum += parseInt(segment[i], 10) * weights[i];
        }
        const digit = (10 - (sum % 10)) % 10;
        return digit === parseInt(segment[checkPos], 10);
    }

    return checkDigit(block1, weights1) && checkDigit(block2, weights2);
}

/**
 * Entrypoint canónico para el formulario. Devuelve el veredicto + tipo detectado
 * para que la UI pueda mostrar un badge ("CBU válido" o "Alias válido") y el
 * endpoint server-side pueda decidir cómo guardar/mostrar.
 */
export function validateBankAccount(raw: string): BankAccountValidationResult {
    if (!raw || typeof raw !== "string") {
        return {
            valid: false,
            type: null,
            normalized: "",
            error: "El CBU o Alias bancario es obligatorio",
        };
    }

    const normalized = normalizeBankAccountInput(raw);
    const type = detectBankAccountType(raw);

    if (!type) {
        return {
            valid: false,
            type: null,
            normalized,
            error:
                "Ingresá un CBU (22 dígitos) o un Alias (6-20 caracteres, letras, números, puntos o guiones).",
        };
    }

    if (type === "CBU") {
        if (!validateCbu(normalized)) {
            return {
                valid: false,
                type: "CBU",
                normalized,
                error:
                    "El CBU tiene 22 dígitos pero no pasa la verificación. Revisá el número completo.",
            };
        }
        return { valid: true, type: "CBU", normalized };
    }

    // type === "ALIAS"
    if (!validateAlias(normalized)) {
        return {
            valid: false,
            type: "ALIAS",
            normalized,
            error:
                "El Alias debe tener 6-20 caracteres y solo contener letras, números, puntos o guiones (no puede empezar ni terminar con punto o guión).",
        };
    }
    return { valid: true, type: "ALIAS", normalized };
}

/**
 * Formato display. Si es CBU agrega espacios cada 4 dígitos para legibilidad.
 * Alias se muestra tal cual.
 */
export function formatBankAccountForDisplay(
    value: string | null | undefined,
    type?: BankAccountType | null
): string {
    if (!value) return "";
    const detected = type ?? detectBankAccountType(value);
    if (detected === "CBU") {
        return value.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    }
    return value;
}
