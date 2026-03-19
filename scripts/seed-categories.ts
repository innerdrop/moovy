/**
 * Seed script: Creates STORE and MARKETPLACE categories with proper scope.
 *
 * Run: npx ts-node --skip-project scripts/seed-categories.ts
 *
 * - Skips categories that already exist (matched by slug)
 * - Updates scope of existing categories if they were "BOTH"
 * - Safe to run multiple times (idempotent)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STORE_CATEGORIES = [
    { name: "Comidas", icon: "restaurant", description: "Restaurantes, rotiserías, cocinas" },
    { name: "Cafeterías", icon: "coffee", description: "Cafés, panaderías, medialunas" },
    { name: "Supermercado", icon: "shopping-cart", description: "Almacenes, despensas, mayoristas" },
    { name: "Bebidas", icon: "wine", description: "Vinotecas, distribuidoras, cervecerías" },
    { name: "Farmacia", icon: "pill", description: "Farmacias, dietéticas, salud" },
    { name: "Kiosco", icon: "candy", description: "Kioscos, golosinas, snacks" },
    { name: "Mascotas", icon: "pet", description: "Veterinarias, pet shops" },
    { name: "Helados", icon: "ice-cream", description: "Heladerías, postres" },
];

const MARKETPLACE_CATEGORIES = [
    { name: "Electrónica", icon: "smartphone", description: "Celulares, notebooks, tablets, cámaras" },
    { name: "Ropa y Calzado", icon: "shirt", description: "Ropa, zapatillas, accesorios" },
    { name: "Hogar", icon: "home", description: "Muebles, decoración, electrodomésticos" },
    { name: "Deportes", icon: "dumbbell", description: "Equipamiento, camping, ski, bicicletas" },
    { name: "Vehículos", icon: "car", description: "Motos, autos, repuestos" },
    { name: "Gaming", icon: "gamepad", description: "Consolas, juegos, periféricos" },
    { name: "Bebés y Niños", icon: "baby", description: "Ropa infantil, juguetes, cochecitos" },
    { name: "Herramientas", icon: "wrench", description: "Herramientas, materiales, jardín" },
    { name: "Libros y Música", icon: "book", description: "Libros, instrumentos, vinilos" },
    { name: "Belleza", icon: "sparkles", description: "Perfumes, maquillaje, cuidado personal" },
];

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

async function main() {
    console.log("🏪 Creando categorías de TIENDA...\n");

    let order = 1;

    for (const cat of STORE_CATEGORIES) {
        const slug = toSlug(cat.name);
        const existing = await prisma.category.findUnique({ where: { slug } });

        if (existing) {
            // Update scope if it was generic
            if (existing.scope === "BOTH") {
                await prisma.category.update({
                    where: { id: existing.id },
                    data: { scope: "STORE", order: order++, description: cat.description },
                });
                console.log(`  ✅ ${cat.name} — actualizado a STORE`);
            } else {
                console.log(`  ⏭️  ${cat.name} — ya existe (scope: ${existing.scope})`);
                order++;
            }
        } else {
            await prisma.category.create({
                data: {
                    name: cat.name,
                    slug,
                    icon: cat.icon,
                    description: cat.description,
                    scope: "STORE",
                    isActive: true,
                    order: order++,
                },
            });
            console.log(`  🆕 ${cat.name} — creada`);
        }
    }

    console.log("\n🛍️  Creando categorías de MARKETPLACE...\n");

    order = 100; // Offset para que no colisionen los orders

    for (const cat of MARKETPLACE_CATEGORIES) {
        const slug = toSlug(cat.name);
        const existing = await prisma.category.findUnique({ where: { slug } });

        if (existing) {
            if (existing.scope === "BOTH") {
                await prisma.category.update({
                    where: { id: existing.id },
                    data: { scope: "MARKETPLACE", order: order++, description: cat.description },
                });
                console.log(`  ✅ ${cat.name} — actualizado a MARKETPLACE`);
            } else {
                console.log(`  ⏭️  ${cat.name} — ya existe (scope: ${existing.scope})`);
                order++;
            }
        } else {
            await prisma.category.create({
                data: {
                    name: cat.name,
                    slug,
                    icon: cat.icon,
                    description: cat.description,
                    scope: "MARKETPLACE",
                    isActive: true,
                    order: order++,
                },
            });
            console.log(`  🆕 ${cat.name} — creada`);
        }
    }

    // List final state
    const all = await prisma.category.findMany({
        orderBy: { order: "asc" },
        select: { name: true, scope: true, isActive: true, order: true },
    });

    console.log("\n📋 Estado final de categorías:\n");
    console.log("  TIENDA:");
    all.filter(c => c.scope === "STORE").forEach(c => console.log(`    ${c.isActive ? "🟢" : "🔴"} ${c.name}`));
    console.log("\n  MARKETPLACE:");
    all.filter(c => c.scope === "MARKETPLACE").forEach(c => console.log(`    ${c.isActive ? "🟢" : "🔴"} ${c.name}`));
    console.log("\n  AMBOS:");
    all.filter(c => c.scope === "BOTH").forEach(c => console.log(`    ${c.isActive ? "🟢" : "🔴"} ${c.name}`));

    console.log(`\n✨ Total: ${all.length} categorías\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
