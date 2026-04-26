/**
 * Validación de la rama `fix/refund-automatico`.
 *
 * Antes de esta rama: 5 endpoints cancelaban pedidos pagados pero NO disparaban
 * refund automático. El admin tenía que ir manual al panel de MP a devolver
 * la plata cada vez. Riesgo legal: buyer paga + admin/cron cancela → buyer
 * reclama refund → admin se olvida → escalación / disputa.
 *
 * Implementación:
 *   1. Helper canónico `refundOrderIfPaid()` en src/lib/order-refund.ts.
 *      Idempotente. Maneja todos los casos: not_mp / not_paid / already_refunded
 *      / mp_api_failure / success. Audit log + socket alert si falla.
 *   2. Email nuevo `sendOrderRefundedEmail` en email-legal-ux.ts (registro #319).
 *   3. Helper integrado en 4 endpoints que NO lo tenían:
 *      - POST /api/admin/orders/[id]/cancel  (admin cancel)
 *      - POST /api/orders/[id]/cancel        (buyer self-cancel)
 *      - POST /api/cron/merchant-timeout      (cron auto-cancel por timeout merchant)
 *      - POST /api/cron/scheduled-notify      (cron auto-cancel scheduled order)
 *   4. NO se tocan los 2 que ya lo tenían (battle-tested):
 *      - POST /api/merchant/orders/[id]/reject (merchant reject — refund inline)
 *      - POST /api/cron/retry-assignments      (auto-cancel sin drivers — refund inline)
 *   5. NO se modifica /api/admin/orders/cleanup (batch silencioso de drift,
 *      no flow normal — queda fuera de esta rama).
 *
 * Patrón: dynamic import + fire-and-forget en el caller. La cancelación NUNCA
 * falla por un refund roto. Si el refund a MP falla, audit log + socket emit
 * `refund_failed` a `admin:orders` para resolución manual.
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
// (A) Helper canónico refundOrderIfPaid
// ═══════════════════════════════════════════════════════════════════════════

add("A", "src/lib/order-refund.ts existe + exports refundOrderIfPaid",
    fileContains("src/lib/order-refund.ts", [
        "export async function refundOrderIfPaid",
        "createRefund",
        "auditLog",
    ])
);

add("A", "Helper: idempotente — skipea si paymentStatus === REFUNDED",
    fileContains("src/lib/order-refund.ts", [
        'order.paymentStatus === "REFUNDED"',
        "alreadyRefunded: true",
    ])
);

add("A", "Helper: skipea si NO es mercadopago o NO está PAID",
    fileContains("src/lib/order-refund.ts", [
        'order.paymentMethod !== "mercadopago"',
        'order.paymentStatus !== "PAID"',
        "notApplicable: true",
    ])
);

add("A", "Helper: actualiza Order.paymentStatus REFUNDED + Payment.mpStatus refunded",
    fileContains("src/lib/order-refund.ts", [
        'paymentStatus: "REFUNDED"',
        'mpStatus: "refunded"',
    ])
);

add("A", "Helper: audit log ORDER_REFUND_TRIGGERED + ORDER_REFUND_FAILED",
    fileContains("src/lib/order-refund.ts", [
        '"ORDER_REFUND_TRIGGERED"',
        '"ORDER_REFUND_FAILED"',
    ])
);

add("A", "Helper: socket emit refund_failed a admin:orders cuando MP falla",
    fileContains("src/lib/order-refund.ts", [
        '"refund_failed"',
        '"admin:orders"',
        "socketEmitToRooms",
    ])
);

add("A", "Helper: dispara sendOrderRefundedEmail al buyer (gated por sendEmail flag)",
    fileContains("src/lib/order-refund.ts", [
        "sendOrderRefundedEmail",
        "@/lib/email-legal-ux",
        "if (sendEmail",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (B) Email + EMAIL_REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

add("B", "email-legal-ux: exporta sendOrderRefundedEmail",
    fileContains("src/lib/email-legal-ux.ts", [
        "export async function sendOrderRefundedEmail",
        '"order_refunded"',
    ])
);

add("B", "email-registry: entry order_refunded #319",
    fileContains("src/lib/email-registry.ts", [
        "id: 'order_refunded'",
        "number: 319",
        "functionName: 'sendOrderRefundedEmail'",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (C) Integración en endpoints
// ═══════════════════════════════════════════════════════════════════════════

add("C", "/api/admin/orders/[id]/cancel: integra refundOrderIfPaid",
    fileContains("src/app/api/admin/orders/[id]/cancel/route.ts", [
        "refundOrderIfPaid",
        '@/lib/order-refund',
        'triggeredBy: "admin"',
    ])
);

add("C", "/api/orders/[id]/cancel (buyer): integra refundOrderIfPaid",
    fileContains("src/app/api/orders/[id]/cancel/route.ts", [
        "refundOrderIfPaid",
        '@/lib/order-refund',
        'triggeredBy: "buyer"',
    ])
);

add("C", "/api/cron/merchant-timeout: integra refundOrderIfPaid + reverseOrderPoints",
    fileContains("src/app/api/cron/merchant-timeout/route.ts", [
        "refundOrderIfPaid",
        '@/lib/order-refund',
        'triggeredBy: "cron"',
        "reverseOrderPoints",
    ])
);

add("C", "/api/cron/scheduled-notify: integra refundOrderIfPaid + reverseOrderPoints",
    fileContains("src/app/api/cron/scheduled-notify/route.ts", [
        "refundOrderIfPaid",
        '@/lib/order-refund',
        'triggeredBy: "cron"',
        "reverseOrderPoints",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// (D) Endpoint manual /api/ops/refund consolidado en el helper
// ═══════════════════════════════════════════════════════════════════════════

add("D", "/api/ops/refund: usa refundOrderIfPaid para PAID con MP",
    fileContains("src/app/api/ops/refund/route.ts", [
        "refundOrderIfPaid",
        '@/lib/order-refund',
        'triggeredBy: "admin"',
        'sendEmail: true',
    ])
);

add("D", "/api/ops/refund: distingue MP (refund real) vs manual (cash/test)",
    fileContains("src/app/api/ops/refund/route.ts", [
        "isPaidMP",
        'order.paymentMethod === "mercadopago"',
        "REFUND_PROCESSED_MANUAL",
        "refundedToMp",
    ])
);

// ═══════════════════════════════════════════════════════════════════════════
// REPORTE
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/refund-automatico");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "Helper canónico refundOrderIfPaid",
    B: "Email + EMAIL_REGISTRY",
    C: "Integración en 4 endpoints de cancelación",
    D: "Endpoint manual /api/ops/refund consolidado",
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
if (failed === 0) {
    console.log(`${GREEN}TODO OK${RESET} — ${checks.length}/${checks.length} checks pasaron.\n`);
    console.log("Probar manual:");
    console.log("  1. Hacé un pedido con MP TEST y pagá con tarjeta APRO.");
    console.log("  2. Como admin OPS, andá al pedido y cancelalo.");
    console.log("  3. Verificá:");
    console.log("     - En el panel MP TEST: el pago aparece como 'refunded'.");
    console.log("     - En tu DB (Prisma Studio): Order.paymentStatus = REFUNDED.");
    console.log("     - En tu inbox del buyer: email 'Te devolvimos $X — pedido MOV-XXXX'.");
    console.log("     - En audit log: ORDER_REFUND_TRIGGERED.");
    console.log("  4. Cancelá un pedido con paymentMethod=cash → no debería disparar refund");
    console.log("     (notApplicable). Tampoco mandar email. Solo cancela normal.");
    console.log("  5. Cancelá un pedido pagado dos veces (idempotencia) → segunda llamada");
    console.log("     devuelve alreadyRefunded=true sin tocar MP.\n");
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
