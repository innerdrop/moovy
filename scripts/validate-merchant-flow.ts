/**
 * Validación de la rama `fix/merchant-flow-pedidos`.
 *
 * 4 sub-fixes:
 *   A. CONFIRMED → PREPARING (endpoint confirm acepta CONFIRMED + UI muestra botón).
 *   B. Pickup self-contained (nuevo endpoint mark-picked-up + skip assignment + UI).
 *   C. SCHEDULED visibility (statusConfig + activeStatuses + endpoint confirm-scheduled).
 *   D. Toast in-app driver-available (helper emite socket + componente listener montado).
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

function fileExists(rel: string) {
    const full = path.join(ROOT, rel);
    return { ok: fs.existsSync(full), missing: fs.existsSync(full) ? [] : [`__file_not_found__: ${rel}`] };
}

function add(section: string, name: string, r: { ok: boolean; missing: string[] }) {
    checks.push({ section, name, pass: r.ok, detail: r.missing.join(" | ") });
}

// ─── (A) CONFIRMED → PREPARING ─────────────────────────────────────────
add("A", "Endpoint confirm acepta PENDING + CONFIRMED",
    fileContains("src/app/api/merchant/orders/[id]/confirm/route.ts", [
        'ALLOWED_PRE_STATES = ["PENDING", "CONFIRMED"]',
        "ALLOWED_PRE_STATES.includes(order.status)",
    ])
);

add("A", "Endpoint confirm: timeout solo para PENDING (no para CONFIRMED MP-paid)",
    fileContains("src/app/api/merchant/orders/[id]/confirm/route.ts", [
        'if (order.status === "PENDING") {',
        "merchant_confirm_timeout_seconds",
    ])
);

add("A", "UI merchant: botón Aceptar visible para PENDING + CONFIRMED",
    fileContains("src/app/comercios/(protected)/pedidos/page.tsx", [
        '(order.status === "PENDING" || order.status === "CONFIRMED")',
        "Aceptar y empezar a preparar",
    ])
);

add("A", "UI merchant: reject extendido a CONFIRMED + SCHEDULED",
    fileContains("src/app/comercios/(protected)/pedidos/page.tsx", [
        '["PENDING", "CONFIRMED", "PREPARING", "SCHEDULED", "SCHEDULED_CONFIRMED"].includes(order.status)',
    ])
);

// ─── (B) Pickup self-contained ──────────────────────────────────────────
add("B", "Endpoint mark-picked-up existe",
    fileExists("src/app/api/merchant/orders/[id]/mark-picked-up/route.ts")
);

add("B", "Endpoint mark-picked-up: gateado a isPickup=true + status=READY",
    fileContains("src/app/api/merchant/orders/[id]/mark-picked-up/route.ts", [
        "if (!order.isPickup)",
        'order.status !== "READY"',
        'status: "DELIVERED"',
        'isPickup: true',
        "awardOrderPointsIfDelivered",
    ])
);

add("B", "Endpoint confirm: skip assignment cycle si isPickup",
    fileContains("src/app/api/merchant/orders/[id]/confirm/route.ts", [
        "if (order.isPickup) {",
        "Skipping driver assignment for pickup",
    ])
);

add("B", "UI merchant: botón 'Marcar entregado al cliente' para isPickup + READY",
    fileContains("src/app/comercios/(protected)/pedidos/page.tsx", [
        'order.status === "READY" && order.isPickup',
        "markPickedUpByCustomer",
        "Marcar entregado al cliente",
    ])
);

// ─── (C) SCHEDULED visibility ───────────────────────────────────────────
add("C", "UI merchant: SCHEDULED y SCHEDULED_CONFIRMED en statusConfig",
    fileContains("src/app/comercios/(protected)/pedidos/page.tsx", [
        'SCHEDULED: { label: "Programado"',
        'SCHEDULED_CONFIRMED: { label: "Programado · confirmado"',
    ])
);

add("C", "UI merchant: SCHEDULED en activeStatuses",
    fileContains("src/app/comercios/(protected)/pedidos/page.tsx", [
        '"SCHEDULED", "SCHEDULED_CONFIRMED"',
    ])
);

add("C", "Endpoint confirm-scheduled para merchant existe",
    fileExists("src/app/api/merchant/orders/[id]/confirm-scheduled/route.ts")
);

add("C", "Endpoint confirm-scheduled: SCHEDULED → SCHEDULED_CONFIRMED + assignment si <45min",
    fileContains("src/app/api/merchant/orders/[id]/confirm-scheduled/route.ts", [
        'status: "SCHEDULED_CONFIRMED"',
        "minutesUntilSlot <= 45",
        "startAssignmentCycle",
        "!order.isPickup",
    ])
);

add("C", "UI merchant: botón 'Confirmar reserva' para SCHEDULED",
    fileContains("src/app/comercios/(protected)/pedidos/page.tsx", [
        'order.status === "SCHEDULED"',
        "confirmScheduled",
        "Confirmar reserva",
    ])
);

// ─── (D) Toast in-app driver-available ──────────────────────────────────
add("D", "Helper driver-availability: emite socket driver_available al room customer",
    fileContains("src/lib/driver-availability.ts", [
        '"driver_available"',
        '`customer:${sub.userId}`',
        "subscriptionId: sub.id",
    ])
);

add("D", "Componente DriverAvailableToast existe",
    fileExists("src/components/notifications/DriverAvailableToast.tsx")
);

add("D", "Componente: escucha event driver_available en room customer",
    fileContains("src/components/notifications/DriverAvailableToast.tsx", [
        '"driver_available"',
        "join_room",
        "customer:${userId}",
    ])
);

add("D", "Layout (store): monta DriverAvailableToast",
    fileContains("src/app/(store)/layout.tsx", [
        "DriverAvailableToast",
        "@/components/notifications/DriverAvailableToast",
    ])
);

// ─── REPORTE ────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════════════════════════");
console.log("  Validación: rama fix/merchant-flow-pedidos");
console.log("═══════════════════════════════════════════════════════════════════\n");

const sections: Record<string, string> = {
    A: "CONFIRMED → PREPARING (root cause)",
    B: "Pickup self-contained",
    C: "SCHEDULED visibility para merchants",
    D: "Toast in-app driver-available",
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
    process.exit(0);
} else {
    console.log(`${RED}${failed} check(s) fallaron${RESET} de ${checks.length}.\n`);
    process.exit(1);
}
