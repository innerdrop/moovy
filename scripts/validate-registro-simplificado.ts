/**
 * Validación de la rama `feat/registro-simplificado`.
 *
 * Pre-launch UX win: el registro permite crear cuenta merchant/driver con datos
 * mínimos (email, password, nombre, teléfono, businessName/vehicleType, términos).
 * Documentos y CUIT/CBU pasan a ser OPCIONALES en el registro — completables
 * después en el panel. La aprobación admin sigue requiriéndolos.
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

function fc(rel: string, needles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const missing = needles.filter(n => !content.includes(n));
    return { ok: missing.length === 0, missing };
}

function fnc(rel: string, anti: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const found = anti.filter(n => content.includes(n));
    return { ok: found.length === 0, missing: found.map(f => `STILL HAS: ${f}`) };
}

function add(s: string, n: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section: s, name: n, pass: r.ok, detail: r.missing.join(" | ") });
}

// (A) Backend register/merchant
add("A", "register/merchant: CUIT y CBU son opcionales",
    fc("src/app/api/auth/register/merchant/route.ts", [
        "feat/registro-simplificado",
        'data.cuit && data.cuit.replace(/\\D/g, "").length > 0',
        'data.cbu && data.cbu.trim().length > 0',
    ])
);

add("A", "register/merchant: removida validación que requería CUIT obligatorio",
    fnc("src/app/api/auth/register/merchant/route.ts", [
        '"El CUIT es obligatorio y debe tener 11 dígitos"',
    ])
);

// (B) Backend register/driver
add("B", "register/driver: CUIT, DNIs, constancia AFIP son opcionales",
    fc("src/app/api/auth/register/driver/route.ts", [
        "feat/registro-simplificado",
        "data.cuit && data.cuit.toString().trim().length > 0",
    ])
);

add("B", "register/driver: removidas validaciones obligatorias de docs",
    fnc("src/app/api/auth/register/driver/route.ts", [
        '"Subí la constancia de inscripción AFIP / Monotributo"',
        '"Subí el DNI (frente y dorso)"',
        '"La patente es obligatoria para vehículos motorizados"',
        '"Subí la licencia de conducir"',
    ])
);

// (C) Backend activate-*
add("C", "activate-merchant: CUIT y CBU opcionales",
    fc("src/app/api/auth/activate-merchant/route.ts", [
        "feat/registro-simplificado",
        "body.cuit && body.cuit.toString().trim().length > 0",
    ])
);

add("C", "activate-driver: docs opcionales",
    fc("src/app/api/auth/activate-driver/route.ts", [
        "feat/registro-simplificado",
        "body.cuit && body.cuit.toString().trim().length > 0",
    ])
);

// (D) UI registro merchant
add("D", "UI merchant: handleFinalSubmit no bloquea sin CUIT/CBU",
    fc("src/app/comercio/registro/page.tsx", [
        "feat/registro-simplificado",
        'formData.cuit && formData.cuit.replace(/\\D/g, "").length > 0',
    ])
);

add("D", "UI merchant: labels indican (opcional)",
    fc("src/app/comercio/registro/page.tsx", [
        "(opcional, podés completarlo después)",
    ])
);

// (E) UI registro driver
add("E", "UI driver: step1 no bloquea sin DNI/CUIT/docs",
    fc("src/app/repartidor/registro/RepartidorRegistroClient.tsx", [
        "feat/registro-simplificado",
    ])
);

// (F) Helper CUIT
add("F", "lib/cuit.ts: nuevo helper getCuitOptionsFromDni para comercio",
    fc("src/lib/cuit.ts", [
        "export function getCuitOptionsFromDni",
        "Persona física (M)",
        "Persona física (F)",
        "Empresa / SRL / SA",
    ])
);

// (G) Banner pendiente en dashboard merchant
add("G", "Dashboard merchant: banner Tu cuenta está pendiente",
    fc("src/app/comercios/(protected)/page.tsx", [
        "Tu cuenta está pendiente de activación",
        'merchant.approvalStatus !== "APPROVED"',
    ])
);

// REPORTE
console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama feat/registro-simplificado");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Backend register/merchant",
    B: "Backend register/driver",
    C: "Backend activate-merchant + activate-driver",
    D: "UI registro merchant",
    E: "UI registro driver",
    F: "Helper getCuitOptionsFromDni en cuit.ts",
    G: "Banner pendiente en dashboard merchant",
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
    if (!c.pass && c.detail) console.log(`    ${YELLOW}detalle: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
