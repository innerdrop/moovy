/**
 * Validación de la rama `fix/auth-bloqueo-y-reset` (ISSUE-062).
 *
 * Cubre 3 mejoras de seguridad de autenticación:
 *
 *   (A) Bloqueo persistente con warnings progresivos:
 *       - Schema agrega User.failedLoginAttempts + loginLockedUntil.
 *       - authorize() incrementa el contador en cada fallo, bloquea al 5°,
 *         devuelve mensaje "te quedan X intentos" desde el 3° en adelante.
 *       - Login OK resetea ambos campos. Auto-unlock al pasar el lock.
 *       - AuditLog USER_LOGIN_AUTO_LOCKED en bloqueo automático.
 *       - Email sendAccountLockedEmail al user en bloqueo.
 *
 *   (B) Botón "Desbloquear cuenta" en OPS:
 *       - Endpoint /api/admin/users/unlock resetea ambos campos en DB
 *         (antes solo limpiaba rate limit Redis — ineficaz post-15min).
 *       - AuditLog USER_LOGIN_UNLOCKED_BY_ADMIN.
 *       - UI /ops/usuarios/[id] muestra badge de bloqueo + contador de intentos.
 *
 *   (C) Auditoría reset password (regression guard):
 *       - forgot-password: rate limit, mensaje anti-enumeration, token hasheado SHA-256.
 *       - reset-password: validatePasswordStrength, timing-safe comparison,
 *         invalidación post-uso (single-use token).
 *
 *   Bonus: arreglo del bug pre-existente en /api/auth/check-rate-limit que
 *   incrementaba el contador (cada fallo contaba 2×). Ahora es peek-only sobre
 *   la DB, con anti-enumeration para emails no registrados.
 *
 * No requiere conexión a DB — todos los checks son estáticos sobre archivos.
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

function fileLacks(rel: string, needles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const present = needles.filter(n => content.includes(n));
    return { ok: present.length === 0, missing: present };
}

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// ═══════════════════════════════════════════════════════════════════════════
// (A) Bloqueo persistente con warnings
// ═══════════════════════════════════════════════════════════════════════════

add("A", "schema: User tiene failedLoginAttempts y loginLockedUntil",
    fileContains("prisma/schema.prisma", [
        "failedLoginAttempts Int",
        "loginLockedUntil   DateTime?",
    ])
);

add("A", "auth.ts: importa auditLog y define constantes",
    fileContains("src/lib/auth.ts", [
        "import { checkRateLimit, resetRateLimit, auditLog }",
        "MAX_LOGIN_ATTEMPTS = 5",
        "LOCK_DURATION_MS = 15 * 60 * 1000",
        "WARNING_THRESHOLD = 2",
    ])
);

add("A", "auth.ts: select incluye failedLoginAttempts y loginLockedUntil",
    fileContains("src/lib/auth.ts", [
        "failedLoginAttempts: true",
        "loginLockedUntil: true",
    ])
);

add("A", "auth.ts: bloquea cuando loginLockedUntil > now con mensaje específico",
    fileContains("src/lib/auth.ts", [
        "user.loginLockedUntil > now",
        "Cuenta bloqueada por seguridad",
    ])
);

add("A", "auth.ts: auto-unlock cuando lock expiró (resetea attempts y lock)",
    fileContains("src/lib/auth.ts", [
        "user.loginLockedUntil <= now",
        "failedLoginAttempts: 0, loginLockedUntil: null",
    ])
);

add("A", "auth.ts: incrementa failedLoginAttempts en password incorrecto",
    fileContains("src/lib/auth.ts", [
        "newAttempts = currentAttempts + 1",
        "willLock = newAttempts >= MAX_LOGIN_ATTEMPTS",
        "failedLoginAttempts: newAttempts",
    ])
);

add("A", "auth.ts: audita USER_LOGIN_AUTO_LOCKED en bloqueo automático",
    fileContains("src/lib/auth.ts", [
        "action: \"USER_LOGIN_AUTO_LOCKED\"",
    ])
);

add("A", "auth.ts: dispara sendAccountLockedEmail en bloqueo automático",
    fileContains("src/lib/auth.ts", [
        "sendAccountLockedEmail",
        '@/lib/email-legal-ux',
    ])
);

add("A", "auth.ts: mensaje progresivo \"te queda(n) X intento(s)\" desde el 3°",
    fileContains("src/lib/auth.ts", [
        "remaining <= WARNING_THRESHOLD",
        "Te queda 1 intento",
        "Te quedan ${remaining} intentos",
    ])
);

add("A", "auth.ts: login OK resetea failedLoginAttempts y loginLockedUntil",
    fileContains("src/lib/auth.ts", [
        "data: {\n                            failedLoginAttempts: 0,\n                            loginLockedUntil: null,",
    ])
);

add("A", "auth.ts: catch global re-throwea errores user-facing (no swallowea)",
    fileContains("src/lib/auth.ts", [
        "isUserFacing",
        "msg.startsWith(\"Cuenta bloqueada\")",
        "msg.startsWith(\"Tu cuenta fue bloqueada\")",
        "msg.startsWith(\"Contraseña incorrecta\")",
        "throw error",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (B) Botón Desbloquear y UI OPS
// ═══════════════════════════════════════════════════════════════════════════

add("B", "/api/admin/users/unlock: resetea failedLoginAttempts y loginLockedUntil en DB",
    fileContains("src/app/api/admin/users/unlock/route.ts", [
        "failedLoginAttempts: 0",
        "loginLockedUntil: null",
    ])
);

add("B", "/api/admin/users/unlock: audita USER_LOGIN_UNLOCKED_BY_ADMIN",
    fileContains("src/app/api/admin/users/unlock/route.ts", [
        "USER_LOGIN_UNLOCKED_BY_ADMIN",
    ])
);

add("B", "/api/admin/users/unlock: lee estado previo para detalles del audit",
    fileContains("src/app/api/admin/users/unlock/route.ts", [
        "failedLoginAttempts: true",
        "loginLockedUntil: true",
        "previousAttempts",
    ])
);

add("B", "users-unified: select incluye los nuevos campos",
    fileContains("src/app/api/admin/users-unified/[id]/route.ts", [
        "failedLoginAttempts: true",
        "loginLockedUntil: true",
    ])
);

add("B", "users-unified: response incluye failedLoginAttempts y loginLockedUntil",
    fileContains("src/app/api/admin/users-unified/[id]/route.ts", [
        "failedLoginAttempts: user.failedLoginAttempts",
        "loginLockedUntil: user.loginLockedUntil",
    ])
);

add("B", "/ops/usuarios/[id]: UserData tipo extendido con campos de bloqueo",
    fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
        "failedLoginAttempts?: number",
        "loginLockedUntil?: string | null",
    ])
);

add("B", "/ops/usuarios/[id]: muestra badge condicional con contador de intentos",
    fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
        "Cuenta bloqueada hasta",
        "intentos fallidos consecutivos",
    ])
);

add("B", "/ops/usuarios/[id]: botón Desbloquear solo aparece si hay algo que desbloquear",
    fileContains("src/app/ops/(protected)/usuarios/[id]/page.tsx", [
        "if (!showUnlock) return null",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (C) Reset password (regression guard — debe seguir intacto)
// ═══════════════════════════════════════════════════════════════════════════

add("C", "forgot-password: rate limit aplicado",
    fileContains("src/app/api/auth/forgot-password/route.ts", [
        "applyRateLimit",
    ])
);

add("C", "forgot-password: mensaje genérico anti email-enumeration",
    fileContains("src/app/api/auth/forgot-password/route.ts", [
        "success: true",
    ])
);

add("C", "forgot-password: token hasheado SHA-256 antes de guardar en DB",
    fileContains("src/app/api/auth/forgot-password/route.ts", [
        // Buscamos los componentes por separado porque el código real tiene la
        // cadena partida en líneas: `crypto\n    .createHash("sha256")\n    .update(...)`
        '.createHash("sha256")',
        "resetToken: resetTokenHash",
    ])
);

add("C", "reset-password: validatePasswordStrength se llama en el body",
    fileContains("src/app/api/auth/reset-password/route.ts", [
        "validatePasswordStrength",
    ])
);

add("C", "reset-password: timing-safe comparison (Buffer.from + timingSafeEqual)",
    fileContains("src/app/api/auth/reset-password/route.ts", [
        "timingSafeEqual",
        "Buffer.from",
    ])
);

add("C", "reset-password: invalida token post-uso (resetToken: null)",
    fileContains("src/app/api/auth/reset-password/route.ts", [
        "resetToken: null",
        "resetTokenExpiry: null",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (D) Endpoint check-rate-limit: peek-only, anti-enumeration
// ═══════════════════════════════════════════════════════════════════════════

add("D", "check-rate-limit: NO incrementa contador (no llama a checkRateLimit del rate limit Redis)",
    fileLacks("src/app/api/auth/check-rate-limit/route.ts", [
        "checkRateLimit(rateLimitKey",
    ])
);

add("D", "check-rate-limit: lee directo de prisma.user.findUnique (peek)",
    fileContains("src/app/api/auth/check-rate-limit/route.ts", [
        "prisma.user.findUnique",
        "failedLoginAttempts: true",
        "loginLockedUntil: true",
    ])
);

add("D", "check-rate-limit: anti-enumeration para emails no registrados (respuesta idéntica)",
    fileContains("src/app/api/auth/check-rate-limit/route.ts", [
        "if (!user)",
        "remainingAttempts: MAX_LOGIN_ATTEMPTS",
    ])
);

add("D", "check-rate-limit: rate limit por IP (defensa contra scraping)",
    fileContains("src/app/api/auth/check-rate-limit/route.ts", [
        "applyRateLimit",
        '"auth:check-rate-limit"',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (E) Frontend mensajes específicos — REEMPLAZADO POR SECCIÓN (G)
// ═══════════════════════════════════════════════════════════════════════════
// El approach inicial intentaba detectar strings específicos en result.error
// del signIn. NextAuth v5 los trunca a "CredentialsSignin" por seguridad, así
// que esos checks fallaban en producción. La sección (G) valida el approach
// correcto: consultar /api/auth/check-rate-limit después de cada fallo.

// ═══════════════════════════════════════════════════════════════════════════
// (F) Email — sendAccountLockedEmail + entry en EMAIL_REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

add("F", "email-legal-ux: exporta sendAccountLockedEmail",
    fileContains("src/lib/email-legal-ux.ts", [
        "export async function sendAccountLockedEmail",
        '"account_auto_locked"',
        "Bloqueamos tu cuenta por seguridad",
    ])
);

add("F", "email-registry: entrada account_auto_locked registrada",
    fileContains("src/lib/email-registry.ts", [
        "id: 'account_auto_locked'",
        "functionName: 'sendAccountLockedEmail'",
        "category: 'Autenticación y Seguridad'",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (G) FIX 2026-04-26 — Frontend warnings + visibilidad OPS de auto-locks
// ═══════════════════════════════════════════════════════════════════════════
// Bug encontrado en testing: NextAuth v5 trunca el throw del authorize a
// "CredentialsSignin" — los warnings progresivos no llegaban al cliente.
// Fix: el frontend consulta /api/auth/check-rate-limit después de cada fallo
// y muestra warning según remainingAttempts. Además, ahora el admin OPS se
// entera de los auto-locks vía socket + email + sección dedicada en /ops/fraude.

add("G", "PortalLoginForm: consulta check-rate-limit en cada fallo (no solo bloqueo)",
    fileContains("src/components/auth/PortalLoginForm.tsx", [
        '/api/auth/check-rate-limit',
        'data.remainingAttempts',
        'remaining <= 2',
        'Te queda 1 intento',
    ])
);

add("G", "auth.ts: socket event account_auto_locked → admin:users + admin:fraud",
    fileContains("src/lib/auth.ts", [
        '@/lib/socket-emit',
        'socketEmitToRooms',
        '"admin:users", "admin:fraud"',
        '"account_auto_locked"',
    ])
);

add("G", "auth.ts: dispara sendAdminAccountLockedEmail en bloqueo automático",
    fileContains("src/lib/auth.ts", [
        'sendAdminAccountLockedEmail',
        '@/lib/email-admin-ops',
    ])
);

add("G", "email-admin-ops: exporta sendAdminAccountLockedEmail con tag correcto",
    fileContains("src/lib/email-admin-ops.ts", [
        'export async function sendAdminAccountLockedEmail',
        "tag: 'admin_account_auto_locked'",
        'getAlertEmails',
    ])
);

add("G", "email-registry: entrada admin_account_auto_locked registrada",
    fileContains("src/lib/email-registry.ts", [
        "id: 'admin_account_auto_locked'",
        "functionName: 'sendAdminAccountLockedEmail'",
        "recipient: 'admin'",
    ])
);

add("G", "endpoint /api/admin/auto-locked-accounts existe (admin-only, peek-only)",
    fileContains("src/app/api/admin/auto-locked-accounts/route.ts", [
        'hasAnyRole(session, ["ADMIN"])',
        'currentlyLocked',
        'recentlyLocked',
        'loginLockedUntil: { gt: now }',
    ])
);

add("G", "/ops/fraude: muestra sección Cuentas bloqueadas con botón Desbloquear",
    fileContains("src/app/ops/(protected)/fraude/page.tsx", [
        'lockedData',
        '/api/admin/auto-locked-accounts',
        'handleUnlockAccount',
        'Cuentas bloqueadas por intentos fallidos',
        'currentlyLocked.map',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/auth-bloqueo-y-reset (ISSUE-062)");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Bloqueo persistente con warnings",
    B: "Botón Desbloquear + UI OPS",
    C: "Reset password (regression)",
    D: "check-rate-limit peek-only",
    E: "(reemplazada por G — approach inicial NextAuth descartado)",
    F: "Email cuenta bloqueada",
    G: "Fix testing: warnings frontend + visibilidad OPS",
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
    console.log("Pendiente post-merge:");
    console.log("  npx prisma db push && npx prisma generate");
    console.log("");
    console.log("Probar manual:");
    console.log("  1. Logueate al admin OPS, andá a /ops/usuarios/[id] de cualquier user.");
    console.log("     Confirmá que NO aparece el badge de bloqueo (failedLoginAttempts=0).");
    console.log("  2. En otra ventana, probá loguearte con una contraseña incorrecta:");
    console.log("     - Intentos 1 y 2: \"Email o contraseña incorrectos\" (sin warning).");
    console.log("     - Intento 3: \"Te quedan 2 intentos antes de bloqueo\".");
    console.log("     - Intento 4: \"Te queda 1 intento antes de bloqueo\".");
    console.log("     - Intento 5: \"Tu cuenta fue bloqueada por seguridad...\" + UI countdown 15min.");
    console.log("     - Verificá en tu inbox el email \"🔒 Tu cuenta MOOVY fue bloqueada\".");
    console.log("  3. En el panel OPS refrescá el detalle del user:");
    console.log("     - Aparece badge rojo \"Cuenta bloqueada hasta HH:MM\".");
    console.log("     - Aparece botón \"Desbloquear cuenta\".");
    console.log("  4. Click en \"Desbloquear cuenta\" → confirmá → toast verde.");
    console.log("     - El badge desaparece (failedLoginAttempts vuelve a 0).");
    console.log("  5. Volvé a la pestaña del login: ahora podés entrar con la contraseña correcta.");
    console.log("  6. Reset password (regression):");
    console.log("     - /recuperar con email registrado: llega email con link.");
    console.log("     - /recuperar con email no registrado: mismo mensaje (anti-enumeration).");
    console.log("     - Click en el link, reseteá. Re-abrir el mismo link debe fallar (single-use).\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
