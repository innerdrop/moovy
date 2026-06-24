/**
 * Backfill: cifrar at-rest el mpAccessToken/mpRefreshToken de Merchants y
 * SellerProfiles que ya estén cargados en TEXTO PLANO.
 * Rama: fix/cifrar-tokens-mp
 *
 * Uso:
 *   npx tsx scripts/backfill-encrypt-mp-tokens.ts            (dry-run, no escribe)
 *   npx tsx scripts/backfill-encrypt-mp-tokens.ts --execute  (aplica)
 *
 * ORDEN OBLIGATORIO: deployar el código PRIMERO (que ya descifra al leer), DESPUÉS
 * correr este backfill. decrypt es backward-compatible con texto plano, así que el
 * sistema tolera la mezcla mientras corre (cero downtime).
 *
 * Idempotente: encryptIfNeeded NO re-cifra lo ya cifrado. Solo toca tokens en plano.
 */

import { prisma } from "../src/lib/prisma";
import { encryptMerchantData, encryptSellerData } from "../src/lib/fiscal-crypto";
import { isEncrypted } from "../src/lib/encryption";

const EXECUTE = process.argv.includes("--execute");

async function main() {
    console.log(`\n=== Backfill cifrado tokens MP (Merchant + SellerProfile) ===`);
    console.log(EXECUTE ? "MODO: --execute (escribe en la DB)\n" : "MODO: dry-run (no escribe; usá --execute para aplicar)\n");

    // ── Merchants ──────────────────────────────────────────────────────────
    const merchants = await prisma.merchant.findMany({
        where: { OR: [{ mpAccessToken: { not: null } }, { mpRefreshToken: { not: null } }] },
        select: { id: true, mpAccessToken: true, mpRefreshToken: true },
    });
    let mPlano = 0, mActualizados = 0;
    for (const m of merchants) {
        const accessPlano = m.mpAccessToken && !isEncrypted(m.mpAccessToken);
        const refreshPlano = m.mpRefreshToken && !isEncrypted(m.mpRefreshToken);
        if (!accessPlano && !refreshPlano) continue;
        mPlano++;
        console.log(`  Merchant ${m.id}: token(s) en plano → cifrar`);
        if (EXECUTE) {
            const enc = encryptMerchantData({ mpAccessToken: m.mpAccessToken, mpRefreshToken: m.mpRefreshToken });
            await prisma.merchant.update({
                where: { id: m.id },
                data: { mpAccessToken: enc.mpAccessToken, mpRefreshToken: enc.mpRefreshToken },
            });
            mActualizados++;
        }
    }

    // ── Sellers ────────────────────────────────────────────────────────────
    const sellers = await prisma.sellerProfile.findMany({
        where: { OR: [{ mpAccessToken: { not: null } }, { mpRefreshToken: { not: null } }] },
        select: { id: true, mpAccessToken: true, mpRefreshToken: true },
    });
    let sPlano = 0, sActualizados = 0;
    for (const s of sellers) {
        const accessPlano = s.mpAccessToken && !isEncrypted(s.mpAccessToken);
        const refreshPlano = s.mpRefreshToken && !isEncrypted(s.mpRefreshToken);
        if (!accessPlano && !refreshPlano) continue;
        sPlano++;
        console.log(`  Seller ${s.id}: token(s) en plano → cifrar`);
        if (EXECUTE) {
            const enc = encryptSellerData({ mpAccessToken: s.mpAccessToken, mpRefreshToken: s.mpRefreshToken });
            await prisma.sellerProfile.update({
                where: { id: s.id },
                data: { mpAccessToken: enc.mpAccessToken, mpRefreshToken: enc.mpRefreshToken },
            });
            sActualizados++;
        }
    }

    console.log(`\nResumen:`);
    console.log(`  Merchants con token: ${merchants.length} | en plano: ${mPlano}${EXECUTE ? ` | cifrados: ${mActualizados}` : ""}`);
    console.log(`  Sellers con token:   ${sellers.length} | en plano: ${sPlano}${EXECUTE ? ` | cifrados: ${sActualizados}` : ""}`);
    if (EXECUTE) {
        console.log(`\n✅ Backfill aplicado. Idempotente: re-correrlo es seguro.`);
    } else {
        console.log(`\n(dry-run) Nada se escribió. Para aplicar: npx tsx scripts/backfill-encrypt-mp-tokens.ts --execute`);
    }
}

main()
    .catch((e) => {
        console.error("Error en el backfill:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
