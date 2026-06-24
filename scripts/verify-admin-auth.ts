/**
 * verify-admin-auth.ts — Verificación de la migración C-1.
 *
 * Asegura que TODO route.ts bajo /api/admin y /api/ops use el gate DB-based
 * `requireApiAdmin` y NO el rol del JWT (`hasAnyRole(session, ["ADMIN"])`,
 * `session.user.role === "ADMIN"`, etc.).
 *
 * Excepciones (allowlist): endpoints que legítimamente sirven a MÁS de un rol
 * (ADMIN + MERCHANT) o que usan isAdmin solo como booleano de visibilidad, no
 * como gate exclusivo de admin.
 *
 * Uso: npx tsx scripts/verify-admin-auth.ts
 * Sale con código 1 si encuentra un endpoint admin-only que todavía gatea por JWT.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOTS = ["src/app/api/admin", "src/app/api/ops"];

// Archivos que sirven a múltiples roles (ADMIN + MERCHANT) o usan el rol como
// flag de visibilidad — NO deben gatear solo con requireApiAdmin.
const ALLOWLIST = new Set([
    "src/app/api/admin/products/route.ts", // GET: ADMIN + MERCHANT
    "src/app/api/admin/products/[id]/route.ts", // GET: isAdmin como visibilidad
    "src/app/api/admin/pricing-tiers/route.ts", // GET: ADMIN + MERCHANT
    "src/app/api/admin/points-config/route.ts", // GET: ADMIN + MERCHANT
]);

// El gate real por JWT siempre arranca con `await auth()`. Detectarlo así evita
// falsos positivos con lógica de negocio que menciona `.role === "ADMIN"`
// (ej. impedir borrar a otro admin en un bulk-delete).
const JWT_GATE_PATTERN = /await auth\(\)/;

function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else if (entry === "route.ts") out.push(full);
    }
    return out;
}

let failures = 0;
let ok = 0;

for (const root of ROOTS) {
    let files: string[];
    try {
        files = walk(root);
    } catch {
        console.error(`[skip] no existe ${root}`);
        continue;
    }
    for (const file of files) {
        const rel = file.replace(/\\/g, "/");
        const src = readFileSync(file, "utf8");
        const usesHelper = src.includes("requireApiAdmin");
        const usesJwtGate = JWT_GATE_PATTERN.test(src);

        if (ALLOWLIST.has(rel)) {
            ok++;
            continue;
        }

        if (!usesHelper) {
            console.error(`[FALLA] ${rel} — no usa requireApiAdmin`);
            failures++;
            continue;
        }
        if (usesJwtGate) {
            console.error(`[FALLA] ${rel} — todavía llama await auth() (posible gate JWT)`);
            failures++;
            continue;
        }
        ok++;
    }
}

console.log(`\n[verify-admin-auth] OK: ${ok} · Fallas: ${failures}`);
if (failures > 0) process.exit(1);
console.log("[verify-admin-auth] Todos los endpoints admin/ops usan el gate DB-based.");
