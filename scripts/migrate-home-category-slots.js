/**
 * Migración: Crear HomeCategorySlot para las categorías existentes que se mostraban en el home.
 *
 * Esto toma todas las categorías activas con scope STORE o BOTH y crea un slot
 * para cada una, preservando el orden actual.
 *
 * Ejecutar: node scripts/migrate-home-category-slots.js
 *
 * Es idempotente: si un slot ya existe para una categoría, lo ignora.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Migrando categorías existentes a HomeCategorySlot...\n");

  // Obtener categorías que se mostraban en el home (misma query que usaba page.tsx)
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      scope: { in: ["STORE", "BOTH"] },
    },
    orderBy: { order: "asc" },
  });

  console.log(`📦 Encontradas ${categories.length} categorías activas (STORE/BOTH)\n`);

  let created = 0;
  let skipped = 0;

  for (const cat of categories) {
    // Check if slot already exists
    const existing = await prisma.homeCategorySlot.findUnique({
      where: { categoryId: cat.id },
    });

    if (existing) {
      console.log(`  ⏭️  "${cat.name}" — ya tiene slot, saltando`);
      skipped++;
      continue;
    }

    await prisma.homeCategorySlot.create({
      data: {
        categoryId: cat.id,
        order: cat.order,
        // image, icon, label se dejan null → usa los de la categoría
        isActive: true,
      },
    });

    console.log(`  ✅ "${cat.name}" — slot creado (orden: ${cat.order})`);
    created++;
  }

  console.log(`\n✅ Migración completada: ${created} creados, ${skipped} saltados`);
  console.log(`\nAhora podés gestionar las categorías del home desde OPS → Categorías`);
}

main()
  .catch((e) => {
    console.error("❌ Error en migración:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
