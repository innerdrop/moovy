// scripts/db-extensiones.mjs — activa las extensiones de Postgres que necesita
// la búsqueda (feat/busqueda-inteligente, 2026-07-28).
//
//   unaccent → comparar ignorando tildes ("cafe" encuentra "Café La Nube")
//   pg_trgm  → medir cuánto se PARECEN dos textos (tolerancia a errores de tipeo)
//
// Se corre UNA sola vez por base: en la local y en la del servidor. Es seguro
// repetirlo (IF NOT EXISTS) y no toca ningún dato.
//
//   npm run db:extensiones
//
// En el VPS, después del deploy:
//   docker exec moovy-db psql -U <usuario> -d moovy_db \
//     -c 'CREATE EXTENSION IF NOT EXISTS unaccent; CREATE EXTENSION IF NOT EXISTS pg_trgm;'
//
// Si no se activan, la búsqueda NO se rompe: cae al comportamiento viejo (sin
// acentos ni parecidos) y avisa en el log. Ver src/lib/search.ts.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXTENSIONES = ["unaccent", "pg_trgm"];

async function main() {
    console.log("[db-extensiones] Activando extensiones de búsqueda...\n");

    for (const ext of EXTENSIONES) {
        try {
            await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS ${ext}`);
            console.log(`  OK    ${ext}`);
        } catch (error) {
            console.error(`  FALLO ${ext}`);
            console.error(`        ${error instanceof Error ? error.message : String(error)}`);
            console.error(
                `        Puede que el usuario de la base no tenga permiso para crear extensiones.\n` +
                `        Pedile al administrador que corra: CREATE EXTENSION IF NOT EXISTS ${ext};`
            );
        }
    }

    // Verificación real: no alcanza con que el CREATE no haya fallado.
    console.log("\n[db-extensiones] Verificando que funcionen de verdad...");
    try {
        const [{ prueba }] = await prisma.$queryRawUnsafe(
            "SELECT unaccent('Café Ñandú') AS prueba"
        );
        console.log(`  unaccent('Café Ñandú') = '${prueba}'  ${prueba === "Cafe Nandu" ? "✓" : "(revisar)"}`);
    } catch {
        console.log("  unaccent NO disponible — la búsqueda va a ignorar los acentos.");
    }

    try {
        const [{ parecido }] = await prisma.$queryRawUnsafe(
            "SELECT similarity('cocacola', 'coca cola') AS parecido"
        );
        console.log(`  similarity('cocacola','coca cola') = ${Number(parecido).toFixed(2)}  ✓`);
    } catch {
        console.log("  pg_trgm NO disponible — sin tolerancia a errores de tipeo.");
    }

    console.log("\n[db-extensiones] Listo.");
}

main()
    .catch((e) => {
        console.error("[db-extensiones] Error inesperado:", e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
