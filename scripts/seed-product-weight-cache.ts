/**
 * Seed: ProductWeightCache
 * Rama: feat/peso-volumen-productos
 *
 * Importa el dataset semilla `scripts/seed-data/product-weight-cache.json` a
 * la tabla ProductWeightCache. Pre-launch this fills the cache with ~130
 * productos comunes en Argentina (kioscos, despensas, restaurantes, farmacia,
 * ferretería, hogar, indumentaria, electro). Día 1 los comercios cargan
 * productos típicos y el botón "Sugerir" devuelve match instant + gratis.
 *
 * MODO POR DEFECTO: dry-run. Loguea qué haría pero no toca DB.
 * MODO EJECUCIÓN: pasar `--execute` (sin confirmación interactiva — es seed,
 * no es destructivo, idempotente, podés correrlo varias veces).
 *
 * UPSERT POLICY:
 *   - Si nameHash NO existe → crea entry con source: SEED, confidence: 100.
 *   - Si nameHash YA existe con source: SEED → no toca (idempotente).
 *   - Si nameHash YA existe con source: AI/HEURISTIC/MANUAL → respeta el
 *     existente (no sobrescribe data más fresca con la del seed).
 *
 * Uso:
 *   npx tsx scripts/seed-product-weight-cache.ts            # dry-run
 *   npx tsx scripts/seed-product-weight-cache.ts --execute  # apply
 */

import { PrismaClient } from "@prisma/client";
import { hashProductName } from "../src/lib/product-weight";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const isExecute = process.argv.includes("--execute");

interface SeedEntry {
  name: string;
  weightGrams: number;
  volumeMl: number;
  vehicle: string;
}

interface SeedFile {
  _meta?: Record<string, unknown>;
  entries: SeedEntry[];
}

async function main() {
  const dataPath = path.join(__dirname, "seed-data", "product-weight-cache.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`✖ Dataset no encontrado: ${dataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  const dataset: SeedFile = JSON.parse(raw);

  if (!Array.isArray(dataset.entries) || dataset.entries.length === 0) {
    console.error("✖ Dataset vacío o malformado");
    process.exit(1);
  }

  console.log(`\n${isExecute ? "[EXECUTE]" : "[DRY-RUN]"} Seed ProductWeightCache`);
  console.log(`Dataset: ${dataset.entries.length} entries`);
  console.log("─".repeat(60));

  let created = 0;
  let skipped = 0;
  let conflicts = 0;
  const sample: string[] = [];

  for (const entry of dataset.entries) {
    const nameHash = hashProductName(entry.name);

    // Validación básica
    if (!entry.weightGrams || !entry.volumeMl) {
      console.warn(`  ⚠ Skip "${entry.name}" — peso/volumen inválido`);
      skipped++;
      continue;
    }

    const existing = await prisma.productWeightCache.findUnique({
      where: { nameHash },
    });

    if (existing) {
      if (existing.source === "SEED") {
        skipped++;
        continue; // idempotente
      }
      // Hay entry con source distinto (AI/HEURISTIC/MANUAL) — respetarlo
      conflicts++;
      if (sample.length < 5) {
        sample.push(`  ⚠ Conflict "${entry.name}" — existe con source=${existing.source}, no sobrescribo`);
      }
      continue;
    }

    if (isExecute) {
      await prisma.productWeightCache.create({
        data: {
          nameHash,
          nameSample: entry.name,
          weightGrams: entry.weightGrams,
          volumeMl: entry.volumeMl,
          suggestedVehicle: entry.vehicle || null,
          source: "SEED",
          confidence: 100,
          hitCount: 0,
        },
      });
    }
    created++;
    if (created <= 5) sample.push(`  + "${entry.name}" → ${entry.weightGrams}g, ${entry.volumeMl}ml, ${entry.vehicle}`);
  }

  console.log("\nMuestra:");
  for (const s of sample) console.log(s);

  console.log("─".repeat(60));
  console.log(`Created:   ${created}`);
  console.log(`Skipped:   ${skipped}  (ya existían como SEED)`);
  console.log(`Conflicts: ${conflicts}  (existían con source distinto, no tocados)`);

  if (!isExecute) {
    console.log("\n→ Modo dry-run. Para aplicar: npx tsx scripts/seed-product-weight-cache.ts --execute");
  } else {
    console.log("\n✓ Seed completado.");
  }
}

main()
  .catch((err) => {
    console.error("✖ Error en seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
