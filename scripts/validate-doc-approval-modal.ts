/**
 * Validación de la rama `fix/modales-aprobacion-docs`.
 *
 * Verifica que los handlers de aprobación de documento (merchant + driver) ya
 * NO usen window.confirm/window.prompt y en su lugar abran el modal Moovy
 * DocApprovalModal.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const checks: { name: string; pass: boolean; detail?: string }[] = [];

function fileContains(rel: string, needles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const missing = needles.filter(n => !content.includes(n));
    return { ok: missing.length === 0, missing };
}

function fileNotContains(rel: string, banned: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");

    // Escanear sólo las funciones handleApproveDocument y handleApproveDriverDocument
    // Filtramos esas funciones para chequear que NO usen window.confirm/prompt en ese scope.
    // Heurística: el archivo entero tampoco debería tener window.confirm/prompt en el scope
    // de approve doc. Si quedan en handleReject (otra función), no afecta.
    const approveBlock = (content.match(/handleApproveDocument[\s\S]*?const handleRejectDocument/) || [""])[0];
    const approveDriverBlock = (content.match(/handleApproveDriverDocument[\s\S]*?const handleRejectDriverDocument/) || [""])[0];
    const combined = approveBlock + "\n" + approveDriverBlock;

    const found = banned.filter(b => combined.includes(b));
    return { ok: found.length === 0, missing: found };
}

// 1. Componente nuevo existe y completo
checks.push({
    name: "src/components/ops/DocApprovalModal.tsx: componente con radios + textarea + validación",
    ...((r) => ({ pass: r.ok, detail: r.missing.join(", ") }))(
        fileContains("src/components/ops/DocApprovalModal.tsx", [
            '"use client"',
            'export type ApprovalSource = "DIGITAL" | "PHYSICAL"',
            "export interface DocApprovalConfirmation",
            "NOTE_MIN_CHARS",
            'setSource("DIGITAL")',
            'setSource("PHYSICAL")',
            "isPhysical && (",
            "physicalNoteValid",
            'bg-[#e60012]', // rojo MOOVY en CTA
            "backdrop-blur",
        ])
    ),
});

// 2. Página de OPS importa el modal y lo monta
checks.push({
    name: "ops/usuarios/[id]/page.tsx: importa + monta DocApprovalModal con state approvalModal",
    ...((r) => ({ pass: r.ok, detail: r.missing.join(", ") }))(
        fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
            'import DocApprovalModal from "@/components/ops/DocApprovalModal"',
            "<DocApprovalModal",
            "approvalModal",
            "approvalSubmitting",
            "submitApprovalDecision",
            'entity: "merchant"',
            'entity: "driver"',
        ])
    ),
});

// 3. Handlers ya NO usan window.confirm ni window.prompt para approve doc
checks.push({
    name: "ops/usuarios/[id]/page.tsx: handlers de approve doc NO usan window.confirm/window.prompt",
    ...((r) => ({ pass: r.ok, detail: r.missing.join(", ") }))(
        fileNotContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
            "window.confirm(",
            "window.prompt(",
        ])
    ),
});

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/modales-aprobacion-docs");
console.log("═══════════════════════════════════════════════════════════════════\n");

let failed = 0;
for (const c of checks) {
    const icon = c.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${icon} ${c.name}`);
    if (!c.pass && c.detail) console.log(`    ${YELLOW}faltan/quedan: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  1. /ops/usuarios/[id] de un merchant pendiente → expandir Comercio.");
    console.log("  2. Click en 'Aprobar' de cualquier doc.");
    console.log("  3. Aparece el modal Moovy (NO el cuadrito 'localhost:3000 says').");
    console.log("  4. Tiene 2 cards radio: Digital / Físico.");
    console.log("  5. Click en Físico → aparece textarea con contador, mín 5 chars.");
    console.log("  6. Botón Aprobar deshabilitado hasta que la nota tenga 5+ chars.");
    console.log("  7. Confirmar → toast verde, doc queda APPROVED en la lista.");
    console.log("  8. Repetir el flujo con un doc del driver — mismo modal funciona.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET}.\n`);
    process.exit(1);
}
