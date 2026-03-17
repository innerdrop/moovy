/**
 * Normalize a string into a URL-safe slug.
 * Strips diacritical marks (á→a, é→e, ñ→n, etc.) and replaces
 * non-alphanumeric characters with hyphens.
 */
export function normalizeSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
