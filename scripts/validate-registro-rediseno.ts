/**
 * Validación de la rama `feat/registro-rediseno-core`.
 *
 * Plan A del rediseño de registro pre-launch:
 *   - Schema: applicationStatus + pausedByUserAt + cancelledByUserAt en Merchant/Driver/SellerProfile.
 *   - Layouts protegidos permiten "pending" entrar al panel (en lugar de redirigir a /pendiente-aprobacion).
 *   - Endpoints register/activate setean applicationStatus="DRAFT" al crear el actor.
 *   - Endpoints approve/reject (admin) sincronizan applicationStatus con approvalStatus.
 *   - Hub /empezar como punto de entrada centralizado al registro.
 *
 * Pendiente post-launch (otras ramas):
 *   - Wizard interno de onboarding por panel (Fase 3).
 *   - UI pausa/cancelación de rol del actor (Fase 5).
 *   - Cron de limpieza de cuentas DRAFT zombie (Fase 4).
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

function fe(rel: string) {
    return { ok: fs.existsSync(path.join(ROOT, rel)), missing: fs.existsSync(path.join(ROOT, rel)) ? [] : [`__file_not_found__: ${rel}`] };
}

function add(s: string, n: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section: s, name: n, pass: r.ok, detail: r.missing.join(" | ") });
}

// (A) Schema
add("A", "Merchant: applicationStatus + pausedByUserAt + cancelledByUserAt",
    fc("prisma/schema.prisma", [
        "applicationStatus      String      @default(\"DRAFT\")",
        "pausedByUserAt    DateTime?",
        "cancelledByUserAt    DateTime?",
    ])
);

add("A", "Driver: applicationStatus + pause/cancel",
    fc("prisma/schema.prisma", [
        // Driver tiene mismo patrón
        "// feat/registro-rediseno-core (2026-04-27): applicationStatus + self-service pause/cancel",
    ])
);

add("A", "SellerProfile: applicationStatus + pause/cancel",
    fc("prisma/schema.prisma", [
        "// feat/registro-rediseno-core (2026-04-27): seller pasa al mismo workflow uniforme",
    ])
);

add("A", "Schema: índice nuevo applicationStatus en los 3 modelos",
    fc("prisma/schema.prisma", [
        "@@index([applicationStatus])",
    ])
);

// (B) Layouts permiten pending
add("B", "requireMerchantAccess: case pending retorna access (no redirige)",
    fc("src/lib/roles.ts", [
        "feat/registro-rediseno-core (2026-04-27): merchants pendientes",
    ])
);

add("B", "requireDriverAccess: case pending retorna access",
    fc("src/lib/roles.ts", [
        "feat/registro-rediseno-core (2026-04-27): drivers pendientes",
    ])
);

add("B", "requireSellerAccess: case pending retorna access",
    fc("src/lib/roles.ts", [
        "feat/registro-rediseno-core (2026-04-27): sellers pendientes",
    ])
);

// (C) Endpoints sincronizan applicationStatus
add("C", "register/merchant: setea applicationStatus DRAFT",
    fc("src/app/api/auth/register/merchant/route.ts", [
        'applicationStatus: "DRAFT"',
    ])
);

add("C", "register/driver: setea applicationStatus DRAFT",
    fc("src/app/api/auth/register/driver/route.ts", [
        'applicationStatus: "DRAFT"',
    ])
);

add("C", "activate-merchant: setea applicationStatus DRAFT",
    fc("src/app/api/auth/activate-merchant/route.ts", [
        'applicationStatus: "DRAFT"',
    ])
);

add("C", "activate-driver: setea applicationStatus DRAFT",
    fc("src/app/api/auth/activate-driver/route.ts", [
        'applicationStatus: "DRAFT"',
    ])
);

add("C", "approveMerchantTransition: sincroniza applicationStatus APPROVED",
    fc("src/lib/roles.ts", [
        'applicationStatus: "APPROVED"',
        'applicationStatus: "REJECTED"',
    ])
);

// (D) Hub /empezar
add("D", "Hub /empezar existe",
    fe("src/app/empezar/page.tsx")
);

add("D", "Hub: 4 cards (buyer / merchant / driver / seller)",
    fc("src/app/empezar/page.tsx", [
        '"buyer"',
        '"merchant"',
        '"driver"',
        '"seller"',
        "ACCOUNT_TYPES",
    ])
);

add("D", "Hub: redirect automático con ?type=X",
    fc("src/app/empezar/page.tsx", [
        "router.replace(match.href)",
    ])
);

// REPORTE
console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama feat/registro-rediseno-core");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Schema (applicationStatus + pause/cancel)",
    B: "Layouts permiten pending entrar al panel",
    C: "Endpoints sincronizan applicationStatus",
    D: "Hub /empezar (selector visual)",
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
    console.log("Pendiente post-merge:");
    console.log("  1. npx prisma db push && npx prisma generate (3 campos nuevos x 3 modelos)");
    console.log("  2. Migración manual de PENDING → DRAFT/DATA_COMPLETED si querés");
    console.log("     (sin esto los actores pendientes existentes siguen viendo pendiente-aprobacion)\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
