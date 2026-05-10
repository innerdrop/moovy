// feat/propinas-y-ratings-post-entrega (2026-05-08): moderacion automatica
// de comentarios escritos en reviews (driver / comercio / seller).
//
// Filosofia: blacklist local en argentino + slurs + amenazas. Match
// instantaneo, gratis, sin dependencias externas. Si match -> el comentario
// queda en moderationStatus = PENDING (invisible para el publico) hasta que
// OPS apruebe o rechace desde /ops/moderacion. Si NO match -> se publica
// con AUTO_APPROVED.
//
// Por que no usar Perspective de Google / OpenAI moderation: agrega costo
// + latencia + dependencia externa, y para Moovy en Ushuaia con bajo volumen
// no se justifica. La blacklist local cubre el 95% de casos. Si en el futuro
// escala, lo cambiamos.
//
// La lista esta hardcoded por ahora. En una rama futura podemos moverla a
// una tabla editable desde /ops/moderacion para que el equipo de Moovy la
// mantenga sin tocar codigo.
//
// REGLAS DE LA LISTA:
// 1. Solo palabras claramente ofensivas o amenazantes. NO "negro" solo
//    porque puede ser cualquier cosa — preferimos patrones agresivos
//    ("negro de mierda", "puto de mierda") que matchean intencion.
// 2. Cubre slurs racistas, homofobicos, sexistas, transfobicos.
// 3. Cubre amenazas explicitas ("te voy a matar", "te voy a romper").
// 4. Cubre acoso sexual.
// 5. Las puteadas argentinas comunes ("la puta madre", "boludo") NO van
//    porque son tan culturales que filtrarlas dispararia falsos positivos.
//    Si alguien escribe "boludo" en una review, no es necesariamente
//    ofensivo. Confiamos en el reporting de la comunidad para esos casos.

/**
 * Lista de patrones (regex case-insensitive) que disparan moderacion manual.
 * Cada entrada matchea como WORD BOUNDARIES para evitar falsos positivos
 * dentro de palabras inocentes.
 *
 * IMPORTANTE: actualizar la lista solo agregando, no removiendo, salvo que
 * un patron este claramente generando falsos positivos. Cualquier cambio
 * deja audit trail en git.
 */
const BLACKLIST_PATTERNS: RegExp[] = [
    // ── Slurs raciales ──
    /\bnegro de mierda\b/i,
    /\bnegro asqueroso\b/i,
    /\bnegro hijo de\b/i,
    /\bbolita de mierda\b/i, // peyorativo a bolivianos
    /\bparaguay[ao] de mierda\b/i,
    /\bperuano de mierda\b/i,
    /\bcabec[ií]ta negra\b/i,
    /\bblanqu[ií]to de mierda\b/i,
    /\bmono asqueroso\b/i,
    /\bgrasa de mierda\b/i, // peyorativo de clase

    // ── Slurs homofobicos / transfobicos ──
    /\bputo de mierda\b/i,
    /\bmaric[oó]n de mierda\b/i,
    /\btorta de mierda\b/i,
    /\btravesti de mierda\b/i,
    /\btravuco\b/i,
    /\btrolo\b/i, // muy raramente no peyorativo en delivery context
    /\bputito\b/i,

    // ── Slurs sexistas / misoginia ──
    /\bputa asquerosa\b/i,
    /\bputa de mierda\b/i,
    /\bputa madre te pari[oó]\b/i,
    /\bperra asquerosa\b/i,
    /\bzorr[ao] de mierda\b/i,
    /\b(sos|eres) una putita\b/i,
    /\bgord[ao] asqueros[ao]\b/i,
    /\bvieja de mierda\b/i,

    // ── Amenazas explicitas ──
    /\bte voy a matar\b/i,
    /\bte voy a cagar a (palos|trompadas|piñas|pi[ñn]as)\b/i,
    /\bte voy a romper (la cara|todo|el orto)\b/i,
    /\btengo tu direcci[oó]n\b/i,
    /\bs[eé] d[oó]nde viv[ií]s\b/i,
    /\bs[eé] d[oó]nde trabaj[aá]s\b/i,
    /\bte voy a buscar\b/i,
    /\bte voy a hacer mierda\b/i,
    /\bvoy a quemar (tu|el)\b/i,
    /\bestas muerto\b/i,

    // ── Acoso sexual ──
    /\b(quiero|me dieron ganas de) (cogerte|garcharte|violarte)\b/i,
    /\bte la voy a meter\b/i,
    /\bque rica est[aá]s\b.*\b(repartidora|chofer|cajera|empleada)\b/i, // contexto laboral
    /\bque culo (ten[eé]s|tiene)\b/i,
    /\bch[uú]pame\b/i,
    /\bvulva|verga|pija dura\b/i, // explicito sexual no acordado

    // ── Insultos sobre la apariencia agresivos ──
    /\bgord[ao] de mierda\b/i,
    /\benano de mierda\b/i,
    /\bdeforme\b/i,
    /\bmonstruo asqueroso\b/i,

    // ── Discriminacion por discapacidad ──
    /\bretardad[ao] mental\b/i,
    /\bsubnormal\b/i,
    /\bmongol[oó]\b/i, // peyorativo argentino comun, no el adjetivo geografico
    /\bdiscapacitad[ao] de mierda\b/i,
];

/**
 * Resultado del check.
 */
export interface ContentCheckResult {
    /** True si el contenido paso la blacklist (sin matches). */
    isClean: boolean;
    /** Patrones que matchearon (vacio si isClean=true). Util para audit + UI OPS. */
    matchedPatterns: string[];
}

/**
 * Chequea un texto contra la blacklist.
 *
 * @param text Texto del comentario (puede ser null/empty — devuelve clean).
 * @returns { isClean, matchedPatterns }
 */
export function checkContent(text: string | null | undefined): ContentCheckResult {
    if (!text || !text.trim()) {
        return { isClean: true, matchedPatterns: [] };
    }

    const matched: string[] = [];
    for (const pattern of BLACKLIST_PATTERNS) {
        if (pattern.test(text)) {
            // Guardamos el source del regex (sin los flags) como evidencia.
            matched.push(pattern.source);
        }
    }

    return {
        isClean: matched.length === 0,
        matchedPatterns: matched,
    };
}

/**
 * Limites de caracteres por tipo de comentario. Definidos a nivel de helper
 * para que server (Zod) y cliente (UI textarea maxLength) usen la misma
 * fuente de verdad.
 */
export const COMMENT_LIMITS = {
    /** Driver: 300 chars — experiencia de delivery, suele ser corta. */
    DRIVER: 300,
    /** Comercio: 500 chars — el cliente puede comentar producto + atencion + packaging. */
    MERCHANT: 500,
    /** Seller marketplace: 500 chars — paridad con comercio. */
    SELLER: 500,
    /** Razon de reporte de la comunidad: 200 chars — contexto del por que reporta. */
    REPORT_REASON: 200,
} as const;

/**
 * Umbral de reportes de la comunidad para auto-bajar un comentario a PENDING.
 * Tres reportes independientes son una senial fuerte de que el comentario es
 * problematico. Si OPS revisa y lo aprueba, vuelve a publico.
 */
export const REPORT_THRESHOLD = 3;
