/**
 * Validación de la rama `ops-upload-logo-merchant`.
 * Verifica los hooks del nuevo flujo "admin sube logo en nombre del merchant".
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

function add(name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ name, pass: r.ok, detail: r.missing.join(", ") });
}

// 1. Endpoint nuevo
add(
    "src/app/api/admin/merchants/[id]/logo/route.ts: PATCH con audit log",
    fileContains("src/app/api/admin/merchants/[id]/logo/route.ts", [
        "export async function PATCH",
        "MERCHANT_LOGO_UPDATED_BY_ADMIN",
        "imageUrl",
        '!hasAnyRole(session, ["ADMIN"])',
    ])
);

// 2. UI OPS importa ImageUpload + monta MerchantLogoAdmin
add(
    "ops/usuarios/[id]/page.tsx: import ImageUpload + monta MerchantLogoAdmin",
    fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
        'import ImageUpload from "@/components/ui/ImageUpload"',
        "<MerchantLogoAdmin",
        "function MerchantLogoAdmin",
        "/api/admin/merchants/${merchantId}/logo",
        "Falta — bloquea aprobación",
    ])
);

// 3. Endpoint /api/merchant/onboarding usa status APPROVED en lugar de "valor cargado"
add(
    "api/merchant/onboarding: hasXxx usa Status === APPROVED",
    fileContains("src/app/api/merchant/onboarding/route.ts", [
        'merchant.cuitStatus === "APPROVED"',
        'merchant.bankAccountStatus === "APPROVED"',
        'merchant.constanciaAfipStatus === "APPROVED"',
        'merchant.habilitacionMunicipalStatus === "APPROVED"',
        "cuitStatus: true",
    ])
);

// 4. Endpoint admin users-unified devuelve los campos ApprovalSource/Note del merchant
add(
    "api/admin/users-unified/[id]: select incluye ApprovalSource + ApprovalNote",
    fileContains("src/app/api/admin/users-unified/[id]/route.ts", [
        "cuitApprovalSource: true",
        "cuitApprovalNote: true",
        "registroSanitarioApprovalSource: true",
    ])
);

// 5. UI OPS muestra la nota PHYSICAL en cada doc
add(
    "ops/usuarios/[id]/page.tsx: card de doc muestra nota PHYSICAL",
    fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
        "approvalSource: string | null",
        "approvalNote: string | null",
        'doc.approvalSource === "PHYSICAL"',
        "Aprobación física — nota del admin",
    ])
);

// 6. UI Merchant SettingsForm muestra banner verde para PHYSICAL
add(
    "SettingsForm: muestra banner 'Aprobado por administrador' cuando es PHYSICAL",
    fileContains("src/components/comercios/SettingsForm.tsx", [
        "isPhysicalApproved",
        'doc.approvalSource === "PHYSICAL"',
        "Aprobado por administrador",
        "Recibimos este documento fuera del sistema",
        "approvalSource: string | null",
    ])
);

// 7. configuracion/page propaga ApprovalSource a SettingsForm
add(
    "comercios/configuracion/page.tsx: propaga ApprovalSource al form",
    fileContains("src/app/comercios/(protected)/configuracion/page.tsx", [
        "cuitApprovalSource:",
        "bankAccountApprovalSource:",
        "habilitacionMunicipalApprovalSource:",
    ])
);

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama ops-upload-logo-merchant");
console.log("═══════════════════════════════════════════════════════════════════\n");

let failed = 0;
for (const c of checks) {
    const icon = c.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${icon} ${c.name}`);
    if (!c.pass && c.detail) console.log(`    ${YELLOW}faltan: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  1. Abrir /ops/usuarios/[id] de un merchant SIN logo.");
    console.log("  2. Expandir 'Comercio' → ver caja 'Logo del comercio' con badge rojo + upload.");
    console.log("  3. Subir imagen → toast 'Logo cargado'.");
    console.log("  4. Aprobar CUIT como FÍSICO con una nota → caja amarilla aparece debajo del chip.");
    console.log("  5. Logueate como ese merchant → /comercios/configuracion → Documentos:");
    console.log("     • CUIT debería verse como 'Aprobado (administrador)' con banner verde.");
    console.log("     • SIN botón 'Solicitar cambio' (porque no hay nada que reemplazar).");
    console.log("  6. /comercios (dashboard) → checklist NO debe contar CUIT como faltante.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET}.\n`);
    process.exit(1);
}
