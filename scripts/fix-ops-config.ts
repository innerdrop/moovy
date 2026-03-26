/**
 * fix-ops-config.ts — Corrige problemas detectados por validate-ops-config.ts
 *
 * Acciones:
 * 1. Crea PointsConfig si no existe (con defaults del schema)
 * 2. Crea MoovyConfig keys faltantes (assignment_rating_radius_meters)
 * 3. Sincroniza timeouts StoreSettings → MoovyConfig
 * 4. Crea Loyalty Tiers si no existen (BRONCE/PLATA/ORO/DIAMANTE)
 * 5. Re-ejecuta las validaciones para confirmar que todo quedó OK
 *
 * Uso: npx tsx scripts/fix-ops-config.ts
 * Requiere: DATABASE_URL configurada
 *
 * Consolidado: 2026-03-26
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let fixCount = 0;
let skipCount = 0;

function fixed(msg: string) {
  fixCount++;
  console.log(`  🔧 CORREGIDO: ${msg}`);
}

function skipped(msg: string) {
  skipCount++;
  console.log(`  ✓ OK: ${msg}`);
}

// ─── Fix 1: PointsConfig ────────────────────────────────────────────────────

async function fixPointsConfig() {
  console.log("\n── 1. PointsConfig ────────────────────────────────────────");

  const existing = await prisma.pointsConfig.findUnique({
    where: { id: "points_config" },
  });

  if (existing) {
    skipped(`PointsConfig ya existe (pointsPerDollar: ${existing.pointsPerDollar}, signupBonus: ${existing.signupBonus})`);
    return;
  }

  await prisma.pointsConfig.create({
    data: {
      id: "points_config",
      pointsPerDollar: 1,
      minPurchaseForPoints: 0,
      pointsValue: 0.01,
      minPointsToRedeem: 100,
      maxDiscountPercent: 50,
      signupBonus: 100,
      referralBonus: 200,
      reviewBonus: 10,
      refereeBonus: 100,
      minPurchaseForBonus: 5000,
      minReferralPurchase: 8000,
      tierWindowDays: 90,
    },
  });

  fixed("PointsConfig creado con defaults: 1pt/$1, $0.01/pt, max 50%, signup 100pts, referral 200pts");
}

// ─── Fix 2: MoovyConfig keys faltantes ──────────────────────────────────────

async function fixMoovyConfigKeys() {
  console.log("\n── 2. MoovyConfig keys ────────────────────────────────────");

  const requiredKeys: { key: string; value: string; description: string }[] = [
    {
      key: "assignment_rating_radius_meters",
      value: "3000",
      description: "Radio (metros) dentro del cual se priorizan repartidores por rating en el assignment engine",
    },
    {
      key: "max_assignment_attempts",
      value: "5",
      description: "Cantidad máxima de repartidores a los que se ofrece un pedido antes de marcarlo sin repartidor",
    },
    {
      key: "driver_response_timeout_seconds",
      value: "20",
      description: "Segundos que tiene un repartidor para aceptar/rechazar un pedido (synced from Biblia)",
    },
    {
      key: "merchant_confirm_timeout_seconds",
      value: "300",
      description: "Segundos que tiene el comercio para confirmar un pedido (synced from Biblia)",
    },
    {
      key: "max_delivery_distance_km",
      value: "15",
      description: "Distancia máxima en km entre comercio y cliente para aceptar delivery",
    },
    {
      key: "min_order_amount_ars",
      value: "1000",
      description: "Monto mínimo del carrito para poder hacer delivery",
    },
    {
      key: "scheduled_notify_before_minutes",
      value: "30",
      description: "Minutos antes de la hora programada para notificar al repartidor",
    },
    {
      key: "scheduled_cancel_if_no_confirm_minutes",
      value: "30",
      description: "Minutos sin confirmación del comercio antes de cancelar pedido programado",
    },
  ];

  for (const item of requiredKeys) {
    const existing = await prisma.moovyConfig.findUnique({
      where: { key: item.key },
    });

    if (existing) {
      skipped(`${item.key} = ${existing.value}`);
      continue;
    }

    await prisma.moovyConfig.create({
      data: item,
    });

    fixed(`${item.key} = ${item.value} (${item.description})`);
  }
}

// ─── Fix 3: Sincronizar timeouts StoreSettings → MoovyConfig ───────────────

async function fixSyncTimeouts() {
  console.log("\n── 3. Sincronización timeouts ─────────────────────────────");

  const settings = await prisma.storeSettings.findUnique({
    where: { id: "settings" },
  });

  if (!settings) {
    console.log("  ⚠️ StoreSettings no existe, no se puede sincronizar");
    return;
  }

  const s = settings as any;

  const syncPairs: { key: string; storeField: string; storeValue: number | undefined }[] = [
    {
      key: "driver_response_timeout_seconds",
      storeField: "driverResponseTimeoutSec",
      storeValue: s.driverResponseTimeoutSec,
    },
    {
      key: "merchant_confirm_timeout_seconds",
      storeField: "merchantConfirmTimeoutSec",
      storeValue: s.merchantConfirmTimeoutSec,
    },
  ];

  for (const pair of syncPairs) {
    if (pair.storeValue === undefined || pair.storeValue === null) {
      skipped(`${pair.storeField} no definido en StoreSettings, se mantiene MoovyConfig`);
      continue;
    }

    const moovyConfig = await prisma.moovyConfig.findUnique({
      where: { key: pair.key },
    });

    const moovyValue = moovyConfig ? parseFloat(moovyConfig.value) : null;

    if (moovyValue === pair.storeValue) {
      skipped(`${pair.key}: ambos en ${pair.storeValue}s — sincronizado`);
      continue;
    }

    await prisma.moovyConfig.upsert({
      where: { key: pair.key },
      update: { value: String(pair.storeValue) },
      create: {
        key: pair.key,
        value: String(pair.storeValue),
        description: `Synced from Biblia Financiera (${pair.storeField})`,
      },
    });

    fixed(`${pair.key}: MoovyConfig ${moovyValue}s → ${pair.storeValue}s (sincronizado con StoreSettings)`);
  }
}

// ─── Fix 4: Loyalty Tiers ───────────────────────────────────────────────────

async function fixLoyaltyTiers() {
  console.log("\n── 4. Loyalty Tiers ───────────────────────────────────────");

  const existing = await prisma.merchantLoyaltyConfig.findMany();

  if (existing.length > 0) {
    skipped(`${existing.length} tiers ya configurados: ${existing.map((t) => `${t.tier} ${t.commissionRate}%`).join(", ")}`);
    return;
  }

  const tiers = [
    {
      tier: "BRONCE",
      minOrdersPerMonth: 0,
      commissionRate: 8,
      badgeText: "Comercio",
      badgeColor: "gray",
      benefitsJson: JSON.stringify(["Comisión estándar 8%", "Soporte por chat"]),
      displayOrder: 0,
    },
    {
      tier: "PLATA",
      minOrdersPerMonth: 50,
      commissionRate: 7,
      badgeText: "Destacado",
      badgeColor: "blue",
      benefitsJson: JSON.stringify(["Comisión reducida 7%", "Soporte prioritario", "Badge visible para compradores"]),
      displayOrder: 1,
    },
    {
      tier: "ORO",
      minOrdersPerMonth: 150,
      commissionRate: 6,
      badgeText: "Popular",
      badgeColor: "yellow",
      benefitsJson: JSON.stringify(["Comisión reducida 6%", "Soporte VIP", "Posición destacada en búsqueda", "Badge dorado"]),
      displayOrder: 2,
    },
    {
      tier: "DIAMANTE",
      minOrdersPerMonth: 300,
      commissionRate: 5,
      badgeText: "Elite",
      badgeColor: "purple",
      benefitsJson: JSON.stringify(["Comisión mínima 5%", "Account manager dedicado", "Primera posición en categoría", "Badge diamante", "Acceso a analytics avanzados"]),
      displayOrder: 3,
    },
  ];

  for (const tier of tiers) {
    await prisma.merchantLoyaltyConfig.create({ data: tier });
  }

  fixed(`4 tiers creados: BRONCE 8% → PLATA 7% → ORO 6% → DIAMANTE 5%`);
}

// ─── Verify: Re-run validations ─────────────────────────────────────────────

async function verify() {
  console.log("\n══ VERIFICACIÓN POST-FIX ══════════════════════════════════\n");

  let errors = 0;

  // 1. PointsConfig
  const pc = await prisma.pointsConfig.findUnique({ where: { id: "points_config" } });
  if (!pc) {
    console.log("  ❌ PointsConfig sigue sin existir");
    errors++;
  } else if (pc.maxDiscountPercent > 100 || pc.pointsPerDollar < 0) {
    console.log(`  ❌ PointsConfig con valores inválidos: maxDiscount=${pc.maxDiscountPercent}%, ptsPerDollar=${pc.pointsPerDollar}`);
    errors++;
  } else {
    console.log(`  ✅ PointsConfig: ${pc.pointsPerDollar}pt/$1, $${pc.pointsValue}/pt, max ${pc.maxDiscountPercent}%, signup ${pc.signupBonus}pts`);
  }

  // 2. MoovyConfig keys
  const requiredKeys = [
    "max_assignment_attempts",
    "assignment_rating_radius_meters",
    "driver_response_timeout_seconds",
    "merchant_confirm_timeout_seconds",
  ];
  const mc = await prisma.moovyConfig.findMany({ where: { key: { in: requiredKeys } } });
  const foundKeys = mc.map((c) => c.key);
  const missingKeys = requiredKeys.filter((k) => !foundKeys.includes(k));
  if (missingKeys.length > 0) {
    console.log(`  ❌ MoovyConfig keys faltantes: ${missingKeys.join(", ")}`);
    errors++;
  } else {
    console.log(`  ✅ MoovyConfig: ${mc.map((c) => `${c.key}=${c.value}`).join(", ")}`);
  }

  // 3. Sync consistency
  const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
  if (settings) {
    const s = settings as any;
    const driverMoovy = mc.find((c) => c.key === "driver_response_timeout_seconds");
    const merchantMoovy = mc.find((c) => c.key === "merchant_confirm_timeout_seconds");

    const driverOk = !driverMoovy || !s.driverResponseTimeoutSec || parseFloat(driverMoovy.value) === s.driverResponseTimeoutSec;
    const merchantOk = !merchantMoovy || !s.merchantConfirmTimeoutSec || parseFloat(merchantMoovy.value) === s.merchantConfirmTimeoutSec;

    if (!driverOk || !merchantOk) {
      console.log(`  ❌ Timeouts desincronizados`);
      if (!driverOk) console.log(`     driver: MoovyConfig=${driverMoovy?.value}s vs StoreSettings=${s.driverResponseTimeoutSec}s`);
      if (!merchantOk) console.log(`     merchant: MoovyConfig=${merchantMoovy?.value}s vs StoreSettings=${s.merchantConfirmTimeoutSec}s`);
      errors++;
    } else {
      console.log(`  ✅ Timeouts sincronizados (driver=${s.driverResponseTimeoutSec ?? "default"}s, merchant=${s.merchantConfirmTimeoutSec ?? "default"}s)`);
    }
  }

  // 4. Loyalty tiers
  const tiers = await prisma.merchantLoyaltyConfig.findMany({ orderBy: { minOrdersPerMonth: "asc" } });
  if (tiers.length === 0) {
    console.log("  ❌ No hay loyalty tiers configurados");
    errors++;
  } else {
    // Verify ordering: higher tier = lower commission
    let orderOk = true;
    for (let i = 1; i < tiers.length; i++) {
      if (tiers[i].commissionRate > tiers[i - 1].commissionRate) {
        orderOk = false;
        break;
      }
    }
    if (!orderOk) {
      console.log("  ❌ Loyalty tiers con orden de comisiones incorrecto");
      errors++;
    } else {
      console.log(`  ✅ Loyalty tiers: ${tiers.map((t) => `${t.tier} ${t.commissionRate}%`).join(" → ")}`);
    }
  }

  // 5. Financial formula sanity
  if (settings) {
    const s = settings as any;
    const base = s.baseDeliveryFee ?? 500;
    const riderPct = s.riderCommissionPercent ?? 80;
    const opCostPct = s.operationalCostPercent ?? 5;
    const fee = Math.max(base, base * (s.maintenanceFactor ?? 1.2));
    const totalFee = fee + (5000 * opCostPct / 100);
    const riderEarnings = totalFee * (riderPct / 100);
    const moovyEarnings = totalFee - riderEarnings;

    if (totalFee < 0 || riderEarnings < 0 || moovyEarnings < 0) {
      console.log(`  ❌ Fórmula financiera produce valores negativos`);
      errors++;
    } else {
      console.log(`  ✅ Fórmula financiera: fee=$${totalFee.toFixed(0)}, rider=$${riderEarnings.toFixed(0)}, moovy=$${moovyEarnings.toFixed(0)}`);
    }
  }

  return errors;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   MOOVY OPS CONFIG — Fix & Verify Script                ║");
  console.log("║   Corrige configuraciones faltantes y verifica           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  await fixPointsConfig();
  await fixMoovyConfigKeys();
  await fixSyncTimeouts();
  await fixLoyaltyTiers();

  console.log(`\n── Resumen correcciones ────────────────────────────────────`);
  console.log(`  🔧 ${fixCount} correcciones aplicadas`);
  console.log(`  ✓  ${skipCount} ya estaban correctos`);

  const errors = await verify();

  console.log(`\n══════════════════════════════════════════════════════════`);
  if (errors === 0) {
    console.log("✅ TODAS LAS CONFIGURACIONES ESTÁN CORRECTAS");
  } else {
    console.log(`❌ ${errors} error(es) persisten después de las correcciones`);
    console.log("   Revisá manualmente los problemas reportados arriba");
    process.exit(1);
  }
  console.log(`══════════════════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});