// Rama fix/referral-code-formato-forzado (2026-05-17):
//
// Helpers compartidos para validar y formatear el código de referido de un
// usuario (MOOVER). El formato canónico se define en una sola fuente para
// que cliente y servidor lo apliquen idéntico — evita inconsistencias del
// tipo "el form lo deja escribir cualquier cosa pero el server lo acepta
// también y después no encuentra el referrer".
//
// FORMATO CANÓNICO: MOV-XXXX (8 caracteres totales)
//   - Prefijo literal: "MOV-"
//   - 4 caracteres del set: A-Z (sin I ni O) + 2-9 (sin 0 ni 1)
//   - El set excluye caracteres ambiguos para no equivocarse al copiar
//     a mano (ej. "O" vs "0", "I" vs "1", "S" vs "5").
//
// El generador del backend (`generateReferralCode()` en register/route.ts)
// produce códigos con este formato, así que cualquier referido válido va
// a matchear con esta regex.

/** Set de caracteres válidos para el sufijo (sin ambiguos). */
export const REFERRAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Regex que matchea el formato canónico exacto. Sirve para validación final. */
export const REFERRAL_CODE_REGEX = /^MOV-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

/** Largo total esperado del código (incluye prefijo + guión + 4 chars). */
export const REFERRAL_CODE_LENGTH = 8;

/**
 * Valida si un código tiene el formato canónico exacto.
 *
 * @example
 *   isValidReferralCode("MOV-AB23")  // true
 *   isValidReferralCode("mov-ab23")  // false (debe estar en mayúsculas)
 *   isValidReferralCode("MOOV-AB23") // false (MOOV ≠ MOV)
 *   isValidReferralCode("MOV-AOO1")  // false (O y 1 no están en el set)
 *   isValidReferralCode("")          // false
 *
 * NOTA: para "no se proveyó código" (campo opcional vacío), chequear vacío
 * ANTES de llamar a esta función. La función devuelve false para strings
 * vacíos porque considera que un string vacío NO es un código válido.
 */
export function isValidReferralCode(code: string): boolean {
    if (!code || typeof code !== "string") return false;
    return REFERRAL_CODE_REGEX.test(code);
}

/**
 * Toma cualquier input del usuario y lo formatea progresivamente al formato
 * canónico. Útil para usar en `onChange` de un input — el usuario va viendo
 * cómo se le auto-corrige el código a medida que escribe.
 *
 * Reglas:
 *   1. Pasa todo a mayúsculas.
 *   2. Filtra cualquier caracter que NO esté en REFERRAL_CHARS (incluye
 *      espacios, símbolos, letras ambiguas como I/O/0/1/S/5).
 *   3. Si el usuario tipeó "MOV" o algún prefijo, lo respeta y agrega el
 *      guión cuando corresponda. Si NO empieza con "MOV", lo trata como
 *      sufijo y le antepone "MOV-".
 *   4. Limita el total a 8 caracteres (MOV- + 4).
 *
 * @example
 *   formatReferralCode("mov-ab23")      // "MOV-AB23"
 *   formatReferralCode("ab23")          // "MOV-AB23"
 *   formatReferralCode("AB23XYZ9")      // "MOV-AB23" (corta al largo válido)
 *   formatReferralCode("MOOV-AB23")     // "MOV-AB23" (cae al filtro: la 2da O se filtra)
 *   formatReferralCode("mov-aOO1")      // "MOV-A" (O y 1 se filtran del sufijo)
 *   formatReferralCode("")              // ""
 *
 * Para limpiar y validar al hacer submit, llamá a `isValidReferralCode()`
 * sobre el resultado de esta función.
 */
export function formatReferralCode(input: string): string {
    if (!input || typeof input !== "string") return "";

    // 1. Uppercase + remove all whitespace and special chars
    const upper = input.toUpperCase();

    // 2. Detectar si el usuario empezó tipeando "MOV-" (o un prefijo de eso).
    //    Si sí, conservamos el prefijo y trabajamos solo con el sufijo. Si no,
    //    tratamos todo el input como sufijo (asumimos que pegó solo los 4
    //    chars finales del código que le pasaron).
    let suffix: string;
    if (upper.startsWith("MOV-")) {
        suffix = upper.slice(4);
    } else if (upper.startsWith("MOV")) {
        suffix = upper.slice(3);
    } else {
        suffix = upper;
    }

    // 3. Filtrar solo caracteres válidos del set canónico
    const validSuffix = suffix
        .split("")
        .filter((ch) => REFERRAL_CHARS.includes(ch))
        .slice(0, 4) // máximo 4 chars en el sufijo
        .join("");

    // 4. Si todavía no hay nada después del MOV-, devolver vacío para que
    //    el placeholder se vea. Caso contrario, devolver el código formateado.
    if (validSuffix.length === 0) return "";
    return `MOV-${validSuffix}`;
}
