/**
 * MOOVY - Seed Biblia Financiera v3 (Parametros de Lanzamiento)
 *
 * Este script configura TODOS los parametros financieros y operativos
 * en la base de datos para el lanzamiento de Moovy en Ushuaia.
 *
 * Ejecutar: npx tsx scripts/seed-biblia-launch.ts
 *
 * IMPORTANTE: Ejecutar ANTES del deploy a produccion.
 * Cada valor esta justificado segun la Biblia Financiera v3.
 *
 * Fecha de referencia: Abril 2026
 * Nafta super Ushuaia: $1.607/litro (YPF, marzo 2026)
 * Dolar referencia: $1.395 (blue, 8 abril 2026)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACION DE LANZAMIENTO — EDITAR AQUI ANTES DE EJECUTAR
// ═══════════════════════════════════════════════════════════════════

/**
 * Precio nafta super YPF Ushuaia.
 * VERIFICAR el dia del lanzamiento en la estacion mas cercana.
 * Fuente: InfoFueguina 25/03/2026 → $1.607
 */
const FUEL_PRICE_PER_LITER = 1607;

/**
 * Comision merchants mes 1: 0% (30 dias gratis, estrategia adquisicion).
 * RECORDATORIO: Despues del dia 30, cambiar a 8 ejecutando:
 *   npx tsx scripts/seed-biblia-launch.ts --month2
 */
const MERCHANT_COMMISSION_MONTH1 = 0;
const MERCHANT_COMMISSION_NORMAL = 8;

// ═══════════════════════════════════════════════════════════════════

const isMonth2 = process.argv.includes("--month2");

async function seedStoreSettings() {
  console.log("\n📦 [StoreSettings] Configurando parametros de delivery, comisiones, timeouts...");

  const merchantCommission = isMonth2 ? MERCHANT_COMMISSION_NORMAL : MERCHANT_COMMISSION_MONTH1;

  const data = {
    // ── Delivery (Biblia v3) ──────────────────────────────────────
    fuelPricePerLiter: FUEL_PRICE_PER_LITER,       // Nafta super Ushuaia abril 2026
    fuelConsumptionPerKm: 0.06,                     // Consumo moto 110-150cc en ciudad
    baseDeliveryFee: 1500,                          // Minimo moto segun Biblia v3 ($1.500)
    maintenanceFactor: 1.35,                        // 35% desgaste + ganancia base
    maxDeliveryDistance: 15,                         // 15km cubre toda Ushuaia
    freeDeliveryMinimum: null,                      // Sin delivery gratis al lanzar
    riderCommissionPercent: 80,                     // Repartidor: 80% del costo viaje
    operationalCostPercent: 5,                      // 5% subtotal (MP 3.81% + margen 1.19%)

    // Zonas (Biblia v3) — DEPRECADO desde rama feat/zonas-delivery-multiplicador.
    // La fuente de verdad ahora es la tabla DeliveryZone con polígonos editables
    // desde /ops/zonas-delivery. Estos valores quedan como fallback del simulador
    // en /ops/config-biblia y NO afectan el cobro real al cliente.
    // Para sembrar las 3 zonas A/B/C reales con polígonos:
    //   npx tsx scripts/seed-delivery-zones.ts
    //   npx tsx scripts/apply-default-zone-polygons.ts
    zoneMultipliersJson: JSON.stringify({
      ZONA_A: 1.0,     // legacy
      ZONA_B: 1.15,    // legacy
      ZONA_C: 1.35,    // legacy
    }),

    // Clima (Biblia v3) — se cambia manualmente segun el dia
    climateMultipliersJson: JSON.stringify({
      normal: 1.0,            // Dia normal
      lluvia_leve: 1.15,      // Llovizna, nieve ligera
      temporal_fuerte: 1.30,  // Temporal, nevada fuerte, hielo
    }),
    activeClimateCondition: "normal",

    // ── Comisiones ────────────────────────────────────────────────
    defaultMerchantCommission: merchantCommission,  // 0% mes 1, 8% mes 2+
    defaultSellerCommission: 12,                    // Marketplace sellers: 12% desde dia 1

    // ── Protocolo Efectivo (Biblia v3) ────────────────────────────
    cashMpOnlyDeliveries: 10,     // Primeras 10 entregas: solo MP
    cashLimitL1: 15000,           // 10-30 entregas: limite $15K
    cashLimitL2: 25000,           // 30-60 entregas: limite $25K
    cashLimitL3: 40000,           // 60+ entregas: limite $40K

    // ── Delivery Programado ───────────────────────────────────────
    maxOrdersPerSlot: 15,         // Max pedidos por slot (evaluar bajar a 10 si pocos drivers)
    slotDurationMinutes: 120,     // Slots de 2 horas
    minAnticipationHours: 1.5,    // Minimo 1.5h de anticipacion
    maxAnticipationHours: 48,     // Maximo 48h de anticipacion
    operatingHoursStart: "09:00", // Apertura operaciones
    operatingHoursEnd: "22:00",   // Cierre operaciones

    // ── Timeouts ──────────────────────────────────────────────────
    merchantConfirmTimeoutSec: 300,  // 5 min para que el comercio confirme
    driverResponseTimeoutSec: 60,    // 1 min para que el repartidor acepte

    // ── Publicidad (Biblia v3 - 4 paquetes) ──────────────────────
    // NOTA: Se activa en Fase 2 (5+ comercios activos)
    adPriceProducto: 25000,        // VISIBLE: $25K/mes
    adPriceDestacado: 50000,       // DESTACADO: $50K/mes (corregido de $95K)
    adPricePremium: 100000,        // PREMIUM: $100K/mes (corregido de $55K)
    adPricePlatino: 150000,        // LANZAMIENTO ESPECIAL: $150K/mes
    adPriceHeroBanner: 250000,     // Mantener por si se usa como espacio adicional
    adPriceBannerPromo: 180000,    // Mantener por si se usa como espacio adicional
    adLaunchDiscountPercent: 50,   // 50% descuento para primeros anunciantes
    adMaxHeroBannerSlots: 3,
    adMaxDestacadosSlots: 8,
    adMaxProductosSlots: 12,
    adMinDurationDays: 7,
    adDiscount3Months: 10,         // 10% descuento por 3 meses
    adDiscount6Months: 20,         // 20% descuento por 6 meses
    adPaymentMethods: JSON.stringify(["mercadopago", "transferencia"]),
    adCancellation48hFullRefund: true,
    adCancellationAdminFeePercent: 10,

    // ── Datos bancarios ───────────────────────────────────────────
    // MAURO: Completar estos campos con los datos reales de la cuenta de Moovy
    // bankName: "",
    // bankAccountHolder: "",
    // bankCbu: "",
    // bankAlias: "",
    // bankCuit: "",
  };

  await prisma.storeSettings.upsert({
    where: { id: "settings" },
    update: data,
    create: { id: "settings", ...data },
  });

  console.log("   ✅ StoreSettings configurado");
  console.log(`   → Comision merchants: ${merchantCommission}% ${isMonth2 ? "(mes 2+ normal)" : "(mes 1 gratis)"}`);
  console.log(`   → Nafta: $${FUEL_PRICE_PER_LITER}/litro`);
  console.log(`   → Base delivery fee: $1.500 (moto)`);
  console.log(`   → Publicidad: VISIBLE $25K, DESTACADO $50K, PREMIUM $100K, LANZAMIENTO $150K`);
}

async function seedPointsConfig() {
  console.log("\n🎯 [PointsConfig] Configurando Puntos MOOVER...");

  const data = {
    // Biblia v3: 10 pts por $1.000 (0.01 pts/$1)
    pointsPerDollar: 0.01,
    minPurchaseForPoints: 0,        // Sin minimo para ganar puntos
    pointsValue: 1,                 // 1 punto = $1 ARS
    minPointsToRedeem: 500,         // Minimo 500 pts para canjear ($500)
    maxDiscountPercent: 20,         // Max 20% del subtotal con puntos
    signupBonus: 1000,              // 1.000 pts bienvenida (boost mes 1: se duplica)
    referralBonus: 1000,            // 1.000 pts para quien refiere
    refereeBonus: 500,              // 500 pts para el referido
    reviewBonus: 25,                // 25 pts por resena
    minPurchaseForBonus: 5000,      // $5K min 1ra compra para activar bonus
    minReferralPurchase: 8000,      // $8K min para que cuente la referencia
    tierWindowDays: 90,             // Ventana 90 dias para niveles
    tierConfigJson: JSON.stringify({
      // Niveles por pedidos DELIVERED en 90 dias
      levels: [
        { name: "MOOVER", minOrders: 0,  earnMultiplier: 1.0,  ptsPerThousand: 10 },
        { name: "SILVER", minOrders: 5,  earnMultiplier: 1.25, ptsPerThousand: 12.5 },
        { name: "GOLD",   minOrders: 15, earnMultiplier: 1.5,  ptsPerThousand: 15 },
        { name: "BLACK",  minOrders: 40, earnMultiplier: 2.0,  ptsPerThousand: 20 },
      ],
      // Expiracion: 6 meses sin pedidos
      expirationMonthsInactive: 6,
      // Boost lanzamiento: duplicar puntos 30 dias
      launchBoostEnabled: true,
      launchBoostMultiplier: 2.0,
      launchBoostDays: 30,
    }),
  };

  await prisma.pointsConfig.upsert({
    where: { id: "points_config" },
    update: data,
    create: { id: "points_config", ...data },
  });

  console.log("   ✅ PointsConfig configurado");
  console.log("   → Earn rate base: 10 pts/$1.000 (~1% cashback)");
  console.log("   → Signup bonus: 1.000 pts | Referral: 1.000 + 500 pts");
  console.log("   → Boost lanzamiento: ACTIVO (puntos x2 por 30 dias)");
}

async function seedMerchantLoyaltyTiers() {
  console.log("\n🏆 [MerchantLoyaltyConfig] Configurando tiers de fidelizacion...");

  const tiers = [
    {
      tier: "BRONCE",
      minOrdersPerMonth: 0,
      commissionRate: 8,
      badgeText: "Comercio Verificado",
      badgeColor: "gray",
      benefitsJson: JSON.stringify([
        "Comision estandar 8%",
        "Soporte prioritario",
        "Panel de estadisticas basico",
      ]),
      displayOrder: 1,
    },
    {
      tier: "PLATA",
      minOrdersPerMonth: 10,
      commissionRate: 7,
      badgeText: "Comercio Destacado",
      badgeColor: "blue",
      benefitsJson: JSON.stringify([
        "Comision reducida 7%",
        "Badge visible en la tienda",
        "Prioridad en busqueda",
        "Reporte semanal de ventas",
      ]),
      displayOrder: 2,
    },
    {
      tier: "ORO",
      minOrdersPerMonth: 25,
      commissionRate: 6,
      badgeText: "Comercio Popular",
      badgeColor: "yellow",
      benefitsJson: JSON.stringify([
        "Comision reducida 6%",
        "Badge dorado visible",
        "Posicion destacada en home",
        "Soporte VIP",
        "1 push notification gratis/mes",
      ]),
      displayOrder: 3,
    },
    {
      tier: "DIAMANTE",
      minOrdersPerMonth: 50,
      commissionRate: 5,
      badgeText: "Comercio Elite",
      badgeColor: "purple",
      benefitsJson: JSON.stringify([
        "Comision minima 5%",
        "Badge diamante exclusivo",
        "Posicion #1 en su categoria",
        "Soporte dedicado",
        "2 push notifications gratis/mes",
        "Acceso anticipado a nuevas funciones",
      ]),
      displayOrder: 4,
    },
  ];

  for (const tier of tiers) {
    await prisma.merchantLoyaltyConfig.upsert({
      where: { tier: tier.tier },
      update: tier,
      create: tier,
    });
    console.log(`   ✅ ${tier.tier}: ${tier.commissionRate}% comision (${tier.minOrdersPerMonth}+ pedidos/mes)`);
  }
}

async function seedMoovyConfig() {
  console.log("\n⚙️  [MoovyConfig] Sincronizando parametros a MoovyConfig (key-value)...");

  const merchantCommission = isMonth2 ? MERCHANT_COMMISSION_NORMAL : MERCHANT_COMMISSION_MONTH1;

  const configs: { key: string; value: string; description: string }[] = [
    // Timeouts (usados por assignment-engine y crons)
    {
      key: "merchant_confirm_timeout_seconds",
      value: "300",
      description: "Timeout para que el comercio confirme un pedido (5 min)",
    },
    {
      key: "driver_response_timeout_seconds",
      value: "60",
      description: "Timeout para que el repartidor acepte un pedido (1 min)",
    },
    // Comisiones (sync desde Biblia)
    {
      key: "seller_commission_pct",
      value: "12",
      description: "Comision marketplace sellers (12%)",
    },
    {
      key: "driver_commission_pct",
      value: "20",
      description: "Porcentaje Moovy del viaje (100% - 80% rider = 20%)",
    },
    {
      key: "merchant_commission_pct",
      value: String(merchantCommission),
      description: `Comision merchants ${isMonth2 ? "(8% normal)" : "(0% mes 1 lanzamiento)"}`,
    },
    // Referencia de mercado
    {
      key: "fuel_price_reference",
      value: String(FUEL_PRICE_PER_LITER),
      description: "Precio nafta super YPF Ushuaia - referencia para delivery fee",
    },
    {
      key: "usd_ars_reference",
      value: "1395",
      description: "Cotizacion dolar referencia (blue 8/4/2026)",
    },
    // Operaciones
    {
      key: "max_delivery_radius_km",
      value: "15",
      description: "Radio maximo de entrega en km",
    },
    {
      key: "mp_fee_percent",
      value: "3.81",
      description: "Comision real MercadoPago (3.15% + IVA 21%)",
    },
    // Launch flags
    {
      key: "launch_boost_active",
      value: "true",
      description: "Boost lanzamiento: puntos x2 durante 30 dias",
    },
    {
      key: "launch_boost_start_date",
      value: new Date().toISOString().split("T")[0],
      description: "Fecha inicio del boost de lanzamiento",
    },
    {
      key: "merchant_free_month_active",
      value: isMonth2 ? "false" : "true",
      description: "Mes gratis para merchants (0% comision)",
    },
    {
      key: "merchant_free_month_start_date",
      value: new Date().toISOString().split("T")[0],
      description: "Fecha inicio del mes gratis merchants",
    },
  ];

  for (const config of configs) {
    await prisma.moovyConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
  }

  console.log(`   ✅ ${configs.length} parametros sincronizados a MoovyConfig`);
}

async function printSummary() {
  const merchantCommission = isMonth2 ? MERCHANT_COMMISSION_NORMAL : MERCHANT_COMMISSION_MONTH1;

  console.log("\n" + "═".repeat(60));
  console.log("  MOOVY — PARAMETROS DE LANZAMIENTO CONFIGURADOS");
  console.log("═".repeat(60));
  console.log("");
  console.log(`  Modo: ${isMonth2 ? "MES 2+ (comisiones normales)" : "MES 1 LANZAMIENTO (comision 0%)"}`);
  console.log(`  Fecha: ${new Date().toLocaleDateString("es-AR")}`);
  console.log("");
  console.log("  DELIVERY");
  console.log(`    Nafta super:        $${FUEL_PRICE_PER_LITER}/litro`);
  console.log(`    Base fee (moto):    $1.500`);
  console.log(`    Factor ida/vuelta:  x2.2`);
  console.log(`    Mantenimiento:      x1.35`);
  console.log(`    Operativo:          5% del subtotal`);
  console.log(`    Rider:              80% del viaje`);
  console.log("");
  console.log("  COMISIONES");
  console.log(`    Merchants:          ${merchantCommission}%`);
  console.log(`    Sellers:            12%`);
  console.log(`    Tiers:              BRONCE 8% → PLATA 7% → ORO 6% → DIAMANTE 5%`);
  console.log("");
  console.log("  PUNTOS MOOVER");
  console.log(`    Base:               10 pts/$1.000`);
  console.log(`    Signup bonus:       1.000 pts`);
  console.log(`    Boost lanzamiento:  ACTIVO (x2 por 30 dias)`);
  console.log(`    Niveles:            MOOVER → SILVER → GOLD → BLACK`);
  console.log("");
  console.log("  PROTOCOLO EFECTIVO");
  console.log(`    Solo MP:            primeras 10 entregas`);
  console.log(`    Limites:            $15K → $25K → $40K`);
  console.log("");

  if (!isMonth2) {
    console.log("  ⚠️  RECORDATORIOS POST-LANZAMIENTO:");
    console.log("    • Dia 30: ejecutar con --month2 para activar comision 8%");
    console.log("    • Dia 31: verificar que boost de puntos se desactive");
    console.log("    • Fase 2 (5+ comercios): activar seccion publicidad");
    console.log("    • Verificar precio nafta si cambia y re-ejecutar");
    console.log("");
  }

  console.log("  ⚠️  DATOS BANCARIOS:");
  console.log("    Los datos bancarios (CBU, alias, CUIT) NO se configuran");
  console.log("    desde este script por seguridad. Completar manualmente");
  console.log("    desde Panel OPS > Biblia Financiera > Datos Bancarios.");
  console.log("");
  console.log("═".repeat(60));
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀 MOOVY — Seed Biblia Financiera v3");
  console.log(`   Modo: ${isMonth2 ? "--month2 (comisiones normales)" : "LANZAMIENTO (mes 1, comision 0%)"}`);

  try {
    await seedStoreSettings();
    await seedPointsConfig();
    await seedMerchantLoyaltyTiers();
    await seedMoovyConfig();
    await printSummary();

    console.log("✅ Todos los parametros fueron configurados exitosamente.\n");
  } catch (error) {
    console.error("\n❌ ERROR al configurar parametros:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
