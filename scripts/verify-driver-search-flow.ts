/**
 * verify-driver-search-flow.ts — Verificación de la rama
 * feat/asignacion-reintento-y-reembolso (contra DB real, SIN side effects).
 *
 * Confirma el wiring del flujo "pedido pagado nunca queda sin asignar":
 *   1. Schema: existe Order.driverSearchUntil.
 *   2. Config: ventana de búsqueda (driver_search_window_minutes).
 *   3. El motor exporta las funciones nuevas.
 *   4. Estado actual: pedidos en SEARCHING_DRIVER + su ventana.
 *   5. Conflicto: ningún pedido en búsqueda debería estar sin pagar.
 *
 * NO ejecuta reembolsos ni toca MercadoPago — solo lectura.
 *
 * Uso: npx tsx scripts/verify-driver-search-flow.ts
 * Requiere: DATABASE_URL configurada.
 */

import { prisma } from "../src/lib/prisma";
import * as engine from "../src/lib/assignment-engine";

async function main() {
    let ok = true;
    console.log("=== Verificación: buscando-repartidor + reembolso automático ===\n");

    // 0. Conexión a la base (antes de todo, para no confundir "base apagada" con "falta campo")
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        console.log("❌ No se puede conectar a la base PostGIS en :5436.");
        console.log("   Levantá el Docker de la base (ej: `docker compose up -d`) y volvé a correr.");
        await prisma.$disconnect().catch(() => {});
        process.exit(1);
    }

    // 1. Schema
    try {
        await prisma.order.findFirst({ select: { id: true, driverSearchUntil: true } });
        console.log("✅ Schema: Order.driverSearchUntil presente");
    } catch (e) {
        ok = false;
        console.log("❌ Schema: falta driverSearchUntil — corré `npx prisma db push`");
        console.error(e);
    }

    // 2. Config de la ventana
    const cfg = await prisma.moovyConfig.findUnique({ where: { key: "driver_search_window_minutes" } });
    const windowMin = cfg ? parseInt(cfg.value, 10) : 20;
    console.log(`✅ Ventana de búsqueda: ${windowMin} min ${cfg ? "(seteada en DB)" : "(default — editable en /ops/configuracion-logistica)"}`);

    // 3. Exports del motor
    const expected = ["retrySearchingOrder", "retryAllSearchingOrders", "startAssignmentCycle", "processExpiredAssignments"];
    for (const fn of expected) {
        const present = typeof (engine as Record<string, unknown>)[fn] === "function";
        if (!present) ok = false;
        console.log(`${present ? "✅" : "❌"} export motor: ${fn}`);
    }

    // 4. Estado actual
    const searching = await prisma.order.findMany({
        where: { status: "SEARCHING_DRIVER", deletedAt: null },
        select: { orderNumber: true, driverSearchUntil: true, paymentStatus: true },
    });
    console.log(`\n📦 Pedidos en SEARCHING_DRIVER ahora: ${searching.length}`);
    const now = new Date();
    for (const o of searching) {
        const win = o.driverSearchUntil
            ? (o.driverSearchUntil > now ? "ventana abierta" : "VENTANA VENCIDA → el cron lo reembolsa")
            : "sin fecha límite (raro)";
        console.log(`   - ${o.orderNumber} · pago: ${o.paymentStatus} · ${win}`);
    }

    // 5. Conflicto: todo SEARCHING_DRIVER debería estar PAID
    const noPagados = searching.filter((o) => o.paymentStatus !== "PAID");
    if (noPagados.length > 0) {
        ok = false;
        console.log(`\n⚠️  ${noPagados.length} pedido(s) en búsqueda SIN estar pagados — no debería pasar.`);
    } else {
        console.log("\n✅ Consistencia: todos los pedidos en búsqueda están pagados.");
    }

    console.log(`\n=== Resultado: ${ok ? "OK ✅" : "HAY OBSERVACIONES ❌"} ===`);
    await prisma.$disconnect();
    process.exit(ok ? 0 : 1);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
});
