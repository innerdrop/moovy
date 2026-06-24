/**
 * Backfill: cifrar at-rest el bankCbu/bankAlias de los repartidores que ya estén
 * cargados en TEXTO PLANO.
 * Rama: fix/cifrar-datos-bancarios-driver
 *
 * Uso:
 *   npx tsx scripts/backfill-encrypt-driver-bank.ts            (dry-run, no escribe)
 *   npx tsx scripts/backfill-encrypt-driver-bank.ts --execute  (aplica)
 *
 * Seguro e idempotente:
 *   - encryptDriverData usa encryptIfNeeded → NO re-cifra lo que ya está cifrado.
 *   - decrypt es backward-compatible con texto plano, así que el código tolera
 *     mezcla mientras corre el backfill (cero downtime).
 *   - Solo toca filas con bankCbu o bankAlias en texto plano (isEncrypted === false).
 */

import { prisma } from "../src/lib/prisma";
import { encryptDriverData } from "../src/lib/fiscal-crypto";
import { isEncrypted } from "../src/lib/encryption";

const EXECUTE = process.argv.includes("--execute");

async function main() {
    console.log(`\n=== Backfill cifrado bankCbu/bankAlias de repartidores ===`);
    console.log(EXECUTE ? "MODO: --execute (escribe en la DB)\n" : "MODO: dry-run (no escribe; usá --execute para aplicar)\n");

    const drivers = await prisma.driver.findMany({
        where: { OR: [{ bankCbu: { not: null } }, { bankAlias: { not: null } }] },
        select: { id: true, bankCbu: true, bankAlias: true },
    });

    let yaCifrados = 0;
    let aCifrar = 0;
    let actualizados = 0;

    for (const d of drivers) {
        const cbuPlano = d.bankCbu && !isEncrypted(d.bankCbu);
        const aliasPlano = d.bankAlias && !isEncrypted(d.bankAlias);

        if (!cbuPlano && !aliasPlano) {
            yaCifrados++;
            continue;
        }

        aCifrar++;
        console.log(
            `  Driver ${d.id}: ${cbuPlano ? "CBU plano" : ""}${cbuPlano && aliasPlano ? " + " : ""}${aliasPlano ? "Alias plano" : ""} → cifrar`
        );

        if (EXECUTE) {
            // encryptDriverData solo cifra los campos string no-nulos no-cifrados.
            const enc = encryptDriverData({ bankCbu: d.bankCbu, bankAlias: d.bankAlias });
            await prisma.driver.update({
                where: { id: d.id },
                data: { bankCbu: enc.bankCbu, bankAlias: enc.bankAlias },
            });
            actualizados++;
        }
    }

    console.log(`\nResumen:`);
    console.log(`  Repartidores con datos bancarios: ${drivers.length}`);
    console.log(`  Ya cifrados (se saltean):         ${yaCifrados}`);
    console.log(`  A cifrar (texto plano):           ${aCifrar}`);
    if (EXECUTE) {
        console.log(`  Actualizados:                     ${actualizados}`);
        console.log(`\n✅ Backfill aplicado. Es idempotente: podés re-correrlo sin riesgo.`);
    } else {
        console.log(`\n(dry-run) Nada se escribió. Para aplicar: npx tsx scripts/backfill-encrypt-driver-bank.ts --execute`);
    }
}

main()
    .catch((e) => {
        console.error("Error en el backfill:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
