/**
 * Validación de la rama `fix/bugs-checkout-pre-launch`.
 *
 * 4 bugs detectados durante testing live de pagos (2026-04-26):
 *
 *   (A) Pedido recién creado aparece en "Historial" en lugar de "En curso".
 *       Causa: AWAITING_PAYMENT no estaba en el array activeStatuses.
 *       Fix: agregar AWAITING_PAYMENT (y PENDING_PAYMENT por compatibilidad legacy).
 *
 *   (B) UI muestra repartidor cuando no hay drivers online.
 *       Estado: pendiente confirmar con Mauro qué vio exactamente.
 *       Hipótesis: driver real asignado en milisegundos antes de desconectarse.
 *       NO se incluye fix en esta rama hasta confirmar.
 *
 *   (C) Checkout permite pedido a domicilio sin validación server-side de drivers.
 *       Causa: el frontend chequea hasDrivers solo al MONTAR el checkout. Si los
 *       drivers se desconectan después, el server crea el pedido igual y queda en
 *       estado zombie.
 *       Fix: validación en POST /api/orders rechaza con 409 + errorCode
 *       NO_DRIVERS_AVAILABLE si no hay drivers online (solo IMMEDIATE no-pickup).
 *       UI checkout maneja el 409 mostrando opciones (programar / pickup / avisame).
 *
 *   (D) Redirect post-pago MP va a la home en vez del detalle del pedido.
 *       Causa: back_urls.success apuntaba a /checkout/mp-return sin orderId.
 *       Si MP no envía preference_id (sandbox glitch) o el polling timeout, el user
 *       queda perdido.
 *       Fix: pasar orderId como query param en back_urls. La página mp-return tiene
 *       referencia directa al pedido. El timeout linkea al detalle, no al listado.
 *
 * No requiere conexión a DB — todos los checks son estáticos.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

const checks: { section: string; name: string; pass: boolean; detail?: string }[] = [];

function fileContains(rel: string, needles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const missing = needles.filter(n => !content.includes(n));
    return { ok: missing.length === 0, missing };
}

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// ═══════════════════════════════════════════════════════════════════════════
// (A) Bug A — AWAITING_PAYMENT en activeStatuses
// ═══════════════════════════════════════════════════════════════════════════

add("A", "/mis-pedidos: AWAITING_PAYMENT incluido en activeStatuses",
    fileContains("src/app/(store)/mis-pedidos/page.tsx", [
        '"AWAITING_PAYMENT"',
        '"PENDING_PAYMENT"',
        // Comentario de la rama documentando el cambio
        'fix/bugs-checkout-pre-launch',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (C) Bug C — validación server-side de drivers online en POST /api/orders
// ═══════════════════════════════════════════════════════════════════════════

add("C", "POST /api/orders: chequea onlineDriversCount cuando IMMEDIATE no-pickup",
    fileContains("src/app/api/orders/route.ts", [
        '!isPickup && deliveryType !== "SCHEDULED"',
        'isOnline: true',
        'availabilityStatus: "DISPONIBLE"',
        'onlineDriversCount === 0',
    ])
);

add("C", "POST /api/orders: rechaza con 409 + errorCode NO_DRIVERS_AVAILABLE",
    fileContains("src/app/api/orders/route.ts", [
        'errorCode: "NO_DRIVERS_AVAILABLE"',
        'status: 409',
        'no hay repartidores disponibles',
    ])
);

add("C", "checkout/page.tsx: maneja el 409 NO_DRIVERS_AVAILABLE → setHasDrivers(false) + SCHEDULED",
    fileContains("src/app/(store)/checkout/page.tsx", [
        'errorCode === "NO_DRIVERS_AVAILABLE"',
        'setHasDrivers(false)',
        'setDeliveryType("SCHEDULED")',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (D) Bug D — redirect post-pago MP debe tener orderId
// ═══════════════════════════════════════════════════════════════════════════

add("D", "buildPreferenceBody: returnUrl incluye orderId como query param",
    fileContains("src/lib/mercadopago.ts", [
        '/checkout/mp-return?orderId=${order.id}',
    ])
);

add("D", "/checkout/mp-return: timeout linkea al detalle del pedido si hay orderId",
    fileContains("src/app/(store)/checkout/mp-return/page.tsx", [
        'continueHref',
        'resolvedOrderId ? `/mis-pedidos/${resolvedOrderId}`',
        'Ver mi pedido',
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/bugs-checkout-pre-launch");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Bug A — AWAITING_PAYMENT en activeStatuses",
    C: "Bug C — validación server-side drivers",
    D: "Bug D — redirect post-pago con orderId",
};

let failed = 0;
let lastSection = "";
for (const c of checks) {
    if (c.section !== lastSection) {
        console.log(`\n${CYAN}── (${c.section}) ${sections[c.section] ?? c.section}${RESET}`);
        lastSection = c.section;
    }
    const icon = c.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${icon} ${c.name}`);
    if (!c.pass && c.detail) console.log(`    ${YELLOW}faltan: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
console.log(`${YELLOW}Bug B (driver fantasma): pendiente confirmación de Mauro.${RESET}`);
console.log(`${YELLOW}NO se incluye fix en esta rama hasta confirmar qué se vio.${RESET}\n`);

if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  Bug A — En curso vs Historial:");
    console.log("    1. Hacé pedido con MP. Como webhook no llega en localhost, queda en AWAITING_PAYMENT.");
    console.log("    2. Andá a /mis-pedidos. El pedido tiene que aparecer en tab 'En curso' (NO Historial).");
    console.log("");
    console.log("  Bug C — Validación drivers server-side:");
    console.log("    1. Asegurate que NO hay drivers online (logout de drivers o desconectalos desde panel).");
    console.log("    2. Hacé un pedido a domicilio (no pickup) inmediato.");
    console.log("    3. El backend tiene que rechazar con error 'No hay repartidores disponibles'.");
    console.log("    4. La UI debe cambiar a SCHEDULED automáticamente y mostrar la sección con opciones.");
    console.log("");
    console.log("  Bug D — Redirect post-pago:");
    console.log("    1. Hacé pedido con MP, completá pago en sandbox.");
    console.log("    2. La URL de retorno (ya en localhost) debe tener ?orderId=... en la URL.");
    console.log("    3. Si llegás al timeout (60s sin webhook), el botón debe decir 'Ver mi pedido' (no 'Ir a mis pedidos') y linkear a /mis-pedidos/[id].\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
