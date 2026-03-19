/**
 * Seed: Creates STORE and MARKETPLACE categories with proper scope.
 * Run: node scripts/seed-categories.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STORE = [
    { name: "Comidas", icon: "restaurant", description: "Restaurantes, rotiserías, cocinas" },
    { name: "Cafeterías", icon: "coffee", description: "Cafés, panaderías, medialunas" },
    { name: "Supermercado", icon: "shopping-cart", description: "Almacenes, despensas, mayoristas" },
    { name: "Bebidas", icon: "wine", description: "Vinotecas, distribuidoras, cervecerías" },
    { name: "Farmacia", icon: "pill", description: "Farmacias, dietéticas, salud" },
    { name: "Kiosco", icon: "candy", description: "Kioscos, golosinas, snacks" },
    { name: "Mascotas", icon: "pet", description: "Veterinarias, pet shops" },
    { name: "Helados", icon: "ice-cream", description: "Heladerías, postres" },
];

const MARKETPLACE = [
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

function toSlug(name) {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function upsertCategories(list, scope, startOrder) {
    let order = startOrder;
    for (const cat of list) {
        const slug = toSlug(cat.name);
        const existing = await prisma.category.findUnique({ where: { slug } });

        if (existing) {
            if (existing.scope === "BOTH" || existing.scope !== scope) {
                await prisma.category.update({
                    where: { id: existing.id },
                    data: { scope, order: order++, description: cat.description },
                });
                console.log(`  -> ${cat.name} — actualizado a ${scope}`);
            } else {
                console.log(`  -- ${cat.name} — ya existe (${existing.scope})`);
                order++;
            }
        } else {
            await prisma.category.create({
                data: { name: cat.name, slug, icon: cat.icon, description: cat.description, scope, isActive: true, order: order++ },
            });
            console.log(`  ++ ${cat.name} — creada`);
        }
    }
}

async function main() {
    console.log("\nTIENDA:\n");
    await upsertCategories(STORE, "STORE", 1);

    console.log("\nMARKETPLACE:\n");
    await upsertCategories(MARKETPLACE, "MARKETPLACE", 100);

    const all = await prisma.category.findMany({ orderBy: { order: "asc" }, select: { name: true, scope: true, isActive: true } });
    console.log("\n--- RESULTADO FINAL ---\n");
    console.log("TIENDA:", all.filter(c => c.scope === "STORE").map(c => c.name).join(", "));
    console.log("MARKETPLACE:", all.filter(c => c.scope === "MARKETPLACE").map(c => c.name).join(", "));
    const both = all.filter(c => c.scope === "BOTH");
    if (both.length) console.log("AMBOS:", both.map(c => c.name).join(", "));
    console.log(`\nTotal: ${all.length} categorias\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
