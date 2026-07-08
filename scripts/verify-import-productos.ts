/**
 * Verificación: import de productos del comercio.
 * Rama: feat/import-productos-comercio
 *
 * No escribe data. Chequea:
 *   1. La lógica de barcode (EAN-8/12/13 se conservan; irregulares → vacío) con
 *      casos reales del archivo de Pixel Point.
 *   2. El parseo de precio (formatos AR).
 *   3. Que el campo Product.barcode exista y sea consultable (requiere db push).
 *   4. Cuántos borradores (isActive:false, sin foto) hay por comercio.
 *
 * Uso: npx tsx scripts/verify-import-productos.ts
 */

import { prisma } from "../src/lib/prisma";

// Espejo de la lógica del cliente (src/app/comercios/(protected)/productos/importar/page.tsx)
function isValidBarcode(v: string): boolean {
  const s = v.trim();
  return /^\d{8}$/.test(s) || /^\d{12}$/.test(s) || /^\d{13}$/.test(s);
}
function parsePrice(v: string): number | null {
  if (!v) return null;
  let s = v.trim().replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

let fail = 0;
const check = (c: boolean, m: string) => { console.log(`  ${c ? "✓" : "✗"} ${m}`); if (!c) fail++; };

async function main() {
  console.log("\n=== Verificación import de productos ===\n");

  // 1. Barcodes (casos reales de Pixel Point + irregulares)
  console.log("Barcode:");
  check(isValidBarcode("7790895005794"), "EAN-13 válido se conserva (7790895005794)");
  check(isValidBarcode("77908950"), "EAN-8 válido se conserva (8 dígitos)");
  check(!isValidBarcode("123"), "código interno de 3 dígitos → vacío");
  check(!isValidBarcode("77908"), "código de 5 dígitos → vacío");
  check(!isValidBarcode("abc123"), "no numérico → vacío");

  // 2. Precios
  console.log("\nPrecio:");
  check(parsePrice("8400") === 8400, "'8400' → 8400");
  check(parsePrice("3.978,50") === 3978.5, "'3.978,50' (formato AR) → 3978.5");
  check(parsePrice("22.4") === 22.4, "'22.4' → 22.4");
  check(parsePrice("") === null, "vacío → null");

  // 3. Campo barcode consultable (db push aplicado)
  console.log("\nSchema:");
  try {
    await (prisma as any).product.findFirst({ select: { id: true, barcode: true } });
    check(true, "Product.barcode es consultable (db push aplicado)");
  } catch (e) {
    check(false, "Product.barcode NO existe todavía — corré `prisma db push`");
  }

  // 4. Borradores por comercio (isActive:false sin foto)
  try {
    const drafts = await prisma.product.count({
      where: { merchantId: { not: null }, isActive: false, images: { none: {} } },
    });
    console.log(`\nBorradores incompletos (sin foto) en total: ${drafts}`);
  } catch { /* ignore */ }

  console.log(`\n${"─".repeat(56)}`);
  console.log(fail === 0 ? "✅ Todo OK.\n" : `❌ ${fail} chequeo(s) fallaron.\n`);
  await prisma.$disconnect();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
