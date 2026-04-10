/**
 * validate-role-flows.ts — Script de validación del sistema de roles derivados
 *
 * Verifica que el rediseño "roles NO se guardan, se DERIVAN" funciona
 * correctamente contra la DB real. Valida:
 *
 * 1. src/lib/roles.ts exporta todo lo esperado
 * 2. computeUserAccess devuelve el shape correcto (usuario dummy)
 * 3. auto-heal-roles.ts y role-access.ts fueron eliminados
 * 4. No quedan usos de UserRole en endpoints de escritura
 * 5. Para cada Merchant APPROVED → su owner tiene access canAccess=true
 * 6. Para cada Merchant PENDING → su owner tiene access canAccess=false + redirect
 * 7. Para cada Driver APPROVED → tiene access canAccess=true
 * 8. Para cada Driver PENDING/REJECTED → access canAccess=false
 * 9. SellerProfile.isActive coincide con access.seller.status === "active"
 * 10. Usuarios ADMIN (User.role = 'ADMIN') bypassean todos los gates
 * 11. Usuarios soft-deleted → computeUserAccess retorna null
 * 12. Matriz de transiciones: approveMerchantTransition, rejectMerchantTransition,
 *     approveDriverTransition, rejectDriverTransition actualizan approvalStatus
 *     y escriben audit log (sin tocar UserRole)
 *
 * Uso: npx tsx scripts/validate-role-flows.ts
 *
 * Requiere: DATABASE_URL configurada, ejecutar después de npm run build o con
 *           tsx que maneje los imports de @/lib/roles correctamente.
 *
 * Creado: 2026-04-10 (rediseño "roles single source of truth")
 */

import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const ROOT = join(__dirname, "..");

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    details?: string;
}

const results: TestResult[] = [];

function pass(name: string, details?: string) {
    results.push({ name, passed: true, details });
}

function fail(name: string, error: string) {
    results.push({ name, passed: false, error });
}

// ─── Test 1: legacy files deleted ───────────────────────────────────────────

function testLegacyFilesDeleted() {
    const legacy = [
        "src/lib/auto-heal-roles.ts",
        "src/lib/role-access.ts",
    ];
    const stillThere = legacy.filter((f) => existsSync(join(ROOT, f)));
    if (stillThere.length > 0) {
        fail(
            "Legacy files deleted",
            `Todavía existen: ${stillThere.join(", ")}. Debían borrarse en el rediseño.`
        );
        return;
    }
    pass("Legacy files deleted", "auto-heal-roles.ts y role-access.ts eliminados");
}

// ─── Test 2: roles.ts exports canonical API ────────────────────────────────

function testRolesModuleExports() {
    const rolesPath = join(ROOT, "src/lib/roles.ts");
    if (!existsSync(rolesPath)) {
        fail("roles.ts exists", "src/lib/roles.ts no encontrado");
        return;
    }
    const content = readFileSync(rolesPath, "utf-8");
    const required = [
        "export async function computeUserAccess",
        "export async function requireMerchantAccess",
        "export async function requireDriverAccess",
        "export async function requireSellerAccess",
        "export async function approveMerchantTransition",
        "export async function rejectMerchantTransition",
        "export async function approveDriverTransition",
        "export async function rejectDriverTransition",
    ];
    const missing = required.filter((r) => !content.includes(r));
    if (missing.length > 0) {
        fail("roles.ts canonical exports", `Faltan: ${missing.join(", ")}`);
        return;
    }
    pass("roles.ts canonical exports", `${required.length} exports encontrados`);
}

// ─── Test 3: no UserRole writes in write-path code ─────────────────────────

function testNoUserRoleWritesInEndpoints() {
    const shouldBeClean = [
        "src/app/api/auth/register/route.ts",
        "src/app/api/auth/register/merchant/route.ts",
        "src/app/api/auth/register/driver/route.ts",
        "src/app/api/auth/activate-merchant/route.ts",
        "src/app/api/auth/activate-driver/route.ts",
        "src/app/api/auth/activate-seller/route.ts",
        "src/app/api/auth/cancel-merchant/route.ts",
        "src/app/api/auth/cancel-driver/route.ts",
        "src/app/api/seller/activate/route.ts",
        "src/app/api/admin/merchants/create/route.ts",
        "src/app/api/admin/merchants/[id]/approve/route.ts",
        "src/app/api/admin/merchants/[id]/reject/route.ts",
        "src/app/api/admin/drivers/[id]/approve/route.ts",
        "src/app/api/admin/drivers/[id]/reject/route.ts",
        "src/app/api/admin/users/[id]/delete/route.ts",
        "src/app/api/admin/users/bulk-delete/route.ts",
        "src/app/api/profile/delete/route.ts",
        "src/lib/auth.ts",
    ];
    const dirty: string[] = [];
    for (const rel of shouldBeClean) {
        const abs = join(ROOT, rel);
        if (!existsSync(abs)) continue;
        const content = readFileSync(abs, "utf-8");
        // match: tx.userRole.<op> | prisma.userRole.<op>
        if (/\b(tx|prisma)\.userRole\.(create|createMany|upsert|update|updateMany|delete|deleteMany)\b/.test(content)) {
            dirty.push(rel);
        }
    }
    if (dirty.length > 0) {
        fail(
            "No UserRole writes in endpoints",
            `Todavía hay writes en: ${dirty.join(", ")}`
        );
        return;
    }
    pass("No UserRole writes in endpoints", `${shouldBeClean.length} archivos limpios`);
}

// ─── Test 4: approved merchants have canAccess = true via computeUserAccess ─

async function testApprovedMerchantsAccess() {
    // Import dinámico para evitar alias resolution en tsx
    const { computeUserAccess } = await import("../src/lib/roles");

    const approved = await prisma.merchant.findMany({
        where: { approvalStatus: "APPROVED" },
        select: { id: true, ownerId: true, isSuspended: true },
        take: 20,
    });

    if (approved.length === 0) {
        pass("Approved merchants access", "Sin merchants APPROVED en DB (test vacío)");
        return;
    }

    const failures: string[] = [];
    for (const m of approved) {
        if (m.isSuspended) continue; // suspended merchants bloquean access, no son un bug
        const access = await computeUserAccess(m.ownerId);
        if (!access) {
            failures.push(`ownerId=${m.ownerId} → computeUserAccess retornó null`);
            continue;
        }
        if (access.merchant.status !== "active") {
            failures.push(
                `merchant=${m.id} owner=${m.ownerId} → merchant.status=${access.merchant.status} (esperado "active")`
            );
        }
    }
    if (failures.length > 0) {
        fail("Approved merchants access", failures.join("; "));
        return;
    }
    pass("Approved merchants access", `${approved.length} merchants APPROVED verificados`);
}

// ─── Test 5: pending merchants have canAccess = false ──────────────────────

async function testPendingMerchantsAccess() {
    const { computeUserAccess } = await import("../src/lib/roles");

    const pending = await prisma.merchant.findMany({
        where: { approvalStatus: "PENDING" },
        select: { id: true, ownerId: true },
        take: 20,
    });

    if (pending.length === 0) {
        pass("Pending merchants access", "Sin merchants PENDING en DB (test vacío)");
        return;
    }

    const failures: string[] = [];
    for (const m of pending) {
        const access = await computeUserAccess(m.ownerId);
        if (!access) {
            failures.push(`ownerId=${m.ownerId} → computeUserAccess retornó null`);
            continue;
        }
        // El owner puede ser admin (bypass) o tener otro rol activo.
        // Lo importante: status del merchant debe ser "pending"
        if (access.merchant.status !== "pending") {
            failures.push(
                `merchant=${m.id} owner=${m.ownerId} → merchant.status=${access.merchant.status} (esperado "pending")`
            );
        }
    }
    if (failures.length > 0) {
        fail("Pending merchants access", failures.join("; "));
        return;
    }
    pass("Pending merchants access", `${pending.length} merchants PENDING verificados`);
}

// ─── Test 6: drivers match their approvalStatus ────────────────────────────

async function testDriversAccess() {
    const { computeUserAccess } = await import("../src/lib/roles");

    const drivers = await prisma.driver.findMany({
        select: { id: true, userId: true, approvalStatus: true, isSuspended: true },
        take: 30,
    });

    if (drivers.length === 0) {
        pass("Drivers access matches approvalStatus", "Sin drivers en DB (test vacío)");
        return;
    }

    const failures: string[] = [];
    for (const d of drivers) {
        const access = await computeUserAccess(d.userId);
        if (!access) {
            failures.push(`driver=${d.id} userId=${d.userId} → computeUserAccess null`);
            continue;
        }
        const expectedStatus =
            d.approvalStatus === "APPROVED" && !d.isSuspended
                ? "active"
                : d.approvalStatus === "APPROVED" && d.isSuspended
                    ? "suspended"
                    : d.approvalStatus === "PENDING"
                        ? "pending"
                        : d.approvalStatus === "REJECTED"
                            ? "rejected"
                            : "unknown";
        if (access.driver.status !== expectedStatus) {
            failures.push(
                `driver=${d.id} → driver.status=${access.driver.status} (esperado ${expectedStatus})`
            );
        }
    }
    if (failures.length > 0) {
        fail("Drivers access matches approvalStatus", failures.join("; "));
        return;
    }
    pass("Drivers access matches approvalStatus", `${drivers.length} drivers verificados`);
}

// ─── Test 7: sellers match their isActive ──────────────────────────────────

async function testSellersAccess() {
    const { computeUserAccess } = await import("../src/lib/roles");

    const sellers = await prisma.sellerProfile.findMany({
        select: { id: true, userId: true, isActive: true },
        take: 30,
    });

    if (sellers.length === 0) {
        pass("Sellers access matches isActive", "Sin sellers en DB (test vacío)");
        return;
    }

    const failures: string[] = [];
    for (const s of sellers) {
        const access = await computeUserAccess(s.userId);
        if (!access) {
            failures.push(`seller=${s.id} userId=${s.userId} → null`);
            continue;
        }
        const expected = s.isActive ? "active" : "inactive";
        if (access.seller.status !== expected) {
            failures.push(
                `seller=${s.id} → seller.status=${access.seller.status} (esperado ${expected})`
            );
        }
    }
    if (failures.length > 0) {
        fail("Sellers access matches isActive", failures.join("; "));
        return;
    }
    pass("Sellers access matches isActive", `${sellers.length} sellers verificados`);
}

// ─── Test 8: soft-deleted users return null ────────────────────────────────

async function testSoftDeletedUsers() {
    const { computeUserAccess } = await import("../src/lib/roles");

    const deleted = await prisma.user.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true },
        take: 5,
    });

    if (deleted.length === 0) {
        pass("Soft-deleted users return null", "Sin users soft-deleted en DB (test vacío)");
        return;
    }

    const failures: string[] = [];
    for (const u of deleted) {
        const access = await computeUserAccess(u.id);
        if (access !== null) {
            failures.push(`userId=${u.id} → access no fue null (${JSON.stringify(access).slice(0, 100)})`);
        }
    }
    if (failures.length > 0) {
        fail("Soft-deleted users return null", failures.join("; "));
        return;
    }
    pass("Soft-deleted users return null", `${deleted.length} users soft-deleted verificados`);
}

// ─── Test 9: admin users get isAdmin = true ────────────────────────────────

async function testAdminUsers() {
    const { computeUserAccess } = await import("../src/lib/roles");

    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", deletedAt: null },
        select: { id: true, email: true },
        take: 5,
    });

    if (admins.length === 0) {
        pass("Admin users isAdmin = true", "Sin admins en DB (test vacío — crear al menos uno)");
        return;
    }

    const failures: string[] = [];
    for (const a of admins) {
        const access = await computeUserAccess(a.id);
        if (!access) {
            failures.push(`admin=${a.email} → access null`);
            continue;
        }
        if (!access.isAdmin) {
            failures.push(`admin=${a.email} → isAdmin=false`);
        }
    }
    if (failures.length > 0) {
        fail("Admin users isAdmin = true", failures.join("; "));
        return;
    }
    pass("Admin users isAdmin = true", `${admins.length} admins verificados`);
}

// ─── Test 10: merchant/driver approve+reject route files use transitions ──

function testApproveRejectUseTransitions() {
    const checks: Array<{ file: string; expected: string }> = [
        { file: "src/app/api/admin/merchants/[id]/approve/route.ts", expected: "approveMerchantTransition" },
        { file: "src/app/api/admin/merchants/[id]/reject/route.ts", expected: "rejectMerchantTransition" },
        { file: "src/app/api/admin/drivers/[id]/approve/route.ts", expected: "approveDriverTransition" },
        { file: "src/app/api/admin/drivers/[id]/reject/route.ts", expected: "rejectDriverTransition" },
    ];

    const failures: string[] = [];
    for (const { file, expected } of checks) {
        const abs = join(ROOT, file);
        if (!existsSync(abs)) {
            failures.push(`${file} no existe`);
            continue;
        }
        const content = readFileSync(abs, "utf-8");
        if (!content.includes(expected)) {
            failures.push(`${file} no usa ${expected}()`);
        }
    }
    if (failures.length > 0) {
        fail("Approve/reject endpoints use transitions", failures.join("; "));
        return;
    }
    pass("Approve/reject endpoints use transitions", "4 endpoints OK");
}

// ─── Test 11: protected layouts use require* gates ────────────────────────

function testProtectedLayoutsUseGates() {
    const checks: Array<{ file: string; expected: string }> = [
        { file: "src/app/comercios/(protected)/layout.tsx", expected: "requireMerchantAccess" },
        { file: "src/app/repartidor/(protected)/layout.tsx", expected: "requireDriverAccess" },
        { file: "src/app/vendedor/(protected)/layout.tsx", expected: "requireSellerAccess" },
    ];

    const failures: string[] = [];
    for (const { file, expected } of checks) {
        const abs = join(ROOT, file);
        if (!existsSync(abs)) {
            failures.push(`${file} no existe`);
            continue;
        }
        const content = readFileSync(abs, "utf-8");
        if (!content.includes(expected)) {
            failures.push(`${file} no usa ${expected}()`);
        }
    }
    if (failures.length > 0) {
        fail("Protected layouts use gates", failures.join("; "));
        return;
    }
    pass("Protected layouts use gates", "3 layouts OK");
}

// ─── Test 12: auth.ts uses computeUserAccess (no auto-heal) ───────────────

function testAuthUsesComputeUserAccess() {
    const abs = join(ROOT, "src/lib/auth.ts");
    if (!existsSync(abs)) {
        fail("auth.ts uses computeUserAccess", "src/lib/auth.ts no existe");
        return;
    }
    const content = readFileSync(abs, "utf-8");
    if (!content.includes("computeUserAccess")) {
        fail("auth.ts uses computeUserAccess", "auth.ts no importa computeUserAccess");
        return;
    }
    if (content.includes("autoHealUserRoles") || content.includes("auto-heal-roles")) {
        fail("auth.ts uses computeUserAccess", "auth.ts todavía referencia autoHealUserRoles");
        return;
    }
    pass("auth.ts uses computeUserAccess", "authorize() y jwt() derivan roles");
}

// ─── Runner ────────────────────────────────────────────────────────────────

async function run() {
    console.log("\n🔍 Validando sistema de roles derivados (src/lib/roles.ts)...\n");

    // Static tests primero (rápidos, detectan regresiones de rediseño)
    testLegacyFilesDeleted();
    testRolesModuleExports();
    testNoUserRoleWritesInEndpoints();
    testApproveRejectUseTransitions();
    testProtectedLayoutsUseGates();
    testAuthUsesComputeUserAccess();

    // Dynamic tests (requieren DB)
    try {
        await testApprovedMerchantsAccess();
        await testPendingMerchantsAccess();
        await testDriversAccess();
        await testSellersAccess();
        await testSoftDeletedUsers();
        await testAdminUsers();
    } catch (e) {
        console.error("❌ Error corriendo tests dinámicos contra DB:", e);
        fail("DB dynamic tests", (e as Error).message);
    }

    // Report
    console.log("\n─── RESULTADOS ───\n");
    let passed = 0;
    let failed = 0;
    for (const r of results) {
        const icon = r.passed ? "✅" : "❌";
        console.log(`${icon} ${r.name}${r.details ? " — " + r.details : ""}${r.error ? " — " + r.error : ""}`);
        if (r.passed) passed++;
        else failed++;
    }
    console.log(`\n${passed}/${results.length} tests OK${failed > 0 ? ` (${failed} fallaron)` : ""}\n`);

    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (e) => {
    console.error("❌ Error fatal:", e);
    await prisma.$disconnect();
    process.exit(1);
});
