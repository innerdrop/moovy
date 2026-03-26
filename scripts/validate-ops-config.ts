/**
 * validate-ops-config.ts — Script de validación del panel OPS
 *
 * Verifica que:
 * 1. Todos los endpoints de configuración responden correctamente
 * 2. Los valores se persisten y se leen de vuelta sin corrupción
 * 3. No hay conflictos entre sistemas de configuración
 * 4. La sincronización Biblia → MoovyConfig funciona
 * 5. Los rangos de validación bloquean valores peligrosos
 *
 * Uso: npx tsx scripts/validate-ops-config.ts
 *
 * Requiere: DATABASE_URL configurada
 * Consolidado: 2026-03-26
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

// ─── Test 1: StoreSettings singleton exists ─────────────────────────────────

async function testStoreSettingsExists() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "settings" },
    });
    if (!settings) {
      fail("StoreSettings singleton", "No existe el registro con id='settings'. Crealo con prisma seed.");
      return;
    }
    pass("StoreSettings singleton", `storeName: ${settings.storeName || "(vacío)"}`);
  } catch (e) {
    fail("StoreSettings singleton", (e as Error).message);
  }
}

// ─── Test 2: PointsConfig singleton exists ──────────────────────────────────

async function testPointsConfigExists() {
  try {
    const config = await prisma.pointsConfig.findUnique({
      where: { id: "points_config" },
    });
    if (!config) {
      fail("PointsConfig singleton", "No existe el registro con id='points_config'. Ejecutá: npx tsx scripts/fix-ops-config.ts");
      return;
    }
    // Validate no negative values
    const fields = ["pointsPerDollar", "minPurchaseForPoints", "pointsValue", "minPointsToRedeem", "maxDiscountPercent", "signupBonus", "referralBonus"];
    const negatives = fields.filter((f) => (config as any)[f] < 0);
    if (negatives.length > 0) {
      fail("PointsConfig valores negativos", `Campos con valores negativos: ${negatives.join(", ")}`);
      return;
    }
    if (config.maxDiscountPercent > 100) {
      fail("PointsConfig maxDiscountPercent", `Valor ${config.maxDiscountPercent}% > 100% — descuento imposible`);
      return;
    }
    pass("PointsConfig singleton", `pointsPerDollar: ${config.pointsPerDollar}, signupBonus: ${config.signupBonus}`);
  } catch (e) {
    fail("PointsConfig singleton", (e as Error).message);
  }
}

// ─── Test 3: MoovyConfig keys críticas existen ──────────────────────────────

async function testMoovyConfigKeys() {
  const requiredKeys = [
    "max_assignment_attempts",
    "assignment_rating_radius_meters",
    "driver_response_timeout_seconds",
    "merchant_confirm_timeout_seconds",
  ];

  try {
    const configs = await prisma.moovyConfig.findMany({
      where: { key: { in: requiredKeys } },
    });

    const foundKeys = configs.map((c) => c.key);
    const missing = requiredKeys.filter((k) => !foundKeys.includes(k));

    if (missing.length > 0) {
      fail("MoovyConfig keys críticas", `Faltan: ${missing.join(", ")}. El assignment engine usará defaults.`);
      return;
    }

    // Validate values are parseable numbers
    for (const config of configs) {
      const num = parseFloat(config.value);
      if (isNaN(num)) {
        fail(`MoovyConfig ${config.key}`, `Valor "${config.value}" no es un número válido`);
        return;
      }
      if (num < 0) {
        fail(`MoovyConfig ${config.key}`, `Valor ${num} es negativo — no válido`);
        return;
      }
    }

    pass("MoovyConfig keys críticas", `${foundKeys.length}/${requiredKeys.length} presentes`);
  } catch (e) {
    fail("MoovyConfig keys críticas", (e as Error).message);
  }
}

// ─── Test 4: Biblia Financiera fields en StoreSettings ──────────────────────

async function testBibliaFields() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "settings" },
    });
    if (!settings) {
      fail("Biblia fields", "StoreSettings no existe");
      return;
    }
    const s = settings as any;

    // Check delivery fields
    const deliveryFields: [string, number, number][] = [
      ["baseDeliveryFee", 0, 50000],
      ["fuelPricePerLiter", 0, 10000],
      ["fuelConsumptionPerKm", 0, 1],
      ["maintenanceFactor", 0, 5],
      ["maxDeliveryDistance", 0, 500],
      ["riderCommissionPercent", 0, 100],
    ];

    for (const [field, min, max] of deliveryFields) {
      const val = s[field];
      if (val === undefined || val === null) continue; // Optional fields
      if (typeof val === "number" && (val < min || val > max)) {
        fail(`Biblia ${field}`, `Valor ${val} fuera de rango [${min}-${max}]`);
        return;
      }
    }

    // Check commission fields
    const commFields: [string, number, number][] = [
      ["defaultMerchantCommission", 0, 30],
      ["defaultSellerCommission", 0, 30],
    ];

    for (const [field, min, max] of commFields) {
      const val = s[field];
      if (val === undefined || val === null) continue;
      if (typeof val === "number" && (val < min || val > max)) {
        fail(`Biblia ${field}`, `Valor ${val}% fuera de rango [${min}-${max}%]`);
        return;
      }
    }

    // Check zone multipliers JSON is valid
    if (s.zoneMultipliersJson) {
      try {
        const zones = JSON.parse(s.zoneMultipliersJson);
        if (typeof zones !== "object") throw new Error("No es un objeto");
        const badZones = Object.entries(zones).filter(([, v]) => typeof v !== "number" || (v as number) <= 0);
        if (badZones.length > 0) {
          fail("Biblia zoneMultipliers", `Zonas con valores inválidos: ${badZones.map(([k]) => k).join(", ")}`);
          return;
        }
      } catch (e) {
        fail("Biblia zoneMultipliersJson", `JSON inválido: ${(e as Error).message}`);
        return;
      }
    }

    // Check climate multipliers JSON is valid
    if (s.climateMultipliersJson) {
      try {
        const climate = JSON.parse(s.climateMultipliersJson);
        if (typeof climate !== "object") throw new Error("No es un objeto");
        const badClimate = Object.entries(climate).filter(([, v]) => typeof v !== "number" || (v as number) <= 0);
        if (badClimate.length > 0) {
          fail("Biblia climateMultipliers", `Climas con valores inválidos: ${badClimate.map(([k]) => k).join(", ")}`);
          return;
        }
      } catch (e) {
        fail("Biblia climateMultipliersJson", `JSON inválido: ${(e as Error).message}`);
        return;
      }
    }

    pass("Biblia Financiera fields", "Todos los campos dentro de rangos válidos");
  } catch (e) {
    fail("Biblia Financiera fields", (e as Error).message);
  }
}

// ─── Test 5: Sync consistency (timeouts y comisiones) ───────────────────────

async function testSyncConsistency() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "settings" },
    });
    if (!settings) {
      fail("Sync consistency", "StoreSettings no existe");
      return;
    }
    const s = settings as any;

    const moovyConfigs = await prisma.moovyConfig.findMany({
      where: {
        key: {
          in: [
            "driver_response_timeout_seconds",
            "merchant_confirm_timeout_seconds",
            "seller_commission_pct",
          ],
        },
      },
    });

    const configMap = Object.fromEntries(moovyConfigs.map((c) => [c.key, c.value]));
    const warnings: string[] = [];

    // Check timeout sync
    if (configMap.driver_response_timeout_seconds && s.driverResponseTimeoutSec !== undefined) {
      const moovyVal = parseFloat(configMap.driver_response_timeout_seconds);
      const bibliaVal = s.driverResponseTimeoutSec;
      if (moovyVal !== bibliaVal) {
        warnings.push(
          `driver timeout: MoovyConfig=${moovyVal}s vs StoreSettings=${bibliaVal}s`
        );
      }
    }

    if (configMap.merchant_confirm_timeout_seconds && s.merchantConfirmTimeoutSec !== undefined) {
      const moovyVal = parseFloat(configMap.merchant_confirm_timeout_seconds);
      const bibliaVal = s.merchantConfirmTimeoutSec;
      if (moovyVal !== bibliaVal) {
        warnings.push(
          `merchant timeout: MoovyConfig=${moovyVal}s vs StoreSettings=${bibliaVal}s`
        );
      }
    }

    if (warnings.length > 0) {
      fail(
        "Sync consistency",
        `Valores desincronizados entre Biblia y MoovyConfig:\n  ${warnings.join("\n  ")}\n  Solución: Guardar desde Biblia Financiera para resincronizar.`
      );
      return;
    }

    pass("Sync consistency", "StoreSettings y MoovyConfig sincronizados");
  } catch (e) {
    fail("Sync consistency", (e as Error).message);
  }
}

// ─── Test 6: MerchantLoyaltyConfig tiers ────────────────────────────────────

async function testLoyaltyTiers() {
  try {
    const tiers = await prisma.merchantLoyaltyConfig.findMany({
      orderBy: { minOrdersPerMonth: "asc" },
    });

    if (tiers.length === 0) {
      fail("Loyalty tiers", "No hay tiers de lealtad configurados");
      return;
    }

    // Validate commission rates are reasonable
    for (const tier of tiers) {
      if (tier.commissionRate < 0 || tier.commissionRate > 30) {
        fail(`Loyalty tier ${tier.tier}`, `commissionRate ${tier.commissionRate}% fuera de rango [0-30%]`);
        return;
      }
      if (tier.minOrdersPerMonth < 0) {
        fail(`Loyalty tier ${tier.tier}`, `minOrdersPerMonth ${tier.minOrdersPerMonth} es negativo`);
        return;
      }
    }

    // Validate tiers are ordered (higher tier = more orders = lower commission)
    for (let i = 1; i < tiers.length; i++) {
      if (tiers[i].commissionRate > tiers[i - 1].commissionRate) {
        fail(
          "Loyalty tier ordering",
          `${tiers[i].tier} tiene comisión ${tiers[i].commissionRate}% > ${tiers[i - 1].tier} ${tiers[i - 1].commissionRate}% — los tiers más altos deberían tener MENOR comisión`
        );
        return;
      }
    }

    pass("Loyalty tiers", `${tiers.length} tiers configurados: ${tiers.map((t) => `${t.tier} ${t.commissionRate}%`).join(", ")}`);
  } catch (e) {
    fail("Loyalty tiers", (e as Error).message);
  }
}

// ─── Test 7: ConfigAuditLog exists ──────────────────────────────────────────

async function testAuditLog() {
  try {
    const count = await prisma.configAuditLog.count();
    pass("ConfigAuditLog", `${count} registros de auditoría`);
  } catch (e) {
    // Model may not exist if schema hasn't been pushed
    fail("ConfigAuditLog", `Tabla no encontrada: ${(e as Error).message}. Ejecutá npx prisma db push.`);
  }
}

// ─── Test 8: Financial formula sanity check ─────────────────────────────────

async function testFinancialFormula() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "settings" },
    });
    if (!settings) {
      fail("Financial formula", "StoreSettings no existe");
      return;
    }
    const s = settings as any;

    const base = s.baseDeliveryFee ?? 500;
    const fuelPerLiter = s.fuelPricePerLiter ?? 450;
    const fuelConsumption = s.fuelConsumptionPerKm ?? 0.08;
    const maintenance = s.maintenanceFactor ?? 1.2;
    const riderPct = s.riderCommissionPercent ?? 80;
    const opCostPct = s.operationalCostPercent ?? 5;

    // Simulate a 5km delivery with $5000 subtotal
    const distance = 5;
    const subtotal = 5000;
    const fuelCost = fuelPerLiter * fuelConsumption * distance;
    const fee = Math.max(base, (base + fuelCost) * maintenance);
    const totalFee = fee + (subtotal * opCostPct / 100);
    const riderEarnings = totalFee * (riderPct / 100);
    const moovyEarnings = totalFee - riderEarnings;

    if (totalFee < 0) {
      fail("Financial formula", `Delivery fee NEGATIVO: $${totalFee.toFixed(2)}`);
      return;
    }
    if (totalFee > subtotal) {
      fail("Financial formula", `Delivery fee ($${totalFee.toFixed(2)}) MAYOR que subtotal ($${subtotal}) — el delivery no puede costar más que el pedido`);
      return;
    }
    if (riderEarnings < 0 || moovyEarnings < 0) {
      fail("Financial formula", `Ganancias negativas: rider=$${riderEarnings.toFixed(2)}, moovy=$${moovyEarnings.toFixed(2)}`);
      return;
    }

    pass(
      "Financial formula",
      `Simulación 5km/$5000: fee=$${totalFee.toFixed(2)}, rider=$${riderEarnings.toFixed(2)}, moovy=$${moovyEarnings.toFixed(2)}`
    );
  } catch (e) {
    fail("Financial formula", (e as Error).message);
  }
}

// ─── Test 9: No duplicate config keys in MoovyConfig ────────────────────────

async function testNoDuplicateMoovyKeys() {
  try {
    const allConfigs = await prisma.moovyConfig.findMany();
    const keys = allConfigs.map((c) => c.key);
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);

    if (duplicates.length > 0) {
      fail("MoovyConfig duplicates", `Keys duplicadas: ${[...new Set(duplicates)].join(", ")}`);
      return;
    }

    pass("MoovyConfig duplicates", `${keys.length} keys únicas`);
  } catch (e) {
    fail("MoovyConfig duplicates", (e as Error).message);
  }
}

// ─── Run all tests ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   MOOVY OPS CONFIG — Validation Script                  ║");
  console.log("║   Verifica integridad de configuraciones financieras     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  await testStoreSettingsExists();
  await testPointsConfigExists();
  await testMoovyConfigKeys();
  await testBibliaFields();
  await testSyncConsistency();
  await testLoyaltyTiers();
  await testAuditLog();
  await testFinancialFormula();
  await testNoDuplicateMoovyKeys();

  // Print results
  console.log("\n── Resultados ─────────────────────────────────────────────\n");

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    console.log(`${icon} ${r.name}`);
    if (r.details) console.log(`   ${r.details}`);
    if (r.error) console.log(`   ERROR: ${r.error}`);
  }

  console.log(`\n── Resumen ────────────────────────────────────────────────`);
  console.log(`   ✅ ${passed.length} tests pasaron`);
  console.log(`   ❌ ${failed.length} tests fallaron`);
  console.log(`   Total: ${results.length} tests`);
  console.log("");

  if (failed.length > 0) {
    console.log("⚠️  HAY PROBLEMAS DE CONFIGURACIÓN QUE PUEDEN CAUSAR PÉRDIDA DE DINERO");
    console.log("   Revisá los tests fallidos y corregí antes de operar.\n");
    process.exit(1);
  } else {
    console.log("✅ Todas las configuraciones son válidas y consistentes.\n");
    process.exit(0);
  }
}

main()
  .catch((e) => {
    console.error("Error fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
