/**
 * Script de validación para la rama `fix/comercio-onboarding-completo`.
 *
 * Verifica que los 4 cambios de la rama estén bien conectados:
 *   1. Schema tiene los nuevos campos `<doc>ApprovalSource` y `<doc>ApprovalNote`
 *      para los 5 docs de Merchant y los 8 docs de Driver.
 *   2. Helpers `merchant-document-approval.ts` y `driver-document-approval.ts`
 *      tienen las nuevas columnas en su mapa + aceptan source/note en el ctx.
 *   3. Endpoints admin de approve doc validan source/note y los pasan al helper.
 *   4. Transiciones globales (approveMerchantTransition + approveDriverTransition)
 *      tiran error LOGO_MISSING / PHOTO_MISSING si falta el logo/foto.
 *   5. Endpoints de approve global catchean esos errores y devuelven 400.
 *   6. UI registro merchant tiene el banner "podés completar después".
 *   7. UI checklist usa `canOpenStore` (no `isComplete`) para auto-hide.
 *   8. Endpoint /api/merchant/onboarding suma `hasLogo` a `canOpenStore`.
 *   9. UI OPS pregunta DIGITAL/PHYSICAL al aprobar y manda source+note al backend.
 *
 * Este script NO ejecuta nada contra la DB — solo lee archivos y verifica que
 * cada hook esté presente. Después correr `npx next build` para confirmar TS.
 *
 * Uso:
 *   npx tsx scripts/validate-onboarding.ts
 *
 * Salida: lista PASS/FAIL. Exit 0 si todo OK, exit 1 si algo falta.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

interface Check {
    name: string;
    pass: boolean;
    detail?: string;
}

const checks: Check[] = [];

function add(name: string, pass: boolean, detail?: string) {
    checks.push({ name, pass, detail });
}

function fileContains(relPath: string, needles: string[]): { ok: boolean; missing: string[] } {
    const full = path.join(ROOT, relPath);
    if (!fs.existsSync(full)) {
        return { ok: false, missing: ["__file_not_found__"] };
    }
    const content = fs.readFileSync(full, "utf8");
    const missing = needles.filter((n) => !content.includes(n));
    return { ok: missing.length === 0, missing };
}

// ─── 1. Schema Prisma: campos nuevos ─────────────────────────────────────────
{
    const merchantNeedles = [
        "cuitApprovalSource",
        "cuitApprovalNote",
        "bankAccountApprovalSource",
        "bankAccountApprovalNote",
        "constanciaAfipApprovalSource",
        "constanciaAfipApprovalNote",
        "habilitacionMunicipalApprovalSource",
        "habilitacionMunicipalApprovalNote",
        "registroSanitarioApprovalSource",
        "registroSanitarioApprovalNote",
    ];
    const r = fileContains("prisma/schema.prisma", merchantNeedles);
    add("schema.prisma: 5 docs Merchant tienen ApprovalSource + ApprovalNote", r.ok, r.missing.join(", "));
}
{
    const driverNeedles = [
        "cuitApprovalSource",
        "cuitApprovalNote",
        "constanciaCuitApprovalSource",
        "constanciaCuitApprovalNote",
        "dniFrenteApprovalSource",
        "dniFrenteApprovalNote",
        "dniDorsoApprovalSource",
        "dniDorsoApprovalNote",
        "licenciaApprovalSource",
        "licenciaApprovalNote",
        "seguroApprovalSource",
        "seguroApprovalNote",
        "vtvApprovalSource",
        "vtvApprovalNote",
        "cedulaVerdeApprovalSource",
        "cedulaVerdeApprovalNote",
    ];
    const r = fileContains("prisma/schema.prisma", driverNeedles);
    add("schema.prisma: 8 docs Driver tienen ApprovalSource + ApprovalNote", r.ok, r.missing.join(", "));
}

// ─── 2. Helpers: nuevas columnas en el mapa ─────────────────────────────────
{
    const r = fileContains("src/lib/merchant-document-approval.ts", [
        "sourceColumn:",
        "noteColumn:",
        "cuitApprovalSource",
        "registroSanitarioApprovalNote",
        '"DIGITAL" | "PHYSICAL"',
    ]);
    add("merchant-document-approval.ts: mapa con sourceColumn/noteColumn + AdminContext extendido", r.ok, r.missing.join(", "));
}
{
    const r = fileContains("src/lib/driver-document-approval.ts", [
        "sourceColumn:",
        "noteColumn:",
        "cuitApprovalSource",
        "cedulaVerdeApprovalNote",
        '"DIGITAL" | "PHYSICAL"',
    ]);
    add("driver-document-approval.ts: mapa con sourceColumn/noteColumn + AdminContext extendido", r.ok, r.missing.join(", "));
}

// ─── 3. Endpoints aceptan source/note ───────────────────────────────────────
{
    const r = fileContains("src/app/api/admin/merchants/[id]/documents/approve/route.ts", [
        "body.source",
        "body.note",
        '"PHYSICAL"',
        "para aprobación física se requiere una nota",
    ].map(s => s.replace("para aprobación física se requiere una nota", "Para aprobación física se requiere una nota")));
    add("admin/merchants/.../documents/approve: parsea + valida source/note", r.ok, r.missing.join(", "));
}
{
    const r = fileContains("src/app/api/admin/drivers/[id]/documents/approve/route.ts", [
        "body.source",
        "body.note",
        '"PHYSICAL"',
        "Para aprobación física se requiere una nota",
    ]);
    add("admin/drivers/.../documents/approve: parsea + valida source/note", r.ok, r.missing.join(", "));
}

// ─── 4. Transiciones validan logo/foto antes de APPROVED ─────────────────────
{
    const r = fileContains("src/lib/roles.ts", [
        "approveMerchantTransition",
        '"LOGO_MISSING"',
        "approveDriverTransition",
        '"PHOTO_MISSING"',
        "El comercio todavía no cargó el logo",
        "El repartidor todavía no cargó su foto",
    ]);
    add("roles.ts: transiciones tiran LOGO_MISSING / PHOTO_MISSING si falta logo/foto", r.ok, r.missing.join(", "));
}

// ─── 5. Endpoints de approve global catchean esos errores ───────────────────
{
    const r = fileContains("src/app/api/admin/merchants/[id]/approve/route.ts", [
        "LOGO_MISSING",
        "status: 400",
    ]);
    add("admin/merchants/.../approve: catchea LOGO_MISSING → 400", r.ok, r.missing.join(", "));
}
{
    const r = fileContains("src/app/api/admin/drivers/[id]/approve/route.ts", [
        "PHOTO_MISSING",
        "status: 400",
    ]);
    add("admin/drivers/.../approve: catchea PHOTO_MISSING → 400", r.ok, r.missing.join(", "));
}

// ─── 6. UI registro merchant tiene banner ───────────────────────────────────
{
    const r = fileContains("src/app/comercio/registro/page.tsx", [
        "Podés completar la documentación más tarde",
        "no será visible",
        "Para publicarte necesitás",
        "Logo del comercio",
        "Horarios de atención",
    ]);
    add("comercio/registro: banner informativo presente con lista de requisitos", r.ok, r.missing.join(", "));
}

// ─── 7. Checklist usa canOpenStore para auto-hide ───────────────────────────
{
    const r = fileContains("src/app/comercios/(protected)/OnboardingChecklist.tsx", [
        "status.canOpenStore || dismissed",
    ]);
    add("OnboardingChecklist: auto-hide cuando canOpenStore (no isComplete)", r.ok, r.missing.join(", "));
}
{
    const r = fileContains("src/app/comercios/(protected)/OnboardingChecklist.tsx", [
        '"logo"',
        "required: true",
    ]);
    add("OnboardingChecklist: logo marcado como required: true", r.ok, r.missing.join(", "));
}

// ─── 8. Endpoint /api/merchant/onboarding suma hasLogo a canOpenStore ───────
{
    const r = fileContains("src/app/api/merchant/onboarding/route.ts", [
        "canOpenStore = docsComplete && hasSchedule && hasProducts && hasAddress && hasLogo",
    ]);
    add("api/merchant/onboarding: canOpenStore incluye hasLogo", r.ok, r.missing.join(", "));
}

// ─── 9. UI OPS pregunta DIGITAL/PHYSICAL ────────────────────────────────────
{
    const r = fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
        "isPhysical = window.confirm",
        '"PHYSICAL" : "DIGITAL"',
        "Aprobación FÍSICA",
        "handleApproveDocument",
        "handleApproveDriverDocument",
    ]);
    add("ops/usuarios/[id]: handlers preguntan DIGITAL/PHYSICAL + nota + mandan al backend", r.ok, r.missing.join(", "));
}

// ─── Reporte ────────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/comercio-onboarding-completo");
console.log("═══════════════════════════════════════════════════════════════════\n");

let failed = 0;
for (const c of checks) {
    const icon = c.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${icon} ${c.name}`);
    if (!c.pass && c.detail) {
        console.log(`    ${YELLOW}faltan: ${c.detail}${RESET}`);
    }
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Próximos pasos:");
    console.log("  1. npx prisma db push    (aplica los nuevos campos al schema local)");
    console.log("  2. npx prisma generate   (regenera el cliente con los nuevos tipos)");
    console.log("  3. npx next build        (build local — debe pasar limpio)");
    console.log("\nProbar manualmente en localhost:");
    console.log("  • Crear merchant pendiente sin logo, intentar aprobarlo desde /ops/usuarios/[id].");
    console.log("    El admin debe ver error 'falta logo'.");
    console.log("  • Subir logo, aprobar — debe pasar.");
    console.log("  • Aprobar un doc físico: aceptar el confirm, escribir nota >5 chars.");
    console.log("    El doc debe quedar APPROVED con source=PHYSICAL en DB.");
    console.log("  • Verificar que el banner del registro merchant se ve antes del paso de docs.");
    console.log("  • Completar todos los obligatorios del onboarding — el checklist debe desaparecer.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length} totales.`);
    console.log("Revisar los detalles arriba antes de cerrar la rama.\n");
    process.exit(1);
}
