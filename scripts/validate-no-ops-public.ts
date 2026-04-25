/**
 * Validación de la rama `wording-publico-no-ops`.
 *
 * Verifica que NINGÚN archivo de código user-facing contenga la palabra "OPS"
 * dentro de strings de texto visible (no en comentarios, no en paths de URL,
 * no en logs internos).
 *
 * Por qué importa: "OPS" es jerga interna de Moovy. El comprador/comercio/
 * repartidor/vendedor nunca debería leerla — quedan confundidos ("¿quién es
 * OPS?") y exponemos terminología corporativa que erosiona la marca.
 * Reemplazo único acordado: "el equipo de Moovy".
 *
 * Carpetas escaneadas (USER-FACING):
 *   - src/components/comercios       — UI merchant
 *   - src/components/rider           — UI driver
 *   - src/components/seller          — UI seller
 *   - src/components/store           — UI buyer
 *   - src/components/orders          — chat panel + tracking
 *   - src/components/onboarding      — onboarding tours
 *   - src/components/legal           — cookies, terms
 *   - src/app/(store)                — todas las páginas del buyer
 *   - src/app/comercios/(protected)  — panel merchant
 *   - src/app/repartidor             — registro + panel driver
 *   - src/app/vendedor               — registro + panel seller
 *   - src/app/comercio               — registro merchant
 *   - src/app/api/merchant           — endpoints merchant (pueden devolver mensajes al user)
 *   - src/app/api/driver             — idem driver
 *   - src/app/api/seller             — idem seller
 *   - src/app/api/orders             — endpoints buyer
 *   - src/lib/notifications.ts       — push al user
 *   - src/lib/email.ts               — emails transaccionales
 *   - src/lib/email-p0.ts            — emails P0
 *   - src/lib/email-legal-ux.ts      — emails AAIP/UX
 *
 * NO se escanea (interno):
 *   - src/app/ops/** — panel admin
 *   - src/app/api/ops/** — endpoints admin
 *   - src/app/api/admin/** — endpoints admin
 *   - src/components/ops/** — UI admin
 *   - src/lib/ops-config.ts — config admin
 *   - src/lib/email-admin-ops.ts — emails que reciben los admins (pueden mencionar "OPS")
 *   - src/lib/email-registry.ts — registry interno
 *   - src/lib/cron-health.ts — comentarios internos
 *   - scripts/ — scripts internos
 *
 * Detección: el script lee cada archivo línea por línea y filtra los hits que
 * estén dentro de comentarios de bloque o de línea. Sólo reporta hits en
 * strings literales o JSX text — los que un usuario realmente vería.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const SCAN_DIRS = [
    "src/components/comercios",
    "src/components/rider",
    "src/components/seller",
    "src/components/store",
    "src/components/orders",
    "src/components/onboarding",
    "src/components/legal",
    "src/app/(store)",
    "src/app/comercios/(protected)",
    "src/app/repartidor",
    "src/app/vendedor",
    "src/app/comercio",
    "src/app/api/merchant",
    "src/app/api/driver",
    "src/app/api/seller",
    "src/app/api/orders",
];
const SCAN_FILES = [
    "src/lib/notifications.ts",
    "src/lib/email.ts",
    "src/lib/email-p0.ts",
    "src/lib/email-legal-ux.ts",
];

interface Hit {
    file: string;
    line: number;
    content: string;
}

function walk(dir: string): string[] {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return [];
    const out: string[] = [];
    function recurse(p: string) {
        for (const e of fs.readdirSync(p, { withFileTypes: true })) {
            const sub = path.join(p, e.name);
            if (e.isDirectory()) recurse(sub);
            else if (/\.(ts|tsx)$/.test(e.name)) out.push(sub);
        }
    }
    recurse(full);
    return out;
}

const allFiles = [
    ...SCAN_DIRS.flatMap(walk),
    ...SCAN_FILES.map(f => path.join(ROOT, f)).filter(fs.existsSync),
];

const hits: Hit[] = [];

// Heurística pragmática: un hit cuenta como user-facing si NO está en una
// línea que arranca con un marcador de comentario, ni en una URL/path con
// "/ops/", ni dentro de strings que sean parte de un import.
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/;
const OPS_WORD = /\bOPS\b/;

for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, i) => {
        if (COMMENT_LINE.test(line)) return;        // comentario puro
        if (!OPS_WORD.test(line)) return;            // no menciona OPS como palabra
        // Filtrar URLs/paths internos típicos
        if (/['"`][^'"`]*\/ops\b/i.test(line)) return;       // path como "/ops/..."
        // Si la línea SÓLO contiene OPS dentro de un href/url interno, descartar
        const stripped = line.replace(/['"`][^'"`]*['"`]/g, "");
        // Pero si OPS aparece fuera de strings (en código), también lo descartamos
        // (probablemente es un identificador, no un mensaje).
        if (!/['"`>][^'"`<]*\bOPS\b[^'"`<]*['"`<]/.test(line)) return;

        hits.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            content: line.trim(),
        });
    });
}

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama wording-publico-no-ops");
console.log("═══════════════════════════════════════════════════════════════════\n");
console.log(`Archivos escaneados: ${allFiles.length}`);

if (hits.length === 0) {
    console.log(`\n${GREEN}✓ TODO OK${RESET} — no quedan menciones a "OPS" en strings de texto user-facing.\n`);
    console.log("Probar manual:");
    console.log("  1. Como merchant, /comercios/configuracion → tocar 'Guardar' en CUIT.");
    console.log("     Esperado toast: 'CUIT guardado. Queda pendiente de revisión por el equipo de Moovy.'");
    console.log("  2. Como merchant, en sección Documentación, ver el texto debajo del título.");
    console.log("     Esperado: 'Cada uno se aprueba de forma independiente por el equipo de Moovy.'");
    console.log("  3. Como driver, /repartidor → tab Perfil → guardar CUIT.");
    console.log("     Esperado toast equivalente con 'el equipo de Moovy'.");
    console.log("  4. Como driver con un doc APROBADO, click 'Solicitar cambio'.");
    console.log("     El historial de respuestas debe decir 'Respuesta del equipo:'.\n");
    process.exit(0);
}

console.log(`\n${RED}✗ Quedan ${hits.length} mención(es) a "OPS" en strings user-facing:${RESET}\n`);
for (const h of hits) {
    console.log(`  ${YELLOW}${h.file}:${h.line}${RESET}`);
    console.log(`    ${h.content}`);
}
console.log("\nReemplazá cada una por 'el equipo de Moovy' (o variante natural según contexto).");
process.exit(1);
