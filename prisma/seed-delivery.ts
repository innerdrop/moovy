/**
 * Seed script for delivery & assignment system tables.
 * Run: npx tsx prisma/seed-delivery.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding delivery system...\n");

  // ─── 1. Package Categories ──────────────────────────────────────────────────

  const categories = [
    {
      name: "MICRO",
      maxWeightGrams: 500,
      maxLengthCm: 20,
      maxWidthCm: 15,
      maxHeightCm: 10,
      volumeScore: 1,
      allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"],
      displayOrder: 1,
    },
    {
      name: "SMALL",
      maxWeightGrams: 2000,
      maxLengthCm: 35,
      maxWidthCm: 25,
      maxHeightCm: 20,
      volumeScore: 3,
      allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"],
      displayOrder: 2,
    },
    {
      name: "MEDIUM",
      maxWeightGrams: 5000,
      maxLengthCm: 50,
      maxWidthCm: 40,
      maxHeightCm: 30,
      volumeScore: 6,
      allowedVehicles: ["MOTO", "CAR", "TRUCK"],
      displayOrder: 3,
    },
    {
      name: "LARGE",
      maxWeightGrams: 15000,
      maxLengthCm: 80,
      maxWidthCm: 60,
      maxHeightCm: 50,
      volumeScore: 10,
      allowedVehicles: ["CAR", "TRUCK"],
      displayOrder: 4,
    },
    {
      name: "XL",
      maxWeightGrams: 50000,
      maxLengthCm: 150,
      maxWidthCm: 100,
      maxHeightCm: 100,
      volumeScore: 20,
      allowedVehicles: ["TRUCK"],
      displayOrder: 5,
    },
  ];

  for (const cat of categories) {
    await prisma.packageCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
    console.log(`  ✅ PackageCategory: ${cat.name}`);
  }

  // ─── 2. Delivery Rates ─────────────────────────────────────────────────────

  const allCategories = await prisma.packageCategory.findMany();
  const rateDefaults: Record<string, { base: number; perKm: number }> = {
    MICRO: { base: 800, perKm: 200 },
    SMALL: { base: 1200, perKm: 300 },
    MEDIUM: { base: 1800, perKm: 400 },
    LARGE: { base: 2500, perKm: 500 },
    XL: { base: 4000, perKm: 700 },
  };

  for (const cat of allCategories) {
    const rate = rateDefaults[cat.name] || { base: 1500, perKm: 350 };
    await prisma.deliveryRate.upsert({
      where: { categoryId: cat.id },
      update: { basePriceArs: rate.base, pricePerKmArs: rate.perKm },
      create: {
        categoryId: cat.id,
        basePriceArs: rate.base,
        pricePerKmArs: rate.perKm,
      },
    });
    console.log(`  ✅ DeliveryRate: ${cat.name} → base $${rate.base} + $${rate.perKm}/km`);
  }

  // ─── 3. MoovyConfig ────────────────────────────────────────────────────────

  const configs = [
    { key: "driver_response_timeout_seconds", value: "20", description: "Segundos que un repartidor tiene para aceptar/rechazar una oferta" },
    { key: "merchant_confirm_timeout_seconds", value: "180", description: "Segundos que un comercio tiene para confirmar un pedido nuevo" },
    { key: "max_delivery_distance_km", value: "50", description: "Distancia máxima de entrega en kilómetros" },
    { key: "min_order_amount_ars", value: "500", description: "Monto mínimo de pedido en pesos argentinos" },
    { key: "seller_commission_pct", value: "10", description: "Porcentaje de comisión predeterminado para vendedores" },
    { key: "driver_commission_pct", value: "15", description: "Porcentaje de comisión predeterminado para repartidores" },
    { key: "max_assignment_attempts", value: "5", description: "Intentos máximos para asignar un repartidor antes de escalar a ops" },
    { key: "assignment_rating_radius_meters", value: "300", description: "Radio en metros para priorizar repartidores por rating" },
    { key: "scheduled_notify_before_minutes", value: "30", description: "Minutos antes de un pedido programado para notificar al comercio" },
    { key: "scheduled_cancel_if_no_confirm_minutes", value: "10", description: "Minutos para cancelar automáticamente si no hay confirmación de pedido programado" },
  ];

  for (const cfg of configs) {
    await prisma.moovyConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value, description: cfg.description },
      create: cfg,
    });
    console.log(`  ✅ MoovyConfig: ${cfg.key} = ${cfg.value}`);
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
