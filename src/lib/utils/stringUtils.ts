/**
 * Utility to fix common encoding issues where accents or special characters
 * are incorrectly rendered as '??'.
 */
export function cleanEncoding(str: string | null | undefined): string {
    if (!str) return "";

    return str
        .replace(/\?\?RABE/g, "ÁRABE")
        .replace(/L\?\?cteos/g, "Lácteos")
        .replace(/Sandwicher\?\?a/g, "Sandwichería")
        .replace(/Categor\?\?a/g, "Categoría")
        .replace(/Opci\?\?n/g, "Opción")
        .replace(/Pr\?\?ximo/g, "Próximo")
        .replace(/Vencimiento/g, "Vencimiento") // Just in case
        .replace(/(\w)\?\?(\w)/g, (match, p1, p2) => {
            // Heuristic: common cases in Spanish where ?? appears between letters
            // usually it's an accented vowel or 'ñ'
            const commonReplacements: Record<string, string> = {
                "n??o": "uño",
                "n??a": "uña",
                "a??o": "año",
                "c??o": "uño",
            };

            const lowerMatch = match.toLowerCase();
            if (commonReplacements[lowerMatch]) return commonReplacements[lowerMatch];

            // Generic replacement if we can't be sure
            return `${p1}á${p2}`;
        })
        .replace(/\?\?/g, "á"); // Ultimate fallback for isolated ??
}
