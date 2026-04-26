/**
 * Validación de la rama `feat/ops-crear-cuentas`.
 *
 * Feature: el admin OPS crea cuentas de buyer/driver/seller desde el panel,
 * sin saber la contraseña del user. El user recibe un magic link (token con
 * expiry 24h) para setear su propia contraseña.
 *
 * Implementación:
 *   - Endpoint POST /api/admin/users/create con discriminated union Zod
 *     (BUYER/DRIVER/SELLER), anti-resurrección, audit log, fire-and-forget email.
 *   - Email sendAccountCreatedByAdminEmail (recipient = el user, no admin)
 *     con tono de bienvenida diferenciado por tipo de cuenta.
 *   - Modal global CreateUserModal en /ops/usuarios con tabs por tipo, form
 *     mínimo (email, nombre, teléfono opcional + datos específicos opcionales).
 *
 * Reusa el flujo /restablecer-contrasena (mismo resetToken hash SHA-256) —
 * no duplica el sistema de tokens, solo agrega el caso de uso "bienvenida".
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

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// ═══════════════════════════════════════════════════════════════════════════
// (A) Endpoint POST /api/admin/users/create
// ═══════════════════════════════════════════════════════════════════════════

add("A", "endpoint admin/users/create existe + auth ADMIN-only",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'export async function POST',
        'hasAnyRole(session, ["ADMIN"])',
        'No autorizado',
    ])
);

add("A", "Zod discriminated union con BUYER/DRIVER/SELLER",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'z.discriminatedUnion("type"',
        'z.literal("BUYER")',
        'z.literal("DRIVER")',
        'z.literal("SELLER")',
    ])
);

add("A", "anti-resurrección: deletedAt → 410 (Gone)",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'existingUser?.deletedAt',
        'status: 410',
        'Esta cuenta fue eliminada',
    ])
);

add("A", "duplicado de email → 409",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'Ya existe una cuenta con ese email',
        'status: 409',
    ])
);

add("A", "genera resetToken hash SHA-256 con expiry 24h",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'crypto.randomBytes(32)',
        'crypto\n            .createHash("sha256")',
        'WELCOME_TOKEN_EXPIRY_HOURS = 24',
        'resetToken: tokenHash',
    ])
);

add("A", "placeholder password (random bcrypt hash, no usable)",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'placeholderPassword',
        'bcrypt.hash',
    ])
);

add("A", "transacción crea User + entidad asociada según type",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'prisma.$transaction',
        'tx.user.create',
        'tx.driver.create',
        'tx.sellerProfile.create',
    ])
);

add("A", "audit log USER_CREATED_BY_ADMIN con detalles",
    fileContains("src/app/api/admin/users/create/route.ts", [
        'action: "USER_CREATED_BY_ADMIN"',
        'createdByAdmin',
        'accountType: data.type',
    ])
);

add("A", "fire-and-forget sendAccountCreatedByAdminEmail con setup link",
    fileContains("src/app/api/admin/users/create/route.ts", [
        '/restablecer-contrasena?token=',
        'sendAccountCreatedByAdminEmail',
        '@/lib/email-admin-ops',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (B) Email sendAccountCreatedByAdminEmail + EMAIL_REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

add("B", "email-admin-ops: exporta sendAccountCreatedByAdminEmail",
    fileContains("src/lib/email-admin-ops.ts", [
        'export async function sendAccountCreatedByAdminEmail',
        "tag: \"account_created_by_admin\"",
        'accountType: "BUYER" | "DRIVER" | "SELLER"',
    ])
);

add("B", "email tiene mensajes diferenciados por tipo de cuenta",
    fileContains("src/lib/email-admin-ops.ts", [
        'Te creamos tu cuenta MOOVY',
        'Te invitamos a ser repartidor MOOVY',
        'Te invitamos a vender en el Marketplace MOOVY',
    ])
);

add("B", "email-registry: entry account_created_by_admin (#318)",
    fileContains("src/lib/email-registry.ts", [
        "id: 'account_created_by_admin'",
        "number: 318",
        "functionName: 'sendAccountCreatedByAdminEmail'",
        "category: 'Registro y Onboarding'",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (C) UI: CreateUserModal + integración en /ops/usuarios
// ═══════════════════════════════════════════════════════════════════════════

add("C", "CreateUserModal.tsx existe con tabs Comprador/Repartidor/Vendedor",
    fileContains("src/components/ops/CreateUserModal.tsx", [
        'AccountType = "BUYER" | "DRIVER" | "SELLER"',
        'label: "Comprador"',
        'label: "Repartidor"',
        'label: "Vendedor"',
        '/api/admin/users/create',
    ])
);

add("C", "modal explica el flujo de magic link al admin",
    fileContains("src/components/ops/CreateUserModal.tsx", [
        'Vos no necesitás saber la contraseña',
        'link vence en 24h',
    ])
);

add("C", "modal: form fields condicional por tipo (vehicleType DRIVER, displayName SELLER)",
    fileContains("src/components/ops/CreateUserModal.tsx", [
        'accountType === "DRIVER"',
        'accountType === "SELLER"',
        'Tipo de vehículo',
        'Nombre público en el marketplace',
    ])
);

add("C", "modal: Escape cierra + body scroll lock + focus management",
    fileContains("src/components/ops/CreateUserModal.tsx", [
        'e.key === "Escape"',
        'document.body.style.overflow',
        'firstFieldRef.current?.focus()',
    ])
);

add("C", "/ops/usuarios: importa CreateUserModal + UserPlus icon",
    fileContains("src/app/ops/(protected)/usuarios/page.tsx", [
        'import CreateUserModal from "@/components/ops/CreateUserModal"',
        'UserPlus,',
    ])
);

add("C", "/ops/usuarios: state showCreateModal + botón Crear cuenta + modal montado",
    fileContains("src/app/ops/(protected)/usuarios/page.tsx", [
        'const [showCreateModal, setShowCreateModal] = useState(false)',
        'onClick={() => setShowCreateModal(true)}',
        '<CreateUserModal',
        'isOpen={showCreateModal}',
        'onSuccess={() => {',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama feat/ops-crear-cuentas");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Endpoint admin/users/create",
    B: "Email + EMAIL_REGISTRY",
    C: "UI CreateUserModal + integración",
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
    console.log("Probar manual:");
    console.log("  1. Logueate al admin OPS, andá a /ops/usuarios.");
    console.log("  2. En el header, tocá 'Crear cuenta' (botón rojo arriba a la derecha).");
    console.log("  3. Probá los 3 tipos:");
    console.log("     - Comprador: email + nombre + teléfono opcional → submit.");
    console.log("     - Repartidor: lo mismo + dropdown vehículo opcional → submit.");
    console.log("     - Vendedor: lo mismo + displayName opcional → submit.");
    console.log("  4. Verificá:");
    console.log("     - Toast 'Email enviado a {email}'.");
    console.log("     - El usuario aparece en el listado.");
    console.log("     - En el inbox del email creado, llega 'Bienvenido a MOOVY — configurá tu contraseña'.");
    console.log("     - Click al botón del email → /restablecer-contrasena → setear password.");
    console.log("     - Login con email + nueva contraseña → entra OK.");
    console.log("  5. Probá errores:");
    console.log("     - Email duplicado: 409 'Ya existe una cuenta con ese email'.");
    console.log("     - Email de cuenta soft-deleted: 410 'Esta cuenta fue eliminada'.");
    console.log("     - Cancelar/Escape cierra el modal sin enviar.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
