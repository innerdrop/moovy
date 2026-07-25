/**
 * scripts/verify-aprobacion-docs-portada.ts
 *
 * Verificación de la rama fix/aprobacion-docs-pipeline-y-portada:
 *
 *  1. El paso "Completá tu documentación" de la guía (computeMerchantSetup)
 *     cuenta un doc requerido como cumplido si hay archivo/valor cargado O si
 *     su estado es APPROVED (aprobación física desde OPS sin URL).
 *  2. Comercio APPROVED global (botón "Aprobar Comercio") ⇒ paso docs cumplido.
 *  3. Logo y PORTADA son obligatorios para abrir la tienda (canOpenStore) y la
 *     portada es un paso de la guía.
 *  4. El pipeline de comercios EXCLUYE cuentas cuyo dueño está borrado
 *     (deletedAt) — un purgado no debe aparecer en "Rechazados".
 *
 * Correr:  npx tsx scripts/verify-aprobacion-docs-portada.ts
 * No toca datos reales: crea usuarios/comercios de prueba con emails
 * verify-adp-*@moovy.test y los borra al final (incluso si falla).
 */

import { prisma } from "../src/lib/prisma";
import { computeMerchantSetup, isDocumentSatisfied } from "../src/lib/merchant-setup";
import {
    getRequiredDocumentFields,
    DOCUMENT_COLUMNS,
    type MerchantDocumentField,
} from "../src/lib/merchant-document-approval";

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean, extra?: string) {
    if (cond) {
        passed++;
        console.log(`  ✓ ${label}`);
    } else {
        failed++;
        console.log(`  ✗ ${label}${extra ? ` — ${extra}` : ""}`);
    }
}

const EMAIL_1 = "verify-adp-merchant@moovy.test";
const EMAIL_2 = "verify-adp-borrado@moovy.test";

async function cleanup() {
    const users = await prisma.user.findMany({
        where: { email: { in: [EMAIL_1, EMAIL_2] } },
        select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return;
    const merchants = await prisma.merchant.findMany({
        where: { ownerId: { in: userIds } },
        select: { id: true },
    });
    const merchantIds = merchants.map((m) => m.id);
    if (merchantIds.length > 0) {
        await prisma.product.deleteMany({ where: { merchantId: { in: merchantIds } } });
        await prisma.merchant.deleteMany({ where: { id: { in: merchantIds } } });
    }
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function main() {
    console.log("== verify-aprobacion-docs-portada ==\n");
    await cleanup(); // por si quedó basura de una corrida anterior

    // ── Setup: user + merchant de prueba (rubro NO alimenticio) ──────────────
    const user = await prisma.user.create({
        data: { email: EMAIL_1, name: "Verify ADP", password: "x" },
    });
    let merchant = await prisma.merchant.create({
        data: {
            name: "Verify ADP Store",
            slug: `verify-adp-${Date.now()}`,
            ownerId: user.id,
            category: "Kiosco",
        },
    });

    const requiredDocs = await getRequiredDocumentFields(merchant.category);
    console.log(`Docs requeridos hoy (flags de esta DB): ${requiredDocs.join(", ") || "(ninguno)"}\n`);

    // ── 1. PENDING sin nada cargado ─────────────────────────────────────────
    console.log("1. Comercio PENDING recién registrado:");
    let setup = await computeMerchantSetup(merchant);
    if (requiredDocs.length > 0) {
        check("paso docs pendiente", !setup.docsComplete);
    } else {
        check("paso docs cumplido (no se pide ningún doc)", setup.docsComplete);
    }
    check("no puede abrir tienda", !setup.canOpenStore);
    check("la guía incluye el paso de portada", setup.steps.some((s) => s.id === "banner"));
    check("falta la portada", setup.missingLabels.includes("Subí tu foto de portada"));
    check("falta el logo", setup.missingLabels.includes("Subí el logo de tu comercio"));

    // ── 2. Docs cumplidos por VALOR cargado (subió archivos, sin revisar) ───
    console.log("\n2. Merchant cargó archivos/valores (sin revisión de OPS):");
    const valueData: Record<string, string> = {};
    for (const f of requiredDocs) {
        valueData[DOCUMENT_COLUMNS[f].valueColumn] = f === "cuit" ? "20-12345678-9" : `https://r2.test/${f}.pdf`;
    }
    merchant = await prisma.merchant.update({ where: { id: merchant.id }, data: valueData });
    setup = await computeMerchantSetup(merchant);
    check("paso docs cumplido con archivos cargados", setup.docsComplete);
    for (const f of requiredDocs) {
        check(`isDocumentSatisfied(${f}) por valor`, isDocumentSatisfied(merchant, f));
    }

    // ── 3. Docs cumplidos por ESTADO (aprobación FÍSICA, sin URL) ───────────
    console.log("\n3. Aprobación física desde OPS (estado APPROVED, sin archivo):");
    const clearValues: Record<string, null> = {};
    const approvedStatuses: Record<string, string> = {};
    for (const f of requiredDocs) {
        clearValues[DOCUMENT_COLUMNS[f].valueColumn] = null;
        approvedStatuses[DOCUMENT_COLUMNS[f].statusColumn] = "APPROVED";
    }
    merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: { ...clearValues, ...approvedStatuses },
    });
    setup = await computeMerchantSetup(merchant);
    check("paso docs cumplido con estados APPROVED (el bug reportado)", setup.docsComplete);
    for (const f of requiredDocs) {
        check(`isDocumentSatisfied(${f}) por estado`, isDocumentSatisfied(merchant, f));
    }

    // ── 4. Aprobación GLOBAL sin ningún doc ─────────────────────────────────
    console.log("\n4. Botón 'Aprobar Comercio' (APPROVED global, docs en cero):");
    const resetStatuses: Record<string, string> = {};
    for (const f of requiredDocs) {
        resetStatuses[DOCUMENT_COLUMNS[f].statusColumn] = "PENDING";
    }
    merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: { ...resetStatuses, approvalStatus: "APPROVED" },
    });
    setup = await computeMerchantSetup(merchant);
    check("paso docs cumplido por aprobación global", setup.docsComplete);
    check("todavía no puede abrir (faltan logo/portada/horarios/etc.)", !setup.canOpenStore);
    check("setupMode sigue activo hasta completar la tienda", setup.setupMode);

    // ── 5. Tienda completa ⇒ puede abrir ────────────────────────────────────
    console.log("\n5. Tienda completa (logo + portada + horarios + dirección + producto):");
    merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
            image: "https://r2.test/logo.webp",
            banner: "https://r2.test/banner.webp",
            scheduleJson: JSON.stringify({ mon: [["09:00", "18:00"]] }),
            address: "San Martín 123, Ushuaia",
            latitude: -54.8,
            longitude: -68.3,
        },
    });
    await prisma.product.create({
        data: {
            name: "Producto Verify ADP",
            slug: `producto-verify-adp-${Date.now()}`,
            price: 1000,
            costPrice: 800,
            merchantId: merchant.id,
            isActive: true,
        },
    });
    setup = await computeMerchantSetup(merchant);
    check("canOpenStore = true", setup.canOpenStore);
    check("sin pasos faltantes", setup.missingLabels.length === 0, setup.missingLabels.join(", "));
    check("setupMode apagado (dashboard en modo operación)", !setup.setupMode);

    // ── 6. Sin portada ⇒ NO puede abrir (obligatoriedad nueva) ──────────────
    console.log("\n6. Se saca la portada:");
    merchant = await prisma.merchant.update({ where: { id: merchant.id }, data: { banner: null } });
    setup = await computeMerchantSetup(merchant);
    check("canOpenStore = false sin portada", !setup.canOpenStore);
    check("el faltante es exactamente la portada", setup.missingLabels.length === 1 && setup.missingLabels[0] === "Subí tu foto de portada", setup.missingLabels.join(", "));

    // ── 7. Pipeline: cuenta borrada NO aparece en "Rechazados" ──────────────
    console.log("\n7. Pipeline de comercios vs cuenta borrada:");
    const deletedUser = await prisma.user.create({
        data: { email: EMAIL_2, name: "Verify Borrado", password: "x", deletedAt: new Date() },
    });
    const purgedMerchant = await prisma.merchant.create({
        data: {
            name: "Verify Purgado",
            slug: `verify-adp-purgado-${Date.now()}`,
            ownerId: deletedUser.id,
            category: "Kiosco",
            approvalStatus: "REJECTED",
            rejectionReason: "Cuenta eliminada a pedido del titular",
        },
    });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Misma query que /api/admin/pipeline-comercios (columna "rechazados")
    const rejectedRows = await prisma.merchant.findMany({
        where: {
            approvalStatus: "REJECTED",
            updatedAt: { gte: thirtyDaysAgo },
            owner: { deletedAt: null },
        },
        select: { id: true },
    });
    check("el purgado NO aparece entre los rechazados", !rejectedRows.some((m) => m.id === purgedMerchant.id));
    // Control: si el dueño NO estuviera borrado, SÍ aparecería
    await prisma.user.update({ where: { id: deletedUser.id }, data: { deletedAt: null } });
    const rejectedRows2 = await prisma.merchant.findMany({
        where: {
            approvalStatus: "REJECTED",
            updatedAt: { gte: thirtyDaysAgo },
            owner: { deletedAt: null },
        },
        select: { id: true },
    });
    check("control: con dueño vivo sí aparece (el filtro no borra de más)", rejectedRows2.some((m) => m.id === purgedMerchant.id));

    console.log(`\n== Resultado: ${passed} ✓ / ${failed} ✗ ==`);
    if (failed > 0) process.exitCode = 1;
}

main()
    .catch((e) => {
        console.error("Error fatal:", e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await cleanup();
        await prisma.$disconnect();
    });
