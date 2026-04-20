/**
 * Format Utilities — MOOVY
 *
 * Helpers centralizados para formatear valores visibles al usuario.
 * Mantener un único helper evita que cada superficie use un locale
 * distinto o se olvide el separador de miles (ej: "5000" en vez de
 * "5.000" en el dashboard del repartidor, ISSUE-039).
 *
 * Última actualización: 2026-04-20
 */

const ARS_FORMATTER = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
});

const ARS_FORMATTER_2_DEC = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Formatea un número como monto en pesos argentinos con separador de miles.
 * No agrega el símbolo "$" — dejarlo al consumidor para respetar espaciado/color.
 *
 * Ejemplos:
 *   formatARS(5000)     // "5.000"
 *   formatARS(1234567)  // "1.234.567"
 *   formatARS(0)        // "0"
 *   formatARS(null)     // "0"
 *   formatARS(undefined)// "0"
 *   formatARS(1234.5, { decimals: 2 }) // "1.234,50"
 */
export function formatARS(
    value: number | null | undefined,
    options?: { decimals?: 0 | 2 }
): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "0";
    }
    const formatter = options?.decimals === 2 ? ARS_FORMATTER_2_DEC : ARS_FORMATTER;
    return formatter.format(value);
}

/**
 * Variante que incluye el símbolo "$" prefijado, útil para labels cortos.
 * Ejemplos:
 *   formatPriceARS(5000)    // "$5.000"
 *   formatPriceARS(null)    // "$0"
 */
export function formatPriceARS(
    value: number | null | undefined,
    options?: { decimals?: 0 | 2 }
): string {
    return `$${formatARS(value, options)}`;
}
