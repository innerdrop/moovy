/**
 * Validación de la rama `feat/driver-bank-mp`.
 *
 * Sin estos datos MOOVY no puede pagarle al driver el payout semanal vía MP Bulk
 * Transfer. Versión simplificada: solo CBU/Alias en DB. OAuth split MP queda
 * para post-launch.
 *
 * Pendiente post-merge: `npx prisma db push && npx prisma generate` para que el
 * cliente conozca los 3 campos nuevos (bankCbu, bankAlias, bankAccountUpdatedAt).
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

function fe(rel: string) {
    return { ok: fs.existsSync(path.join(ROOT, rel)), missing: fs.existsSync(path.join(ROOT, rel)) ? [] : [`__file_not_found__: ${rel}`] };
}

function add(s: string, n: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section: s, name: n, pass: r.ok, detail: r.missing.join(" | ") });
}

// (A) Schema
add("A", "Driver: agregados bankCbu, bankAlias, bankAccountUpdatedAt",
    fc("prisma/schema.prisma", [
        "  bankCbu                String?",
        "  bankAlias              String?",
        "  bankAccountUpdatedAt   DateTime?",
    ])
);

// (B) Endpoint
add("B", "Endpoint /api/driver/bank-account existe",
    fe("src/app/api/driver/bank-account/route.ts")
);

add("B", "Endpoint: GET + PATCH + validateBankAccount + audit",
    fc("src/app/api/driver/bank-account/route.ts", [
        "export async function GET",
        "export async function PATCH",
        "validateBankAccount",
        "DRIVER_BANK_ACCOUNT_UPDATED",
        '"@/lib/bank-account"',
    ])
);

add("B", "Endpoint: rechaza si no hay ni CBU ni Alias",
    fc("src/app/api/driver/bank-account/route.ts", [
        "Tenés que cargar al menos un CBU o un Alias",
    ])
);

// (C) UI driver
add("C", "Componente DriverBankAccountForm existe",
    fe("src/components/rider/DriverBankAccountForm.tsx")
);

add("C", "Componente: fetch + PATCH + validación live + toasts",
    fc("src/components/rider/DriverBankAccountForm.tsx", [
        '"/api/driver/bank-account"',
        "validateBankAccount",
        'method: "PATCH"',
        "Sin estos datos no podemos pagarte",
    ])
);

add("C", "ProfileView monta DriverBankAccountForm",
    fc("src/components/rider/views/ProfileView.tsx", [
        "@/components/rider/DriverBankAccountForm",
        "<DriverBankAccountForm",
    ])
);

// (D) Payouts integration
add("D", "payouts.ts: getPendingDriverPayouts usa bankCbu||bankAlias",
    fc("src/lib/payouts.ts", [
        "bankCbu: true",
        "bankAlias: true",
        "o.driver.bankCbu || o.driver.bankAlias",
    ])
);

add("D", "payouts.ts: comentario stale removido",
    (() => {
        const content = fs.readFileSync(path.join(ROOT, "src/lib/payouts.ts"), "utf8");
        const stillStale = content.includes("schema Driver NO tiene campos bancarios");
        return { ok: !stillStale, missing: stillStale ? ["STALE COMMENT STILL THERE"] : [] };
    })()
);

// REPORTE
console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama feat/driver-bank-mp");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Schema (3 campos en Driver)",
    B: "Endpoint /api/driver/bank-account",
    C: "UI driver (DriverBankAccountForm)",
    D: "Integración con payouts existentes",
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
    console.log("  1. npx prisma db push && npx prisma generate (3 campos nuevos)");
    console.log("  2. Avisar a drivers existentes que carguen su CBU desde el panel\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
