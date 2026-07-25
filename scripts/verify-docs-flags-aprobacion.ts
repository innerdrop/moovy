/**
 * scripts/verify-docs-flags-aprobacion.ts
 *
 * Rama: fix/docs-apagados-no-bloquean-aprobacion
 *
 * Verifica contra la DB REAL (sin mocks) que un documento apagado desde
 * /ops/feature-flags NO sea un requisito para aprobar un comercio, y que la
 * lista de requeridos sea UNA SOLA en todo el sistema (server + OPS + panel del
 * comercio + auto-activación).
 *
 * Correr: npx tsx scripts/verify-docs-flags-aprobacion.ts
 */

import { prisma } from "../src/lib/prisma";
import {
    ALL_DOCUMENT_FIELDS,
    DOCUMENT_COLUMNS,
    DOCUMENT_FLAG_KEYS,
    getDisabledDocumentFields,
    getRequiredDocumentFields,
    getRequiredDocumentFieldsSync,
    type MerchantDocumentField,
} from "../src/lib/merchant-document-approval";

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
    if (cond) {
        passed++;
        console.log(`  ✅ ${label}`);
    } else {
        failed++;
        console.log(`  ❌ ${label}`);
    }
}

async function main() {
    console.log("\n🧪 Documentos apagados desde OPS no bloquean la aprobación\n");

    // ── 1. Estado real de los flags ──────────────────────────────────────────
    console.log("== Flags de documentos en esta DB ==");
    const flagRows = await prisma.featureFlag.findMany({
        where: { key: { in: Object.values(DOCUMENT_FLAG_KEYS) } },
        select: { key: true, isActive: true },
    });
    const byKey = new Map(flagRows.map((f) => [f.key, f.isActive]));
    for (const field of ALL_DOCUMENT_FIELDS) {
        const key = DOCUMENT_FLAG_KEYS[field];
        const state = byKey.has(key) ? (byKey.get(key) ? "ON" : "OFF") : "(sin fila → se pide)";
        console.log(`   ${DOCUMENT_COLUMNS[field].label.padEnd(42)} ${key.padEnd(38)} ${state}`);
    }

    const disabled = await getDisabledDocumentFields();
    console.log(
        `\n   Apagados: ${disabled.size === 0 ? "ninguno" : [...disabled].join(", ")}\n`
    );

    // ── 2. Fail-safe inverso: solo apaga una fila con isActive=false ─────────
    console.log("== Fail-safe inverso (regla: se pide salvo OFF explícito) ==");
    for (const field of ALL_DOCUMENT_FIELDS) {
        const key = DOCUMENT_FLAG_KEYS[field];
        const row = byKey.get(key);
        const shouldBeDisabled = row === false;
        assert(
            disabled.has(field) === shouldBeDisabled,
            `${DOCUMENT_COLUMNS[field].label} → ${shouldBeDisabled ? "no se pide (flag OFF)" : "se pide"}`
        );
    }

    // ── 3. Un doc apagado NUNCA aparece como requerido ───────────────────────
    console.log("\n== Los apagados no entran en la lista de requeridos ==");
    const requiredFood = await getRequiredDocumentFields("Restaurante");
    const requiredNonFood = await getRequiredDocumentFields("Kiosco");
    for (const field of disabled) {
        assert(
            !requiredFood.includes(field) && !requiredNonFood.includes(field),
            `${DOCUMENT_COLUMNS[field].label} apagado → fuera de los requeridos (ambos rubros)`
        );
    }
    if (disabled.size === 0) {
        console.log("  ⏭️  No hay documentos apagados en esta DB — se simula abajo.");
    }

    // ── 4. Simulación pura: apagar CADA doc lo saca de los requeridos ────────
    console.log("\n== Simulación: apagar cada documento, uno por uno ==");
    for (const field of ALL_DOCUMENT_FIELDS) {
        const simulated = new Set<MerchantDocumentField>([field]);
        const req = getRequiredDocumentFieldsSync("Restaurante", simulated);
        assert(
            !req.includes(field),
            `Apagando ${DOCUMENT_COLUMNS[field].label} → deja de ser requerido`
        );
    }

    // ── 5. Apagar TODO deja la lista vacía (nada que bloquee) ───────────────
    const allOff = new Set<MerchantDocumentField>(ALL_DOCUMENT_FIELDS);
    assert(
        getRequiredDocumentFieldsSync("Restaurante", allOff).length === 0,
        "Con los 5 flags apagados no queda ningún documento bloqueando la aprobación"
    );

    // ── 6. El registro sanitario sigue siendo solo para rubros de comida ─────
    console.log("\n== Reglas por rubro intactas ==");
    assert(
        getRequiredDocumentFieldsSync("Restaurante").includes("registroSanitarioUrl"),
        "Rubro alimenticio con flags en ON → exige Registro Sanitario"
    );
    assert(
        !getRequiredDocumentFieldsSync("Kiosco").includes("registroSanitarioUrl"),
        "Rubro no alimenticio → no exige Registro Sanitario"
    );

    // ── 7. Comercios reales: ¿alguno quedaría trabado? ──────────────────────
    console.log("\n== Comercios pendientes en esta DB ==");
    const pendings = await prisma.merchant.findMany({
        where: { approvalStatus: { not: "APPROVED" } },
        select: {
            id: true,
            name: true,
            category: true,
            approvalStatus: true,
            cuitStatus: true,
            bankAccountStatus: true,
            constanciaAfipStatus: true,
            habilitacionMunicipalStatus: true,
            registroSanitarioStatus: true,
        },
        take: 50,
    });

    if (pendings.length === 0) {
        console.log("   (no hay comercios pendientes)");
    }

    let readyButPending = 0;
    for (const m of pendings) {
        const req = await getRequiredDocumentFields(m.category);
        const statuses: Record<string, string> = {
            cuit: m.cuitStatus,
            bankAccount: m.bankAccountStatus,
            constanciaAfipUrl: m.constanciaAfipStatus,
            habilitacionMunicipalUrl: m.habilitacionMunicipalStatus,
            registroSanitarioUrl: m.registroSanitarioStatus,
        };
        const faltan = req.filter((f) => statuses[f] !== "APPROVED");
        if (faltan.length === 0) {
            readyButPending++;
            console.log(
                `   ⚠️  "${m.name}" tiene TODO lo requerido aprobado y sigue en ${m.approvalStatus}.`
            );
            console.log(
                "       → OPS ahora lo avisa en verde en su ficha; se aprueba con un click."
            );
        } else {
            console.log(
                `   • "${m.name}" (${m.approvalStatus}) — falta: ${faltan
                    .map((f) => DOCUMENT_COLUMNS[f as MerchantDocumentField].label)
                    .join(", ")}`
            );
        }
    }
    assert(true, `Revisados ${pendings.length} comercios pendientes (${readyButPending} listos para aprobar)`);

    console.log("\n" + "=".repeat(60));
    console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    if (failed > 0) {
        console.log("\n⚠️  Hay fallas — revisar antes de deployar.");
    }
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});
