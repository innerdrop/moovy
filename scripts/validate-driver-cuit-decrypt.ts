/**
 * Validación de la rama `fix/driver-profile-decrypt-cuit`.
 *
 * Verifica los 2 fixes relacionados al CUIT del driver:
 *
 *   (1) GET /api/driver/profile decifra el CUIT antes de devolverlo al frontend.
 *       Sin esto el panel mostraba el ciphertext hex (bug visible reportado
 *       por Mauro 2026-04-25).
 *
 *   (2) POST /api/driver/documents/update encripta el CUIT antes de guardarlo
 *       en DB. Sin esto el driver actualizaba su CUIT y quedaba plaintext en
 *       Driver.cuit, violando la convención AAIP de cifrar PII fiscal.
 *
 * Bonus: chequea que el endpoint del seller siga decifrando correctamente
 * (regression guard — ya lo hacía antes pero queremos asegurarnos que la rama
 * no rompa eso).
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

// (1) /api/driver/profile decifra antes de devolver
add(
    "api/driver/profile (GET): importa decryptDriverData y lo aplica antes del response",
    fileContains("src/app/api/driver/profile/route.ts", [
        'import { decryptDriverData } from "@/lib/fiscal-crypto"',
        "decryptDriverData(driver)",
    ])
);

// (2) /api/driver/documents/update encripta antes de guardar
add(
    "api/driver/documents/update (POST): importa encryptDriverData y lo aplica antes del prisma.update",
    fileContains("src/app/api/driver/documents/update/route.ts", [
        'import { encryptDriverData } from "@/lib/fiscal-crypto"',
        "encryptDriverData(updateData)",
        "data: encryptedUpdateData",
    ])
);

// (Bonus) Regression: seller sigue usando el patrón correcto
add(
    "api/seller/profile (GET + PATCH): sigue usando decryptSellerData + encryptSellerData (regression guard)",
    fileContains("src/app/api/seller/profile/route.ts", [
        "decryptSellerData",
        "encryptSellerData",
    ])
);

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/driver-profile-decrypt-cuit");
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
    console.log("  1. Logueate como driver, andá a /repartidor → Perfil → Documentos.");
    console.log("  2. El campo CUIT/CUIL ahora muestra el valor legible (ej: 20-12345678-9),");
    console.log("     no más el hex encriptado.");
    console.log("  3. Editá el CUIT y guardá.");
    console.log("  4. Verificá en DB que se guardó cifrado:");
    console.log("       docker exec -it moovy-db psql -U postgres -d moovy_db");
    console.log("       SELECT cuit FROM \"Driver\" WHERE id = 'TU_ID';");
    console.log("     Esperado: hex con formato 'iv:tag:cipher' (no plaintext).");
    console.log("  5. Refrescá el panel del driver — debe seguir viendo el plaintext correcto.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET}.\n`);
    process.exit(1);
}
