/**
 * Validación de la rama `fix/mp-return-confirmacion`.
 *
 * Bug raíz: la página /checkout/mp-return hacía fetch a endpoints que
 * NO existían (/api/payments/by-preference, /api/payments/[orderId]/status)
 * → polling timeoutea a los 60s → "procesando tu pago" → buyer va a
 * /mis-pedidos y ve "Esperando pago" aunque MP ya cobró.
 *
 * Implementación:
 *   1. Helper canónico `confirmOrderPaymentFromMp()` en src/lib/order-payment-confirm.ts
 *      - Reusable desde webhook (ya tiene mpPayment) + endpoint polling (search por external_reference).
 *      - Idempotente: updateMany WHERE paymentStatus IN [AWAITING_PAYMENT, PENDING] con count check.
 *      - Side effects: socket emit a merchant/seller/admin/order + email confirmación.
 *   2. Endpoint /api/payments/[orderId]/status: si paymentStatus === AWAITING_PAYMENT y MP,
 *      llama al helper que consulta MP API directo. Devuelve confirmedJustNow flag.
 *   3. Endpoint /api/payments/by-preference: resuelve preferenceId → orderId.
 *   4. Webhook MP: la rama "approved" llama al helper en vez de la lógica inline duplicada.
 *   5. Polling activo en /mis-pedidos (lista) y /mis-pedidos/[orderId] (detalle):
 *      cuando detectan AWAITING_PAYMENT con MP, disparan /status para auto-confirmar.
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

function fileNotContains(rel: string, antiNeedles: string[]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return { ok: false, missing: ["__file_not_found__"] };
    const content = fs.readFileSync(full, "utf8");
    const found = antiNeedles.filter(n => content.includes(n));
    return { ok: found.length === 0, missing: found.map(f => `STILL HAS: ${f}`) };
}

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// (A) Helper canónico
add("A", "src/lib/order-payment-confirm.ts existe + exporta confirmOrderPaymentFromMp",
    fileContains("src/lib/order-payment-confirm.ts", [
        "export async function confirmOrderPaymentFromMp",
        "ConfirmResult",
        "paymentApi",
    ])
);

add("A", "Helper: idempotente — retorna alreadyConfirmed si ya estaba PAID",
    fileContains("src/lib/order-payment-confirm.ts", [
        'order.paymentStatus === "PAID"',
        "alreadyConfirmed: true",
    ])
);

add("A", "Helper: skipea si NO es mercadopago",
    fileContains("src/lib/order-payment-confirm.ts", [
        'order.paymentMethod !== "mercadopago"',
        "notApplicable: true",
    ])
);

add("A", "Helper: search MP API por external_reference cuando no hay mpPaymentRaw",
    fileContains("src/lib/order-payment-confirm.ts", [
        "paymentApi.search",
        "external_reference: orderId",
    ])
);

add("A", "Helper: validación de monto con tolerancia $1 (mismo criterio que webhook)",
    fileContains("src/lib/order-payment-confirm.ts", [
        "Math.abs(mpAmount - order.total)",
        "amountDiff > 1",
        "amount_mismatch",
    ])
);

add("A", "Helper: updateMany atómico contra carrera webhook ↔ polling",
    fileContains("src/lib/order-payment-confirm.ts", [
        "updateMany",
        '"AWAITING_PAYMENT", "PENDING"',
        "updateResult.count === 0",
    ])
);

add("A", "Helper: side effects fire-and-forget (socket + email)",
    fileContains("src/lib/order-payment-confirm.ts", [
        "emitPaymentConfirmedSocket",
        "sendConfirmationEmailSafe",
        "Promise.allSettled",
    ])
);

// (B) Endpoints
add("B", "/api/payments/[orderId]/status existe + usa el helper si AWAITING_PAYMENT",
    fileContains("src/app/api/payments/[orderId]/status/route.ts", [
        "confirmOrderPaymentFromMp",
        "@/lib/order-payment-confirm",
        "PENDING_STATES",
        "confirmedJustNow",
    ])
);

add("B", "/api/payments/[orderId]/status: ownership check (userId === session.user.id || admin)",
    fileContains("src/app/api/payments/[orderId]/status/route.ts", [
        "order.userId !== session.user.id",
        'hasAnyRole(session, ["ADMIN"])',
    ])
);

add("B", "/api/payments/by-preference existe + busca Order por mpPreferenceId",
    fileContains("src/app/api/payments/by-preference/route.ts", [
        "mpPreferenceId: preferenceId",
        "orderId: order.id",
    ])
);

// (C) Webhook migrado al helper
add("C", "Webhook MP: rama 'approved' llama a confirmOrderPaymentFromMp",
    fileContains("src/app/api/webhooks/mercadopago/route.ts", [
        "confirmOrderPaymentFromMp",
        "@/lib/order-payment-confirm",
        "mpPaymentRaw: mpPayment",
    ])
);

add("C", "Webhook MP: lógica inline de handleApproved fue eliminada",
    fileNotContains("src/app/api/webhooks/mercadopago/route.ts", [
        "async function handleApproved(",
        "await handleApproved(order",
    ])
);

// (D) Polling en páginas /mis-pedidos
add("D", "/mis-pedidos (lista): polling auto-confirm a /api/payments/[id]/status",
    fileContains("src/app/(store)/mis-pedidos/page.tsx", [
        "pendingProbeRef",
        "/api/payments/${order.id}/status",
        "confirmedJustNow",
    ])
);

add("D", "/mis-pedidos/[orderId] (detalle): polling auto-confirm a /api/payments/[id]/status",
    fileContains("src/app/(store)/mis-pedidos/[orderId]/page.tsx", [
        "paymentProbedRef",
        "/api/payments/${orderId}/status",
        "confirmedJustNow",
    ])
);

// (E) Root cause fix — paymentStatus AWAITING_PAYMENT al crear preference MP
add("E", "POST /api/orders: UPDATE post-preference setea paymentStatus=AWAITING_PAYMENT",
    fileContains("src/app/api/orders/route.ts", [
        'paymentStatus: "AWAITING_PAYMENT"',
        "mpPreferenceId: preference.id",
    ])
);

add("E", "/mis-pedidos (lista): filtro robusto cubre status Y paymentStatus",
    fileContains("src/app/(store)/mis-pedidos/page.tsx", [
        'o.status === "AWAITING_PAYMENT"',
        'o.paymentStatus === "AWAITING_PAYMENT"',
        'o.paymentStatus === "PENDING"',
    ])
);

add("E", "/mis-pedidos/[orderId] (detalle): filtro robusto cubre status Y paymentStatus",
    fileContains("src/app/(store)/mis-pedidos/[orderId]/page.tsx", [
        'order.status === "AWAITING_PAYMENT"',
        'order.paymentStatus === "AWAITING_PAYMENT"',
        'order.paymentStatus === "PENDING"',
    ])
);

add("E", "Helper /lib/order-payment-confirm: usa fetch REST a MP (NO SDK search)",
    fileContains("src/lib/order-payment-confirm.ts", [
        "https://api.mercadopago.com/v1/payments/search",
        "external_reference=",
        "Authorization: `Bearer ${accessToken}`",
    ])
);

// REPORTE
console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/mp-return-confirmacion");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Helper canónico confirmOrderPaymentFromMp",
    B: "Endpoints /api/payments/*",
    C: "Webhook MP migrado al helper",
    D: "Polling auto-confirm en /mis-pedidos",
    E: "Root cause + filtros robustos (NEW)",
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
    if (!c.pass && c.detail) console.log(`    ${YELLOW}detalle: ${c.detail}${RESET}`);
    if (!c.pass) failed++;
}

console.log("\n───────────────────────────────────────────────────────────────────");
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  1. En localhost: hacé un pedido con MP TEST + tarjeta APRO.");
    console.log("  2. Pagá. MP redirige a /checkout/mp-return o /mis-pedidos.");
    console.log("  3. Verificá: a los 3-15s el estado pasa de 'Esperando pago' → 'Confirmado'.");
    console.log("  4. En DB: Order.paymentStatus = PAID + status = CONFIRMED + paidAt seteado.");
    console.log("  5. En el panel del comercio: aparece el pedido CONFIRMED automáticamente.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
