/**
 * ¿Cuántos comercios desaparecerían de la home al exigir un producto publicado?
 *
 * feat/el-panel-dice-la-verdad (2026-08-02). Hasta esta rama la home mostraba
 * cualquier comercio activo, aprobado y con logo — sin pedirle un solo producto.
 * El panel del comercio, en cambio, le prometía que nadie lo veía hasta cargar
 * el primero. Antes de alinear las dos cosas hay que saber a quién afecta.
 *
 * SOLO LEE. No escribe una sola fila.
 *
 * Uso:
 *   npx tsx scripts/check-comercios-sin-productos.ts
 *
 * Corre contra la base que apunte DATABASE_URL. Para mirar producción, poné la
 * URL de producción por delante en vez de cambiar el .env.
 */
import { prisma } from "../src/lib/prisma";

async function main() {
    const visibles = await prisma.merchant.findMany({
        where: { isActive: true, approvalStatus: "APPROVED", image: { not: null } },
        select: { id: true, name: true, slug: true, createdAt: true },
        orderBy: { name: "asc" },
    });

    // groupBy en vez de _count filtrado: no depende de ninguna preview feature
    // de Prisma y corre igual en cualquier versión.
    const conProducto = await prisma.product.groupBy({
        by: ["merchantId"],
        where: { isActive: true, deletedAt: null, merchantId: { not: null } },
        _count: { _all: true },
    });
    const tienen = new Set(conProducto.map((g) => g.merchantId));

    const sinProductos = visibles.filter((m) => !tienen.has(m.id));

    console.log("");
    console.log("Comercios visibles hoy en la home:", visibles.length);
    console.log("De esos, SIN ningún producto publicado:", sinProductos.length);
    console.log("");

    if (sinProductos.length === 0) {
        console.log("Nadie desaparece de la home. El cambio se puede deployar sin avisar a nadie.");
    } else {
        console.log("Estos dejarían de aparecer en la home y en /tiendas:");
        for (const m of sinProductos) {
            const alta = m.createdAt.toISOString().slice(0, 10);
            console.log(`  · ${m.name}  (/${m.slug})  — alta ${alta}`);
        }
        console.log("");
        console.log("Conviene avisarles antes del deploy: les alcanza con publicar un producto.");
    }
    console.log("");
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
