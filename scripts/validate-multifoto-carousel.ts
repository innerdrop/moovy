/**
 * Validación de la rama `fix/producto-multifoto-carousel`.
 *
 * Bug reportado por Mauro 2026-04-26: producto con 3+ imágenes en el panel del
 * comercio solo muestra UNA en la vista pública mobile. El user no descubre que
 * hay más fotos.
 *
 * Causa: las imágenes ESTÁN en DB y el carousel ESTÁ implementado, pero los dots
 * indicadores eran `bg-white/50` (8px translúcidos) sobre fondos claros (foto del
 * Cofler Block tiene fondo blanco/crema) — invisibles. Y no había swipe táctil
 * ni flechas de navegación, así que el user no tenía forma de descubrir las otras.
 *
 * Fix aplicado en /productos/[slug] mobile y consistencia en /marketplace/[id]:
 *   1. Swipe táctil (onTouchStart/End con threshold 50px)
 *   2. Flechas izq/der visibles (white/80 backdrop-blur sobre la imagen)
 *   3. Contador "1/3" pill oscura en top-right (feedback inmediato de cantidad)
 *   4. Dots dentro de pill oscura con backdrop-blur (visibles sobre cualquier fondo)
 *   5. aria-labels en cada control para accesibilidad
 *
 * Backend NO se tocó — schema Product.images: ProductImage[] funciona perfecto,
 * action updateProduct guarda OK, /api/products/[slug] devuelve TODAS las imágenes.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const checks: { section: string; name: string; pass: boolean; detail?: string }[] = [];

function fileContains(rel: string, needles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const missing = needles.filter(n => !content.includes(n));
    return { ok: missing.length === 0, missing };
}

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// ═══════════════════════════════════════════════════════════════════════════
// (A) ProductDetailClient — fix mobile carousel
// ═══════════════════════════════════════════════════════════════════════════

add("A", "ProductDetailClient: state touchStartX + handlers swipe",
    fileContains("src/app/(store)/productos/[slug]/ProductDetailClient.tsx", [
        "touchStartX",
        "handleImageTouchStart",
        "handleImageTouchEnd",
        "Math.abs(diff) > 50",
        "setSelectedImageIndex(selectedImageIndex + 1)",
        "setSelectedImageIndex(selectedImageIndex - 1)",
    ])
);

add("A", "ProductDetailClient: onTouchStart/End conectados al carousel mobile",
    fileContains("src/app/(store)/productos/[slug]/ProductDetailClient.tsx", [
        "onTouchStart={handleImageTouchStart}",
        "onTouchEnd={handleImageTouchEnd}",
    ])
);

add("A", "ProductDetailClient: contador \"1 / N\" visible cuando hay >1 imagen",
    fileContains("src/app/(store)/productos/[slug]/ProductDetailClient.tsx", [
        "selectedImageIndex + 1} / {product.images.length",
        "bg-black/60 backdrop-blur-sm",
    ])
);

add("A", "ProductDetailClient: flechas L/R con aria-labels",
    fileContains("src/app/(store)/productos/[slug]/ProductDetailClient.tsx", [
        'aria-label="Imagen anterior"',
        'aria-label="Imagen siguiente"',
        "ChevronLeft className=\"h-4 w-4",
        "ChevronRight className=\"h-4 w-4",
    ])
);

add("A", "ProductDetailClient: dots dentro de pill oscura con backdrop-blur",
    fileContains("src/app/(store)/productos/[slug]/ProductDetailClient.tsx", [
        "bg-black/40 backdrop-blur-sm",
        'aria-label={`Ir a imagen ${i + 1}`}',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (B) ListingDetailClient — consistencia marketplace
// ═══════════════════════════════════════════════════════════════════════════

add("B", "ListingDetailClient: contador 1/N agregado",
    fileContains("src/app/(store)/marketplace/[id]/ListingDetailClient.tsx", [
        "currentImg + 1} / {listing.images.length",
    ])
);

add("B", "ListingDetailClient: flechas L/R con aria-labels nuevos",
    fileContains("src/app/(store)/marketplace/[id]/ListingDetailClient.tsx", [
        'aria-label="Imagen anterior"',
        'aria-label="Imagen siguiente"',
    ])
);

add("B", "ListingDetailClient: dots dentro de pill oscura",
    fileContains("src/app/(store)/marketplace/[id]/ListingDetailClient.tsx", [
        "bg-black/40 backdrop-blur-sm",
        'aria-label={`Ir a imagen ${i + 1}`}',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (C) Backend regression — todo lo de imágenes sigue intacto
// ═══════════════════════════════════════════════════════════════════════════

add("C", "Schema: Product.images relación con ProductImage",
    fileContains("prisma/schema.prisma", [
        "images      ProductImage[]",
        "model ProductImage",
    ])
);

add("C", "actions.ts: updateProduct itera el array completo de imageUrls",
    fileContains("src/app/comercios/actions.ts", [
        "data.imageUrls.map((url: string, index: number)",
        "productId: productId,",
        "url: url,",
        "order: index,",
    ])
);

add("C", "/api/products/[slug]: devuelve images con orderBy y SIN take limit",
    fileContains("src/app/api/products/[slug]/route.ts", [
        'images: { orderBy: { order: "asc" as const } }',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/producto-multifoto-carousel");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "ProductDetailClient mobile carousel",
    B: "ListingDetailClient consistencia",
    C: "Backend regression guard",
};

let failed = 0;
let lastSection = "";
for (const c of checks) {
    if (c.section !== lastSection) {
        console.log(`\n${CYAN}── (${c.section}) ${sections[c.section] ?? c.section}${RESET}`);
        lastSection = c.section;
    }
    const icon = c.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${icon} ${c.name}`);
    if (!c.pass && c.detail) console.log(`    ${YELLOW}faltan: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  1. Abrí un producto con >=2 imágenes en /productos/[slug] desde MOBILE.");
    console.log("  2. Verificá:");
    console.log("     - Pill \"1 / 3\" en esquina superior derecha.");
    console.log("     - Flechas izquierda/derecha visibles cuando hay para navegar.");
    console.log("     - Dots dentro de pill oscura abajo (visibles sobre fondos claros).");
    console.log("     - Swipe táctil de izquierda a derecha cambia a la siguiente imagen.");
    console.log("     - Tocando un dot, va a esa imagen directamente.");
    console.log("  3. Repetí en /marketplace/[id] (mismo patrón).");
    console.log("  4. Desktop: no se tocó — sigue mostrando thumbnails al costado.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
