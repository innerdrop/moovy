/**
 * Verificación: los tamaños que ve el comercio salen 1:1 de OPS (PackageCategory)
 * Rama: feat/tamanos-producto-desde-ops
 *
 * Corre contra la DB REAL (sin mocks). Chequea que getMerchantSizeOptions()
 * — lo que arma las tarjetas del form del comercio — sea consistente con la
 * tabla PackageCategory que se edita en /ops/configuracion-logistica:
 *
 *   1. Muestra SOLO categorías activas (isActive=true).
 *   2. Respeta el orden de displayOrder.
 *   3. El rango de peso deriva de maxWeightGrams (min = max de la previa).
 *   4. El vehículo mostrado es el MÍNIMO permitido por allowedVehicles.
 *
 * Uso: npx tsx scripts/verify-tamanos-ops.ts
 * Exit 0 = todo consistente. Exit 1 = hay divergencia.
 */

import { prisma } from "../src/lib/prisma";
import { getMerchantSizeOptions } from "../src/lib/product-sizes";
import { normalizeVehicleTypes } from "../src/lib/vehicle-type-mapping";

const RANK: Record<string, number> = { BIKE: 0, MOTO: 1, CAR: 2, TRUCK: 3 };
const LABEL: Record<string, string> = { BIKE: "Bici", MOTO: "Moto", CAR: "Auto", TRUCK: "Camioneta" };

let failures = 0;
function check(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.log(`  ✗ ${msg}`);
    failures++;
  }
}

async function main() {
  console.log("\n=== Verificación tamaños del comercio ↔ OPS (PackageCategory) ===\n");

  const cats = await prisma.packageCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { name: true, maxWeightGrams: true, allowedVehicles: true, isActive: true, displayOrder: true },
  });

  const options = await getMerchantSizeOptions();

  console.log(`Categorías activas en OPS: ${cats.length}`);
  console.log(`Opciones que ve el comercio: ${options.length}\n`);

  // 1. misma cantidad y mismo orden
  check(options.length === cats.length, "Cantidad de opciones == categorías activas");
  check(
    options.every((o, i) => o.size === cats[i]?.name),
    "El orden coincide con displayOrder de OPS",
  );

  // 2. rango y vehículo derivados de OPS
  let prevMax = 0;
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i];
    const o = options.find((x) => x.size === c.name);
    console.log(`\n[${c.name}] maxWeightGrams=${c.maxWeightGrams} allowedVehicles=${JSON.stringify(c.allowedVehicles)}`);
    if (!o) {
      check(false, `Existe opción para ${c.name}`);
      prevMax = c.maxWeightGrams;
      continue;
    }
    // vehículo mínimo esperado
    const vehicles = normalizeVehicleTypes(c.allowedVehicles).sort((a, b) => RANK[a] - RANK[b]);
    const expectedVeh = vehicles[0] ? LABEL[vehicles[0]] : "—";
    check(o.vehicleLabel === expectedVeh, `Vehículo mínimo = "${expectedVeh}" (form muestra "${o.vehicleLabel}")`);
    // el peso asumido cae dentro del rango [prevMax, max]
    const within = o.assumedWeightGrams >= prevMax && o.assumedWeightGrams <= c.maxWeightGrams;
    check(within, `Peso asumido (${o.assumedWeightGrams}g) dentro del rango [${prevMax}, ${c.maxWeightGrams}]`);
    console.log(`     rango mostrado: "${o.weightRange}"`);
    prevMax = c.maxWeightGrams;
  }

  console.log(`\n${"─".repeat(60)}`);
  if (failures === 0) {
    console.log("✅ TODO CONSISTENTE — el comercio ve exactamente lo de OPS.\n");
  } else {
    console.log(`❌ ${failures} divergencia(s). Revisá arriba.\n`);
  }
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error("Error corriendo la verificación:", err);
  await prisma.$disconnect();
  process.exit(1);
});
